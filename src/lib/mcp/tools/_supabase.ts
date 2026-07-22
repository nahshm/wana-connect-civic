import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Per-request Supabase client scoped to the calling MCP user.
 * Forwards the verified bearer token so RLS runs as that user.
 * NEVER uses SUPABASE_SERVICE_ROLE_KEY — RLS is the security boundary.
 */
export function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) {
    return {
      content: [{ type: "text" as const, text: "Not authenticated." }],
      isError: true,
    };
  }
  return null;
}

export function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function jsonResult<T>(data: T, summary?: string) {
  return {
    content: [
      { type: "text" as const, text: summary ?? JSON.stringify(data) },
    ],
    structuredContent: { data } as Record<string, unknown>,
  };
}
