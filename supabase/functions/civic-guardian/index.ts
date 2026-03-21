/**
 * civic-guardian — DEPRECATED
 *
 * This agent has been consolidated into civic-steward.
 * See: supabase/functions/civic-steward/index.ts
 */
import { agentCorsHeaders } from "../_shared/agentUtils.ts";

Deno.serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({
      status: 410,
      moved_to: "civic-steward",
      message:
        "civic-guardian has been deprecated. Its moderation logic has been absorbed into civic-steward.",
    }),
    {
      status: 410,
      headers: { ...agentCorsHeaders, "Content-Type": "application/json" },
    },
  );
});
