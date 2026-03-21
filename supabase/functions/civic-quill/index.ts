/**
 * civic-quill — Issue Summarisation Agent
 *
 * Triggered via HTTP POST by admin or other agents.
 * Scoped solely to generating concise citizen-language summaries of civic issue clusters.
 *
 * Input:  POST { cluster_id, issues: string[], ward?: string }
 * Output: 3-sentence summary written to agent_proposals + draft_ready event emitted.
 */

import {
  agentCorsHeaders,
  jsonResponse,
  sb,
  createProposal,
  emitTypedEvent,
  logRun,
} from "../_shared/agentUtils.ts";
import { callLLM, parseLLMJson, truncate } from "../_shared/llmClient.ts";

const AGENT_NAME = "civic-quill";

const SYSTEM_PROMPT = `You are Quill, a civic communication AI for Kenyan citizens.
You write clear, factual, empathetic summaries of clustered civic issues — in plain English
that any Kenyan citizen can understand, regardless of education level.

Rules:
1. Use simple language. Avoid jargon.
2. Be factual — only summarise what is in the provided issues.
3. Exactly 3 sentences: (1) What the issue is, (2) Why it matters to citizens, (3) What should happen next.
4. Do NOT fabricate facts or add editorial opinion.
5. If ward information is provided, mention it in the first sentence.

Respond ONLY with valid JSON:
{
  "summary": "Three-sentence citizen-friendly summary.",
  "title": "Short descriptive title (max 80 characters)"
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: agentCorsHeaders });
  }

  const startTime = Date.now();
  const client = sb();

  try {
    const body = await req.json().catch(() => ({}));
    const { cluster_id, issues, ward } = body as {
      cluster_id?: string;
      issues?: string[];
      ward?: string;
    };

    if (!cluster_id || !Array.isArray(issues) || issues.length === 0) {
      return jsonResponse({ error: "Required: cluster_id (string) and issues (string[])" }, 400);
    }

    const issuesText = issues.map((iss, i) => `Issue ${i + 1}: ${iss}`).join("\n");
    const wardCtx = ward ? `Ward: ${ward}` : "";

    const response = await callLLM(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: truncate(
            `${wardCtx}\n\nCivic issue cluster to summarise:\n${issuesText}`,
            2000,
          ),
        },
      ],
      { maxTokens: 512, temperature: 0.3, jsonMode: true },
    );

    const parsed = parseLLMJson<{ summary: string; title: string }>(response.content);
    if (!parsed?.summary) {
      throw new Error("LLM returned invalid summary JSON");
    }

    // Write to agent_proposals for admin review
    const proposalId = await createProposal(client, AGENT_NAME, {
      proposal_type: "civic_summary",
      subject_type: "project",
      subject_id: cluster_id as unknown as string,
      reasoning: parsed.summary,
      confidence: 0.9,
      evidence: {
        title: parsed.title,
        ward: ward ?? null,
        issue_count: issues.length,
        cluster_id,
        llm_provider: response.provider,
      },
    });

    // Emit draft_ready event for downstream agents
    await emitTypedEvent(client, {
      event_type: "draft_ready",
      source_agent: AGENT_NAME,
      payload: {
        cluster_id,
        proposal_id: proposalId,
        title: parsed.title,
        summary: parsed.summary,
        ward: ward ?? null,
      },
    });

    await logRun(client, AGENT_NAME, {
      trigger_type: "api",
      items_scanned: issues.length,
      items_actioned: 1,
      items_failed: 0,
      duration_ms: Date.now() - startTime,
      status: "success",
      metadata: { cluster_id, proposal_id: proposalId },
    });

    return jsonResponse({
      ok: true,
      proposal_id: proposalId,
      title: parsed.title,
      summary: parsed.summary,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${AGENT_NAME}] Error:`, msg);

    await logRun(client, AGENT_NAME, {
      trigger_type: "api",
      items_scanned: 0,
      items_actioned: 0,
      items_failed: 1,
      duration_ms: Date.now() - startTime,
      status: "failed",
      error_summary: msg,
    }).catch(() => {});

    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
