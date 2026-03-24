/**
 * civic-publisher — Self-Contained Version (Gateway-Free)
 * 
 * Auto-generates localized community posts from scout findings.
 * Includes all necessary shared logic to ensure successful deployment.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Shared Types ─────────────────────────────────────────────────────────────
type AgentRunStatus = 'success' | 'partial' | 'failed';
type AgentTriggerType = 'cron' | 'webhook' | 'event' | 'api' | 'manual' | 'queue' | 'seed';

interface AgentRun {
  agent_name: string;
  trigger_type: AgentTriggerType;
  items_scanned?: number;
  items_actioned?: number;
  items_failed?: number;
  duration_ms?: number;
  status: AgentRunStatus;
  error_summary?: string;
  metadata?: Record<string, unknown>;
}

interface Finding {
  id: string;
  title: string;
  summary: string;
  category: string;
  embedded?: boolean;
  processed?: boolean;
  published?: boolean;
  related_name?: string;
  county?: string;
}

interface PublisherTemplate {
  id: string;
  category: string;
  system_prompt: string;
  example_good?: string;
  example_bad?: string;
  requires_review: boolean;
  active: boolean;
}

interface Community {
  id: string;
  name: string;
  location_type: string;
  location_value: string;
  publisher_context?: string;
}

// ── Shared Utils ─────────────────────────────────────────────────────────────
const agentCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-internal-trigger",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...agentCorsHeaders, "Content-Type": "application/json" },
  });
}

async function logAgentRun(client: SupabaseClient, agentName: string, run: Omit<AgentRun, "agent_name">): Promise<void> {
  const { error } = await client.from("agent_runs").insert({
    agent_name: agentName,
    ...run
  });
  if (error) console.error(`[logAgentRun] Error: ${error.message}`);
}

// ── Shared LLM Client ────────────────────────────────────────────────────────
interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

async function callLLM(messages: LLMMessage[], options: LLMOptions = {}) {
  const providers = [
    {
      id: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: Deno.env.get("GROQ_API_KEY"),
      model: "llama-3.3-70b-versatile",
    },
    {
      id: "anthropic",
      url: "https://api.anthropic.com/v1/messages",
      key: Deno.env.get("ANTHROPIC_API_KEY"),
      model: "claude-3-5-haiku-20241022",
    }
  ];

  for (const provider of providers) {
    if (!provider.key) continue;

    try {
      if (provider.id === "groq") {
        const res = await fetch(provider.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${provider.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: provider.model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1024,
            response_format: options.jsonMode ? { type: "json_object" } : undefined,
          }),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return { content: data.choices[0].message.content, provider: "groq" };
      } else {
        const res = await fetch(provider.url, {
          method: "POST",
          headers: {
            "x-api-key": provider.key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: provider.model,
            system: messages.find(m => m.role === "system")?.content,
            messages: messages.filter(m => m.role !== "system"),
            max_tokens: options.maxTokens ?? 1024,
            temperature: options.temperature ?? 0.7,
          }),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return { content: data.content[0].text, provider: "anthropic" };
      }
    } catch (e) {
      console.warn(`[llm] ${provider.id} failed: ${e}`);
    }
  }
  throw new Error("All LLM providers failed");
}

function parseLLMJson<T>(content: string): T | null {
  try {
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ── Shared Embeddings ────────────────────────────────────────────────────────
async function embedText(text: string): Promise<number[]> {
  const jinaKey = Deno.env.get("JINA_API_KEY");
  if (!jinaKey) throw new Error("JINA_API_KEY not configured");

  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${jinaKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jina-embeddings-v3",
      input: [text],
      task: "text-matching",
      dimensions: 1024,
    }),
  });
  if (!res.ok) throw new Error(`Jina error ${res.status}`);
  const json = await res.json();
  return json.data[0].embedding;
}

// ── Local Utils ─────────────────────────────────────────────────────────────
const AGENT = "civic-publisher";
const log = {
  info: (msg: string) => console.log(`[${AGENT}] INFO: ${msg}`),
  warn: (msg: string) => console.warn(`[${AGENT}] WARN: ${msg}`),
  error: (msg: string) => console.error(`[${AGENT}] ERROR: ${msg}`),
};

async function resolveScope(client: SupabaseClient, finding: Finding) {
  const val = finding.related_name || finding.county;
  if (!val) {
    log.info(`No location for finding ${finding.id}, falling back to general interest communities`);
    const { data: general } = await client.from("communities")
      .select("id")
      .is("location_type", null)
      .limit(3);
    return { community_ids: (general || []).map((c: { id: string }) => c.id) };
  }

  // Broad search for matching community
  const { data } = await client.from("communities")
    .select("id")
    .or(`location_value.eq."${val}",and(location_type.eq.ward,location_value.ilike.%${val}%)`);
  
  const community_ids = (data || []).map((c: { id: string }) => c.id);
  
  if (!community_ids.length) {
    log.info(`No specific community matches found for "${val}" (Finding: ${finding.id}). Falling back to general.`);
    const { data: generalFallback } = await client.from("communities")
      .select("id")
      .is("location_type", null)
      .limit(2);
    return { community_ids: (generalFallback || []).map((c: { id: string }) => c.id) };
  }
  
  return { community_ids };
}

async function rewriteFinding(finding: Finding, template: PublisherTemplate, context: string | null, ward: string, county: string) {
  const systemPrompt = "You are a professional civic journalist for WanaIQ, localizing news for Kenyan communities.";
  const prompt = `Ward: ${ward}, County: ${county}\nContext: ${context || "None"}\nFinding: ${finding.title}\nSummary: ${finding.summary}\nReturn JSON with headline and body.`;
  
  try {
    const res = await callLLM([{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], { jsonMode: true });
    return parseLLMJson<{ headline: string; body: string; call_to_action?: string }>(res.content);
  } catch (e) {
    log.error(`Rewrite failed: ${e}`);
    return null;
  }
}

// ── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: agentCorsHeaders });

  const start = Date.now();
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let scanned = 0, actioned = 0, failed = 0;
  const previewPosts: {
    title: string;
    content: string;
    community_id: string;
    finding_id: string;
    finding_title: string;
    community_name: string;
    moderation_status: string;
    tags: string[];
  }[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const isSeed = !!body.seed;
    const isPreview = !!body.preview;
    const trigger = body.trigger || (isSeed ? "seed" : "cron");

    log.info(`Run started. Mode: ${isSeed ? "seed" : trigger}`);

    // Manual push
    if (body.publish_posts?.length > 0) {
      for (const p of body.publish_posts) {
        const { error } = await client.from("posts").insert({
          title: p.title,
          content: p.content,
          community_id: p.community_id,
          author_id: "66033a0b-3540-4ccd-988e-4ddae3057f8c",
          auto_generated: true,
          finding_id: p.finding_id,
          moderation_status: p.moderation_status || "approved",
          tags: p.tags || ["civic"],
        });
        if (error) { log.error(`Insert failed: ${error.message}`); failed++; }
        else { actioned++; await client.from("scout_findings").update({ published: true }).eq("id", p.finding_id); }
      }
      return jsonResponse({ ok: true, actioned, failed, message: "Posts published successfully" });
    }

    if (trigger === "manual" && isPreview) {
      log.info("Manual preview requested, scanning findings...");
    }

    let queueIds: string[] = [];
    if (trigger === "queue") {
      const { data: queueState } = await client
        .from("agent_state")
        .select("state_value")
        .eq("agent_name", AGENT)
        .eq("state_key", "publish_queue")
        .single();
      queueIds = (queueState?.state_value as string[]) || [];
      log.info(`Queue mode: ${queueIds.length} items in queue`);
    }

    // Load findings
    let findingsQuery = client.from("scout_findings").select("*");
    
    if (trigger === "queue") {
      if (!queueIds.length) return jsonResponse({ ok: true, message: "Queue is empty" });
      findingsQuery = findingsQuery.in("id", queueIds);
    } else if (isSeed) {
      findingsQuery = findingsQuery.limit(20);
    } else {
      findingsQuery = findingsQuery.limit(5).eq("published", false);
    }
    
    // Always only action processed findings
    findingsQuery = findingsQuery.eq("processed", true);
    
    const { data: findings } = await findingsQuery.returns<Finding[]>();
    if (!findings?.length) return jsonResponse({ ok: true, message: "No processed findings found" });

    const processedFindingIds: string[] = [];

    // Templates
    const { data: templates } = await client.from("publisher_templates").select("*").eq("active", true).returns<PublisherTemplate[]>();
    const templateMap = Object.fromEntries((templates || []).map((t: PublisherTemplate) => [t.category, t]));

    for (const finding of findings) {
      scanned++;
      const scope = await resolveScope(client, finding);
      if (!scope.community_ids.length) continue;

      const template = templateMap[finding.category] || templateMap.other;
      if (!template) { failed++; continue; }

      for (const cid of scope.community_ids) {
        const { data: comm } = await client.from("communities").select("*").eq("id", cid).single() as { data: Community | null };
        if (!comm) continue;

        const result = await rewriteFinding(finding, template, comm.publisher_context || null, comm.location_value || comm.name, comm.location_type === "county" ? comm.location_value : "");
        if (!result) { failed++; continue; }

        if (isPreview) { 
          previewPosts.push({
            title: result.headline,
            content: `${result.body}${result.call_to_action ? `\n\n${result.call_to_action}` : ""}`,
            community_id: cid,
            finding_id: finding.id,
            finding_title: finding.title,
            community_name: comm.name,
            moderation_status: "approved",
            tags: [finding.category || "civic"]
          });
          actioned++; 
          continue; 
        }

        const { error } = await client.from("posts").insert({
          title: result.headline,
          content: `${result.body}${result.call_to_action ? `\n\n${result.call_to_action}` : ""}`,
          community_id: cid,
          author_id: "66033a0b-3540-4ccd-988e-4ddae3057f8c",
          auto_generated: true,
          finding_id: finding.id,
          moderation_status: (template.requires_review || !isSeed) ? "pending_review" : "approved",
          tags: [finding.category || "civic"]
        });

        if (error) { log.error(`DB error: ${error.message}`); failed++; }
        else { 
          actioned++; 
          if (!processedFindingIds.includes(finding.id)) {
            processedFindingIds.push(finding.id);
          }
        }
      }
    }

    // Cleanup queue and mark published
    if (processedFindingIds.length > 0) {
      log.info(`Updating status for ${processedFindingIds.length} findings...`);
      await client.from("scout_findings")
        .update({ published: true })
        .in("id", processedFindingIds);
      
      if (trigger === "queue") {
        const remainingQueue = queueIds.filter(id => !processedFindingIds.includes(id));
        await client.from("agent_state")
          .update({ state_value: remainingQueue })
          .eq("agent_name", AGENT)
          .eq("state_key", "publish_queue");
        log.info(`Queue updated. ${remainingQueue.length} items remaining.`);
      }
    }

    await logAgentRun(client, AGENT, {
      trigger_type: trigger as AgentTriggerType,
      items_scanned: scanned,
      items_actioned: actioned,
      items_failed: failed,
      duration_ms: Date.now() - start,
      status: failed > 0 ? "partial" : "success",
    });

    if (isPreview) {
      log.info(`Preview generated for ${previewPosts.length} posts`);
      return jsonResponse({ ok: true, posts: previewPosts, actioned });
    }

    return jsonResponse({ ok: true, scanned, actioned, failed });

  } catch (e) {
    log.error(`Fatal: ${e}`);
    return jsonResponse({ error: String(e) }, 500);
  }
});
