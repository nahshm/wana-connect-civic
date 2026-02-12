import { supabase } from '@/integrations/supabase/client';

export interface ModerationResult {
  verdict: 'APPROVED' | 'NEEDS_REVISION' | 'BLOCKED';
  reason: string;
  confidence: number;
  flags: string[];
  processing_time_ms: number;
}

export interface RoutingResult {
  issue_type: string;
  department_slug: string;
  department_name: string;
  jurisdiction: string;
  severity: number;
  confidence: number;
  recommended_actions: string[];
  processing_time_ms: number;
}

export interface RAGResult {
  answer: string;
  sources: string[];
  confidence: number;
  processing_time_ms: number;
}

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(`${name} failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const aiClient = {
  /** Content moderation - checks posts/promises for hate speech, PII, quality */
  governance: (contentType: string, content: string) =>
    invokeFunction<ModerationResult>('civic-steward', { content_type: contentType, content }),

  /** Issue routing - classifies civic issues and determines responsible department */
  routing: (issueDescription: string, location?: string) =>
    invokeFunction<RoutingResult>('civic-router', { issue_description: issueDescription, location }),

  /** RAG Q&A - civic knowledge assistant */
  rag: (query: string, sessionId: string, language: string = 'en') =>
    invokeFunction<RAGResult>('civic-brain', { query, session_id: sessionId, language }),
};
