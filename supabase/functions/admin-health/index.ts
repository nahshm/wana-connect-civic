/**
 * admin-health — System Health Endpoint
 *
 * Called by the Overview sub-tab in AI Command every 30 seconds.
 * Returns a flat array of HealthNode objects covering:
 *   - 7 DB tables (row counts)
 *   - 3 LLM providers (key presence)
 *   - Per-agent run stats (last 50 runs)
 *
 * verify_jwt = false — no user auth required (admin dashboard only).
 */

import { agentCorsHeaders, jsonResponse, sb } from "../_shared/agentUtils.ts";
import type { HealthNode, HealthStatus } from "../_shared/types.ts";

const AGENT_NAME = "admin-health";

const AGENT_NAMES = [
  "civic-steward",
  "civic-scout",
  "civic-quill",
  "civic-brain",
  "civic-router",
  "civic-ingest",
  "civic-minion",
];

const DB_TABLES = [
  "agent_runs",
  "agent_events",
  "agent_proposals",
  "agent_drafts",
  "scout_findings",
  "vectors",
  "data_sources",
] as const;

const LLM_PROVIDERS = [
  { id: "groq", label: "Groq", envKey: "GROQ_API_KEY" },
  { id: "anthropic", label: "Anthropic", envKey: "ANTHROPIC_API_KEY" },
  { id: "openai", label: "OpenAI", envKey: "OPENAI_API_KEY" },
];

// ── DB table health ───────────────────────────────────────────────────────────

async function checkDatabaseTables(client: ReturnType<typeof sb>): Promise<HealthNode[]> {
  const nodes: HealthNode[] = [];

  await Promise.all(
    DB_TABLES.map(async (table) => {
      try {
        const { count, error } = await (client as any)
          .from(table)
          .select('*', { count: 'exact', head: true });

        nodes.push({
          id: `db_${table}`,
          label: table.replace(/_/g, ' '),
          type: 'database',
          status: error ? 'error' : 'healthy',
          value: error ? null : count,
          detail: error ? error.message : `${count ?? 0} rows`,
        });
      } catch (err) {
        nodes.push({
          id: `db_${table}`,
          label: table.replace(/_/g, ' '),
          type: 'database',
          status: 'error',
          detail: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }),
  );

  return nodes;
}

// ── LLM provider health ───────────────────────────────────────────────────────

function checkLlmProviders(): HealthNode[] {
  return LLM_PROVIDERS.map((p) => {
    const key = Deno.env.get(p.envKey);
    return {
      id: `llm_${p.id}`,
      label: p.label,
      type: "llm_provider" as const,
      status: (key ? "healthy" : "unknown") as HealthStatus,
      detail: key ? "API key configured" : "No API key set",
    };
  });
}

// ── Agent run stats ───────────────────────────────────────────────────────────

async function checkAgentRunStats(client: ReturnType<typeof sb>): Promise<HealthNode[]> {
  const nodes: HealthNode[] = [];

  // Single query — 200 rows covers ~28 runs per agent
  const { data: runs, error } = await client
    .from('agent_runs')
    .select('agent_name, status, duration_ms, created_at')
    .in('agent_name', AGENT_NAMES)
    .order('created_at', { ascending: false })
    .limit(200);

  for (const agentName of AGENT_NAMES) {
    if (error || !runs) {
      nodes.push({
        id: `agent_${agentName}`,
        label: agentName,
        type: 'agent',
        status: 'unknown',
        detail: error?.message ?? 'Failed to load run data',
      });
      continue;
    }

    const agentRuns = runs.filter((r) => r.agent_name === agentName);

    if (agentRuns.length === 0) {
      nodes.push({
        id: `agent_${agentName}`,
        label: agentName,
        type: 'agent',
        status: 'unknown',
        detail: 'No runs recorded',
      });
      continue;
    }

    const last = agentRuns[0];
    const last50 = agentRuns.slice(0, 50);
    const successCount = last50.filter((r) => r.status === 'success').length;
    const errorRate = ((last50.length - successCount) / last50.length) * 100;
    const withLatency = last50.filter((r) => r.duration_ms != null);
    const avgLatency = withLatency.length > 0
      ? withLatency.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / withLatency.length
      : 0;

    const status: HealthStatus =
      last.status === 'failed' ? 'error'
      : errorRate > 30 ? 'degraded'
      : 'healthy';

    nodes.push({
      id: `agent_${agentName}`,
      label: agentName,
      type: 'agent',
      status,
      value: Math.round(avgLatency),
      detail: `Last: ${last.status} · Error rate: ${Math.round(errorRate)}% · Avg: ${Math.round(avgLatency)}ms`,
    });
  }

  return nodes;
}

// ── Main handler ──────────────────────────────────────────────────────────────

const ADMIN_SECRET = Deno.env.get('ADMIN_HEALTH_SECRET');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: agentCorsHeaders });
  }

  // Lightweight secret check (optional but recommended — set ADMIN_HEALTH_SECRET env var)
  if (ADMIN_SECRET) {
    const token = req.headers.get('x-admin-secret') ?? new URL(req.url).searchParams.get('secret');
    if (token !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // One client for the entire request lifetime — no per-check client creation
  const client = sb();

  try {
    const [dbNodes, llmNodes, agentNodes] = await Promise.all([
      checkDatabaseTables(client),
      Promise.resolve(checkLlmProviders()),
      checkAgentRunStats(client),
    ]);

    const nodes: HealthNode[] = [...agentNodes, ...dbNodes, ...llmNodes];

    return new Response(JSON.stringify({ ok: true, nodes, checked_at: new Date().toISOString() }), {
      status: 200,
      headers: { ...agentCorsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${AGENT_NAME}] Error:`, msg);
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
