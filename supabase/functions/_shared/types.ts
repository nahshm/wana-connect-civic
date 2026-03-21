/**
 * _shared/types.ts
 * Universal type definitions shared by all WAAS edge functions and admin UI.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Agent Event Types ────────────────────────────────────────────────────────

export type AgentEventType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'routing_decision'
  | 'moderation_flag'
  | 'ingest_complete'
  | 'fact_check'
  | 'issue_cluster'
  | 'draft_ready'
  | 'answer';

export interface AgentEvent {
  event_type: AgentEventType;
  source_agent: string;
  target_agent?: string;
  payload: Record<string, unknown>;
}

// ── Tool Results ─────────────────────────────────────────────────────────────

export interface ToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── User Context ─────────────────────────────────────────────────────────────

export interface UserContext {
  user_id: string;
  county?: string;
  constituency?: string;
  ward?: string;
  lat?: number;
  lng?: number;
}

// ── Agent Run / Logging ──────────────────────────────────────────────────────

export type AgentRunStatus = 'success' | 'partial' | 'failed';
export type AgentTriggerType = 'cron' | 'webhook' | 'event' | 'api' | 'manual';

export interface AgentRun {
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

// ── Data Sources ─────────────────────────────────────────────────────────────

export type DataSourceType = 'news' | 'gov_portal' | 'parliament' | 'custom';
export type ScrapeStatus = 'success' | 'partial' | 'failed';

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: DataSourceType;
  active: boolean;
  scrape_interval_hours: number;
  last_scraped?: string | null;
  last_scraped_status?: ScrapeStatus | null;
  created_at: string;
}

// ── Health Monitoring ────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'error' | 'unknown';
export type HealthNodeType = 'agent' | 'database' | 'llm_provider';

export interface HealthNode {
  id: string;
  label: string;
  type: HealthNodeType;
  status: HealthStatus;
  value?: string | number | null;
  detail?: string;
}

// ── Moderation ───────────────────────────────────────────────────────────────

export type ModerationVerdict = 'none' | 'flag' | 'remove' | 'ban_user';
export type ModerationCategory =
  | 'hate_speech'
  | 'ethnic_incitement'
  | 'misinformation'
  | 'pii_exposure'
  | 'explicit_content'
  | 'spam'
  | 'clean';

export interface ModerationResult {
  verdict: ModerationVerdict;
  category: ModerationCategory;
  confidence: number;
  reason: string;
  flags: string[];
}

// ── Civic Issues & Incidents ─────────────────────────────────────────────────

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
export type IncidentType =
  | 'corruption'
  | 'public_safety'
  | 'service_failure'
  | 'rights_violation'
  | 'environmental'
  | 'infrastructure'
  | 'other';
