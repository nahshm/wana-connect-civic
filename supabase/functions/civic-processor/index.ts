/**
 * civic-processor — Idempotent post-processing pipeline
 *
 * Runs as a cron job (or manual trigger) after civic-scout has scraped findings.
 * Two pipelines:
 *   1. Embedding: reads scout_findings WHERE embedded = false → embeds → inserts into vectors
 *   2. Clustering: reads scout_findings WHERE processed = false AND embedded = true
 *      → groups by category → assigns cluster_id → triggers civic-quill per cluster
 *
 * Safe to re-run: only processes unprocessed rows. Failed rows stay unprocessed.
 */

import {
  agentCorsHeaders,
  jsonResponse,
  sb,
  emitTypedEvent,
  logRun,
} from "../_shared/agentUtils.ts";
import { embedText } from "../_shared/embeddings.ts";

const AGENT_NAME = "civic-processor";
const EMBED_BATCH_SIZE = 20;
const MIN_CLUSTER_SIZE = 2;

interface ScoutFinding {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source_url: string | null;
  relevance_score: number | null;
  embedded: boolean;
  processed: boolean;
}

// ── Pipeline 1: Embedding ────────────────────────────────────────────────────

async function embedPipeline(
  client: ReturnType<typeof sb>,
): Promise<{ embedded: number; failed: number }> {
  const { data: findings, error } = await client
    .from("scout_findings")
    .select("id, title, summary, category, source_url, relevance_score")
    .eq("embedded", false)
    .limit(EMBED_BATCH_SIZE);

  if (error) throw new Error(`Failed to query unembedded findings: ${error.message}`);
  if (!findings?.length) return { embedded: 0, failed: 0 };

  let embedded = 0;
  let failed = 0;

  for (const finding of findings as ScoutFinding[]) {
    try {
      const text = `${finding.title}\n\n${finding.summary ?? ""}`.trim();
      if (text.length < 20) {
        // Too short to embed meaningfully — mark as embedded to skip
        await client
          .from("scout_findings")
          .update({ embedded: true })
          .eq("id", finding.id);
        continue;
      }

      const embedding = await embedText(text);

      // Insert into vectors table for RAG retrieval
      const { error: insertError } = await client.from("vectors").insert({
        content: text,
        embedding,
        source_type: "scout",
        title: finding.title,
        metadata: {
          source: "civic-scout",
          finding_id: finding.id,
          category: finding.category,
          source_url: finding.source_url,
          relevance_score: finding.relevance_score,
        },
      });

      if (insertError) throw new Error(insertError.message);

      await client
        .from("scout_findings")
        .update({ embedded: true })
        .eq("id", finding.id);

      embedded++;

      // Rate limit
      await new Promise((r) => setTimeout(r, 120));
    } catch (err) {
      failed++;
      console.error(`[${AGENT_NAME}] Embed failed for ${finding.id}:`, err);
    }
  }

  return { embedded, failed };
}

// ── Pipeline 2: Clustering ───────────────────────────────────────────────────

async function clusterPipeline(
  client: ReturnType<typeof sb>,
  processorRunId: string,
): Promise<{ clustered: number; quillTriggered: number }> {
  const { data: findings, error } = await client
    .from("scout_findings")
    .select("id, title, summary, category")
    .eq("processed", false)
    .eq("embedded", true)
    .limit(100);

  if (error) throw new Error(`Failed to query unprocessed findings: ${error.message}`);
  if (!findings?.length) return { clustered: 0, quillTriggered: 0 };

  // Group by category
  const groups = new Map<string, ScoutFinding[]>();
  for (const f of findings as ScoutFinding[]) {
    const cat = f.category ?? "other";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(f);
  }

  let clustered = 0;
  let quillTriggered = 0;

  for (const [category, items] of groups) {
    const clusterId = crypto.randomUUID();

    // Update all findings in this group with cluster_id and processor_run_id
    const ids = items.map((f) => f.id);
    await client
      .from("scout_findings")
      .update({
        cluster_id: clusterId,
        processor_run_id: processorRunId,
        processed: true,
      })
      .in("id", ids);

    clustered += items.length;

    // Only trigger quill for groups with enough findings to summarise
    if (items.length >= MIN_CLUSTER_SIZE) {
      try {
        // civic-quill expects issues as string[] — serialize title + summary
        const issues = items.map((f) =>
          `${f.title}${f.summary ? `: ${f.summary}` : ""}`
        );

        // Invoke civic-quill to generate a summary for this cluster
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const quillRes = await fetch(`${supabaseUrl}/functions/v1/civic-quill`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cluster_id: clusterId,
            issues,
          }),
        });

        if (!quillRes.ok) {
          const errText = await quillRes.text();
          console.error(`[${AGENT_NAME}] Quill returned ${quillRes.status} for cluster ${clusterId}: ${errText}`);
        }

        quillTriggered++;
      } catch (err) {
        console.error(`[${AGENT_NAME}] Failed to trigger quill for cluster ${clusterId}:`, err);
      }
    }
  }

  return { clustered, quillTriggered };
}

// ── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: agentCorsHeaders });
  }

  const startTime = Date.now();
  const client = sb();
  const processorRunId = crypto.randomUUID();

  try {
    // Pipeline 1: Embed unembedded findings
    console.log(`[${AGENT_NAME}] Starting embedding pipeline...`);
    const embedResult = await embedPipeline(client);
    console.log(`[${AGENT_NAME}] Embedded: ${embedResult.embedded}, Failed: ${embedResult.failed}`);

    // Pipeline 2: Cluster and trigger quill
    console.log(`[${AGENT_NAME}] Starting clustering pipeline...`);
    const clusterResult = await clusterPipeline(client, processorRunId);
    console.log(`[${AGENT_NAME}] Clustered: ${clusterResult.clustered}, Quill triggered: ${clusterResult.quillTriggered}`);

    // Emit event
    await emitTypedEvent(client, {
      event_type: "ingest_complete",
      source_agent: AGENT_NAME,
      payload: {
        embedded: embedResult.embedded,
        embed_failed: embedResult.failed,
        clustered: clusterResult.clustered,
        quill_triggered: clusterResult.quillTriggered,
        processor_run_id: processorRunId,
      },
    });

    // Log run
    await logRun(client, AGENT_NAME, {
      trigger_type: "cron",
      items_scanned: embedResult.embedded + embedResult.failed + clusterResult.clustered,
      items_actioned: embedResult.embedded + clusterResult.clustered,
      items_failed: embedResult.failed,
      duration_ms: Date.now() - startTime,
      status: embedResult.failed > 0 ? "partial" : "success",
    });

    return jsonResponse({
      ok: true,
      embedded: embedResult.embedded,
      embed_failed: embedResult.failed,
      clustered: clusterResult.clustered,
      quill_triggered: clusterResult.quillTriggered,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${AGENT_NAME}] Fatal:`, msg);

    await logRun(client, AGENT_NAME, {
      trigger_type: "cron",
      items_scanned: 0,
      items_actioned: 0,
      items_failed: 1,
      duration_ms: Date.now() - startTime,
      status: "failed",
      error_summary: msg,
    });

    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
