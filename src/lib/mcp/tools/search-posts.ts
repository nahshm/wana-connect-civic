import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireAuth, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "search_posts",
  title: "Search posts",
  description:
    "Search WanaIQ posts by keyword across title and content. Returns up to 20 results the signed-in user can read.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Search keywords (matched against title and content)."),
    limit: z.number().int().min(1).max(20).optional().describe("Max results (1-20, default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    const gate = requireAuth(ctx);
    if (gate) return gate;

    const sb = supabaseForUser(ctx);
    const term = `%${query.replace(/[%_]/g, "")}%`;
    const { data, error } = await sb
      .from("posts")
      .select(
        "id, title, content, author_id, community_id, upvotes, downvotes, comment_count, created_at, tags",
      )
      .or(`title.ilike.${term},content.ilike.${term}`)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);

    if (error) return errorResult(error.message);
    return jsonResult(data ?? [], `Found ${data?.length ?? 0} post(s) for "${query}".`);
  },
});
