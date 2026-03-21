/**
 * civic-steward — Content Moderation Agent
 *
 * Absorbs civic-guardian and content-moderation.
 * Two modes:
 *   Mode A (pre-publish): POST { content_type, content }
 *     → returns { verdict, category, confidence, reason, flags }
 *     → backward-compatible with existing callers
 *   Mode B (batch scan): POST { trigger: "cron"|"webhook", table?, record? }
 *     → scans recent posts/comments, takes moderation actions
 *
 * Uses shared llmClient (Groq → Anthropic waterfall).
 * Uses shared agentUtils for DB interaction.
 */

import {
  agentCorsHeaders,
  jsonResponse,
  sb,
  emitTypedEvent,
  logRun,
  hideContent,
  issueWarning,
  createProposal,
} from "../_shared/agentUtils.ts";
import { callLLM, parseLLMJson } from "../_shared/llmClient.ts";
import type { ModerationResult, ModerationCategory, ModerationVerdict } from "../_shared/types.ts";

const AGENT_NAME = "civic-steward";

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Steward, a content moderation AI for a Kenyan civic platform (WanaIQ).
Your job is to classify content against Kenyan law, the Constitution of Kenya 2010, and community standards.

CATEGORIES:
- hate_speech: Content targeting individuals or groups based on ethnicity, religion, gender, or disability.
- ethnic_incitement: Content that could incite ethnic violence or divisions between communities in Kenya.
- misinformation: False factual claims about government actions, public figures, or civic processes.
- pii_exposure: Personal identifiable information shared without consent (ID numbers, phone numbers, addresses).
- explicit_content: Sexual or graphic violent content inappropriate for a civic forum.
- spam: Repetitive, irrelevant, or commercial content.
- clean: No violation detected.

VERDICTS:
- none: No action needed.
- flag: Content warrants human review but should remain visible.
- remove: Content should be hidden immediately.
- ban_user: Pattern of repeated serious violations warranting account suspension proposal.

RULES:
1. Be firm on ethnic incitement — Kenya's history demands zero tolerance.
2. Be proportionate — misunderstandings are not hate speech.
3. Political criticism of public officials is protected civic speech.
4. Always explain your reasoning clearly for human review.

Respond ONLY with valid JSON matching this schema:
{
  "verdict": "none|flag|remove|ban_user",
  "category": "hate_speech|ethnic_incitement|misinformation|pii_exposure|explicit_content|spam|clean",
  "confidence": 0.0-1.0,
  "reason": "One clear sentence explaining the decision.",
  "flags": ["specific_trigger_phrase_or_element"]
}`;

// ── Pre-publish screening (Mode A) ────────────────────────────────────────────

async function screenContent(
  contentType: string,
  content: string,
): Promise<ModerationResult> {
  const response = await callLLM(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Classify this ${contentType}:\n\n${content.slice(0, 4000)}`,
      },
    ],
    { maxTokens: 256, temperature: 0, jsonMode: true },
  );

  const parsed = parseLLMJson<ModerationResult>(response.content);
  if (!parsed) {
    return {
      verdict: "flag",
      category: "clean",
      confidence: 0,
      reason: "LLM response could not be parsed — flagged for human review.",
      flags: [],
    };
  }
  return parsed;
}

// ── Batch scan (Mode B) ───────────────────────────────────────────────────────

async function batchScan(
  table: 'posts' | 'comments',
  client: ReturnType<typeof sb>,
  sinceHours = 1,
): Promise<{ scanned: number; actioned: number; failed: number }> {
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await client
    .from(table)
    .select('id, content, user_id')
    .eq('is_hidden', false)
    .gte('created_at', since)
    .limit(50);

  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
  if (!rows?.length) return { scanned: 0, actioned: 0, failed: 0 };

  let actioned = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const result = await screenContent(table.slice(0, -1), row.content ?? '');

      if (result.verdict === 'none' || result.category === 'clean') continue;

      // Emit moderation event
      await emitTypedEvent(client, {
        event_type: 'moderation_flag',
        source_agent: AGENT_NAME,
        payload: {
          table,
          record_id: row.id,
          verdict: result.verdict,
          category: result.category,
          confidence: result.confidence,
          reason: result.reason,
        },
      });

      if (result.verdict === 'remove' && result.confidence >= 0.85) {
        await hideContent(client, table.slice(0, -1) as 'post' | 'comment', row.id, AGENT_NAME, result.reason);
        actioned++;
      } else if (result.verdict === 'flag' || result.confidence < 0.85) {
        await createProposal(client, AGENT_NAME, {
          proposal_type: `moderate_${table.slice(0, -1)}`,
          subject_type: table.slice(0, -1) as 'post' | 'comment',
          subject_id: row.id,
          reasoning: `[${result.category}] ${result.reason}`,
          confidence: result.confidence,
          evidence: { flags: result.flags, verdict: result.verdict },
        });
        actioned++;
      } else if (result.verdict === 'ban_user' && result.confidence >= 0.9) {
        await createProposal(client, AGENT_NAME, {
          proposal_type: 'ban_user',
          subject_type: 'user',
          subject_id: row.user_id,
          reasoning: `Repeated serious violation. Latest: ${result.reason}`,
          confidence: result.confidence,
          evidence: { flags: result.flags, trigger_content_id: row.id },
        });
        actioned++;
      }
    } catch (err) {
      console.error(`Failed to process ${table} row ${row.id}:`, err);
      failed++;
    }
  }

  return { scanned: rows.length, actioned, failed };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: agentCorsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const { trigger, table, content_type, content } = body;

    // Mode B: batch scan
    if (trigger === 'cron' || trigger === 'webhook') {
      const client = sb();
      const tables: Array<'posts' | 'comments'> = ['posts', 'comments'];
      const sinceHours: number = typeof body.since_hours === 'number' ? body.since_hours : 1;
      let totalScanned = 0, totalActioned = 0, totalFailed = 0;

      for (const t of tables) {
        const r = await batchScan(t, client, sinceHours);
        totalScanned += r.scanned;
        totalActioned += r.actioned;
        totalFailed += r.failed;
      }

      const duration_ms = Date.now() - startTime;
      await logRun(client, AGENT_NAME, {
        trigger_type: trigger === 'cron' ? 'cron' : 'webhook',
        items_scanned: totalScanned,
        items_actioned: totalActioned,
        items_failed: totalFailed,
        duration_ms,
        status: totalFailed > totalScanned / 2 ? 'partial' : 'success',
      });

      return jsonResponse({ ok: true, scanned: totalScanned, actioned: totalActioned });
    }

    // Mode A: pre-publish screening (backward-compatible)
    if (content_type && content) {
      const result = await screenContent(content_type, content);
      return jsonResponse({ ok: true, ...result });
    }

    return jsonResponse({ error: "Missing required fields: trigger OR (content_type + content)" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${AGENT_NAME}] Fatal error:`, msg);
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
