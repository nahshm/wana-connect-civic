import { supabase } from '@/integrations/supabase/client';

export interface ModerationResult {
  verdict: 'APPROVED' | 'NEEDS_REVISION' | 'BLOCKED' | 'FLAGGED';
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
  required_forms?: Array<{
    form_id: string;
    form_name: string;
    template_url: string;
  }>;
  estimated_resolution_days?: number;
  contact_info?: {
    email?: string;
    phone?: string;
    office_location?: string;
  };
  next_steps?: string[];
  processing_time_ms: number;
}

export interface Source {
  title: string;
  url: string;
  article?: string;
  similarity?: number;
  content?: string;
}

export interface RAGResult {
  answer: string;
  sources: Source[];
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
  routing: (
    issueDescription: string, 
    location?: { 
      lat?: number; 
      lng?: number; 
      ward?: string; 
      constituency?: string; 
      county?: string;
      text?: string;
    },
    photos: string[] = []
  ) =>
    invokeFunction<RoutingResult>('civic-router', { 
      issue_description: issueDescription, 
      location, 
      photos 
    }),

  /** RAG Q&A - civic knowledge assistant */
  rag: (query: string, sessionId: string, language: string = 'en') =>
    invokeFunction<RAGResult>('civic-brain', { query, session_id: sessionId, language }),

  /** Fetch chat history for a session */
  getHistory: async (sessionId: string) => {
    const { data, error } = await supabase
      .from('rag_chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /** Delete a specific history item */
  deleteHistoryItem: async (id: string) => {
    const { error } = await supabase
      .from('rag_chat_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  /** Clear all history for a session */
  clearHistory: async (sessionId: string) => {
    const { error } = await supabase
      .from('rag_chat_history')
      .delete()
      .eq('session_id', sessionId);
    
    if (error) throw error;
  }
};
