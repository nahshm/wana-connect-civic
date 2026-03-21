/**
 * @/types/agent.ts
 * Client-side type definitions matching _shared/types.ts for use in the admin UI.
 */

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
