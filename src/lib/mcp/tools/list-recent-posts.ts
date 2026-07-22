import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireAuth, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "list_recent_posts",
  title: "List recent posts",
  description:
    "List the most recent WanaIQ posts. Optionally scope to a community by id.",
  inputSchema: {
    community_id: z
      .string()
      .uuid()
      .optional()
      .describe("Optional community UUID to scope the feed."),
    limit: z.number().int().min(1).max(25).optional().describe("Max results (1-25, default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ community_id, limit }, ctx) => {
    const gate = requireAuth(ctx);
    if (gate) return gate;

    const sb = supabaseForUser(ctx);
    let q = sb
      .from("posts")
      .select(
        "id, title, author_id, community_id, upvotes, downvotes, comment_count, created_at, tags",
      )
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);

    if (community_id) q = q.eq("community_id", community_id);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return jsonResult(data ?? [], `${data?.length ?? 0} recent post(s).`);
  },
});
