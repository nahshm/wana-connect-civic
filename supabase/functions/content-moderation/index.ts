/**
 * content-moderation — DEPRECATED
 *
 * This agent has been consolidated into civic-steward which provides
 * both pre-publish screening and batch moderation with Kenyan legal context.
 * See: supabase/functions/civic-steward/index.ts
 */
import { agentCorsHeaders } from "../_shared/agentUtils.ts";

Deno.serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({
      status: 410,
      moved_to: "civic-steward",
      message:
        "content-moderation has been deprecated. Use civic-steward for all content moderation.",
    }),
    {
      status: 410,
      headers: { ...agentCorsHeaders, "Content-Type": "application/json" },
    },
  );
});
