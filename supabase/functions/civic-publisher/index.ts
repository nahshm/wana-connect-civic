/**
 * civic-publisher — Auto-generates localized community posts from scout findings.
 *
 * Two modes:
 *   - Ongoing: { trigger: 'cron' } — processes recent high-relevance findings
 *   - Seed:    { seed: true, community_id } — backfills a new community with 5 posts
 *
 * Uses Lovable AI Gateway for LLM rewriting.
 */
import { createClient } from "@supabase/supabase-js";
import {
  logAgentRun,
  emitEvent,
  agentCorsHeaders,
  jsonResponse,
  getAgentState,
  updateAgentState,
} from "../_shared/agentUtils.ts";
import { embedText } from "../_shared/embeddings.ts";

const AGENT = "civic-publisher";

function sb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// ── Scope Resolution ─────────────────────────────────────────────────────────
interface ScopeResult {
  community_ids: string[];
}

async function resolveScope(
  client: ReturnType<typeof sb>,
  finding: Record<string, unknown>,
): Promise<ScopeResult> {
  const relatedTo = (finding.related_to as string) || "";
  const relatedName = (finding.related_name as string) || "";
  const county = (finding.county as string) || "";

  let query;

  if (relatedTo === "ward" && relatedName) {
    // Rule 1: ward-level → exact match
    query = client
      .from("communities")
      .select("id")
      .eq("location_type", "ward")
      .eq("location_value", relatedName);
  } else if ((relatedTo === "county" || county) && !relatedTo.includes("national")) {
    // Rule 2: county-level → all communities in that county
    const countyVal = relatedName || county;
    query = client
      .from("communities")
      .select("id")
      .or(`and(location_type.eq.county,location_value.eq.${countyVal}),and(location_type.eq.ward,location_value.ilike.%${countyVal}%)`);
  } else {
    // Rule 3: national or unknown → all communities
    query = client.from("communities").select("id").limit(100);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`[${AGENT}] resolveScope error:`, error.message);
    return { community_ids: [] };
  }
  return { community_ids: (data || []).map((c: { id: string }) => c.id) };
}

// ── Dedup ────────────────────────────────────────────────────────────────────
async function isDuplicate(
  client: ReturnType<typeof sb>,
  text: string,
): Promise<boolean> {
  try {
    const embedding = await embedText(text);
    const { data } = await client.rpc("match_vectors", {
      query_embedding: embedding,
      match_threshold: 0.91,
      match_count: 1,
      filter_source: "scout",
    });
    return (data && data.length > 0);
  } catch {
    // If dedup fails, allow the post (better to publish than silently drop)
    return false;
  }
}

// ── LLM Rewrite ──────────────────────────────────────────────────────────────
async function rewriteFinding(
  finding: Record<string, unknown>,
  template: Record<string, unknown>,
  communityContext: string | null,
  ward: string,
  county: string,
): Promise<{ headline: string; body: string; call_to_action?: string } | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.error(`[${AGENT}] LOVABLE_API_KEY not set`);
    return null;
  }

  const systemPrompt = (template.system_prompt as string)
    .replace(/\{\{ward\}\}/g, ward)
    .replace(/\{\{county\}\}/g, county)
    + (communityContext ? `\n\nCOMMUNITY CONTEXT:\n${communityContext}` : "");

  const userPrompt = `SOURCE FINDING:
Title: ${finding.title}
Summary: ${finding.summary || ""}
Category: ${finding.category || "other"}
Relevance score: ${finding.relevance_score || "unknown"}

${template.example_good ? `GOOD EXAMPLE:\n${template.example_good}\n` : ""}
${template.example_bad ? `BAD EXAMPLE (avoid this style):\n${template.example_bad}\n` : ""}

Write a post for ${ward} residents.
Return valid JSON with keys: headline, body, call_to_action`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_post",
            description: "Create a civic post from a finding",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string" },
                body: { type: "string" },
                call_to_action: { type: "string" },
              },
              required: ["headline", "body"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_post" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error(`[${AGENT}] LLM error ${res.status}:`, t);
      return null;
    }

    const data = await res.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      return JSON.parse(toolCall.function.arguments);
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    }

    return null;
  } catch (e) {
    console.error(`[${AGENT}] rewrite error:`, e);
    return null;
  }
}

// ── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: agentCorsHeaders });
  }

  const start = Date.now();
  const client = sb();
  let scanned = 0, actioned = 0, failed = 0;

  try {
    const body = await req.json().catch(() => ({}));
    const isSeed = body.seed === true;
    const targetCommunityId = body.community_id as string | undefined;

    // Check global kill switch
    const autoPublish = await getAgentState(client, AGENT, "auto_publish");
    if (autoPublish === false && !isSeed) {
      return jsonResponse({ ok: true, message: "Auto-publish disabled" });
    }

    // Check for queued publish requests
    const publishQueue = (await getAgentState(client, AGENT, "publish_queue")) as string[] | null;
    const queuedIds = publishQueue || [];

    // Config
    const minRelevance = isSeed ? 0.5 : 0.7;
    const maxPostsPerCommunity = isSeed ? 5 : 2;
    const lookbackDays = isSeed ? 30 : 1;

    // Get findings
    let findingsQuery = client
      .from("scout_findings")
      .select("*")
      .eq("published", false)
      .gte("relevance_score", minRelevance)
      .gte("created_at", new Date(Date.now() - lookbackDays * 86400000).toISOString())
      .order("relevance_score", { ascending: false })
      .limit(isSeed ? 20 : 10);

    if (!isSeed) {
      findingsQuery = findingsQuery.eq("processed", true);
    }

    // If queued IDs exist, process those first
    if (queuedIds.length > 0) {
      const { data: queuedFindings } = await client
        .from("scout_findings")
        .select("*")
        .in("id", queuedIds.slice(0, 10));

      if (queuedFindings && queuedFindings.length > 0) {
        // Process queued findings - clear queue
        await updateAgentState(client, AGENT, "publish_queue", 
          queuedIds.slice(10));
        
        // Process them below
        const { data: templates } = await client.from("publisher_templates").select("*").eq("active", true);
        const templateMap = Object.fromEntries((templates || []).map((t: Record<string, unknown>) => [t.category, t]));

        for (const finding of queuedFindings) {
          scanned++;
          const scope = await resolveScope(client, finding);
          if (scope.community_ids.length === 0) { failed++; continue; }

          const template = templateMap[finding.category as string] || templateMap.other;
          if (!template) { failed++; continue; }

          let postsCreated = 0;
          for (const communityId of scope.community_ids) {
            if (postsCreated >= maxPostsPerCommunity) break;

            const { data: community } = await client
              .from("communities")
              .select("name, location_type, location_value, publisher_context")
              .eq("id", communityId)
              .single();

            if (!community) continue;

            const ward = community.location_value || community.name || "your area";
            const county = community.location_type === "county" ? community.location_value : "";

            const result = await rewriteFinding(finding, template, community.publisher_context, ward, county || "Kenya");
            if (!result) { failed++; continue; }

            const moderationStatus = (template as Record<string, unknown>).requires_review ? "pending_review" : "approved";

            const { error: insertError } = await client.from("posts").insert({
              title: result.headline,
              content: `${result.body}${result.call_to_action ? `\n\n${result.call_to_action}` : ""}`,
              community_id: communityId,
              author_id: "00000000-0000-0000-0000-000000000000", // system bot
              auto_generated: true,
              finding_id: finding.id,
              published_by_agent: AGENT,
              moderation_status: moderationStatus,
              tags: [finding.category || "civic"],
            });

            if (insertError) {
              console.error(`[${AGENT}] post insert error:`, insertError.message);
              failed++;
            } else {
              postsCreated++;
              actioned++;
            }
          }

          // Mark as published
          await client.from("scout_findings").update({ published: true }).eq("id", finding.id);
        }
      }
    }

    // Regular processing
    const { data: findings } = await findingsQuery;
    if (!findings || findings.length === 0) {
      await logAgentRun(client, AGENT, {
        trigger_type: isSeed ? "api" : "cron",
        items_scanned: scanned,
        items_actioned: actioned,
        items_failed: failed,
        duration_ms: Date.now() - start,
        status: "success",
        metadata: { mode: isSeed ? "seed" : "ongoing", message: "No findings to process" },
      });
      return jsonResponse({ ok: true, scanned, actioned, failed });
    }

    // Load templates
    const { data: templates } = await client.from("publisher_templates").select("*").eq("active", true);
    const templateMap = Object.fromEntries((templates || []).map((t: Record<string, unknown>) => [t.category, t]));

    for (const finding of findings) {
      scanned++;

      // Dedup check
      const dupText = `${finding.title} ${finding.summary || ""}`;
      if (await isDuplicate(client, dupText)) {
        await client.from("scout_findings").update({ published: true }).eq("id", finding.id);
        continue;
      }

      // Resolve scope
      let scopeResult: ScopeResult;
      if (isSeed && targetCommunityId) {
        scopeResult = { community_ids: [targetCommunityId] };
      } else {
        scopeResult = await resolveScope(client, finding);
      }

      if (scopeResult.community_ids.length === 0) { failed++; continue; }

      const template = templateMap[finding.category as string] || templateMap.budget;
      if (!template) { failed++; continue; }

      let postsCreated = 0;
      for (const communityId of scopeResult.community_ids) {
        if (postsCreated >= maxPostsPerCommunity) break;

        const { data: community } = await client
          .from("communities")
          .select("name, location_type, location_value, publisher_context")
          .eq("id", communityId)
          .single();

        if (!community) continue;

        const ward = community.location_value || community.name || "your area";
        const county = community.location_type === "county" ? community.location_value : "";

        const result = await rewriteFinding(finding, template, community.publisher_context, ward, county || "Kenya");
        if (!result) { failed++; continue; }

        // Determine moderation status
        let moderationStatus: string;
        if ((template as Record<string, unknown>).requires_review) {
          moderationStatus = "pending_review";
        } else if (isSeed) {
          moderationStatus = "approved";
        } else {
          moderationStatus = "pending_review"; // ongoing always needs review
        }

        // Backdating for seed mode
        const createdAt = isSeed
          ? new Date(Date.now() - postsCreated * 18 * 3600000).toISOString()
          : new Date().toISOString();

        const { error: insertError } = await client.from("posts").insert({
          title: result.headline,
          content: `${result.body}${result.call_to_action ? `\n\n${result.call_to_action}` : ""}`,
          community_id: communityId,
          author_id: "00000000-0000-0000-0000-000000000000",
          auto_generated: true,
          finding_id: finding.id,
          published_by_agent: AGENT,
          moderation_status: moderationStatus,
          tags: [finding.category || "civic"],
          created_at: createdAt,
        });

        if (insertError) {
          console.error(`[${AGENT}] post insert error:`, insertError.message);
          failed++;
        } else {
          postsCreated++;
          actioned++;
        }
      }

      // Mark finding as published
      await client.from("scout_findings").update({ published: true }).eq("id", finding.id);
    }

    await emitEvent(client, "insight_ready", AGENT, {
      mode: isSeed ? "seed" : "ongoing",
      findings_processed: scanned,
      posts_created: actioned,
    });

    await logAgentRun(client, AGENT, {
      trigger_type: isSeed ? "api" : "cron",
      items_scanned: scanned,
      items_actioned: actioned,
      items_failed: failed,
      duration_ms: Date.now() - start,
      status: failed > 0 && actioned === 0 ? "failed" : actioned > 0 ? "success" : "success",
      metadata: { mode: isSeed ? "seed" : "ongoing" },
    });

    return jsonResponse({ ok: true, scanned, actioned, failed });
  } catch (e) {
    console.error(`[${AGENT}] Fatal error:`, e);
    await logAgentRun(client, AGENT, {
      trigger_type: "cron",
      status: "failed",
      error_summary: e instanceof Error ? e.message : "Unknown error",
      duration_ms: Date.now() - start,
    });
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
