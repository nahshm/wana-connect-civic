/**
 * civic-sage — DEPRECATED
 *
 * This agent has been retired. Its legal reasoning logic has been
 * integrated into civic-brain's system prompt for inline RAG analysis.
 * See: supabase/functions/civic-brain/index.ts
 */
import { agentCorsHeaders } from "../_shared/agentUtils.ts";

Deno.serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({
      status: 410,
      moved_to: "civic-brain",
      message:
        "civic-sage has been deprecated. Policy analysis is now handled inline by civic-brain via RAG.",
    }),
    {
      status: 410,
      headers: { ...agentCorsHeaders, "Content-Type": "application/json" },
    },
  );
});
