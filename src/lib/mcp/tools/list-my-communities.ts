import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, jsonResult, requireAuth, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "list_my_communities",
  title: "List my communities",
  description:
    "List the WanaIQ communities the signed-in user has joined, most recently joined first.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const gate = requireAuth(ctx);
    if (gate) return gate;

    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("community_members")
      .select(
        "joined_at, communities(id, name, display_name, description, category, member_count, type, visibility_type)",
      )
      .eq("user_id", ctx.getUserId())
      .order("joined_at", { ascending: false })
      .limit(50);

    if (error) return errorResult(error.message);
    return jsonResult(data ?? [], `${data?.length ?? 0} joined communities.`);
  },
});
