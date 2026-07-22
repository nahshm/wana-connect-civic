import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireAuth, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "get_post",
  title: "Get post",
  description:
    "Fetch a WanaIQ post by id along with its top-level comments (most recent first).",
  inputSchema: {
    post_id: z.string().uuid().describe("Post UUID."),
    comment_limit: z
      .number()
      .int()
      .min(0)
      .max(50)
      .optional()
      .describe("Max top-level comments to include (0-50, default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_id, comment_limit }, ctx) => {
    const gate = requireAuth(ctx);
    if (gate) return gate;

    const sb = supabaseForUser(ctx);
    const { data: post, error: postErr } = await sb
      .from("posts")
      .select(
        "id, title, content, author_id, community_id, upvotes, downvotes, comment_count, created_at, tags, link_url",
      )
      .eq("id", post_id)
      .maybeSingle();

    if (postErr) return errorResult(postErr.message);
    if (!post) return errorResult("Post not found or not accessible.");

    const { data: comments, error: cErr } = await sb
      .from("comments")
      .select("id, author_id, content, upvotes, downvotes, created_at, parent_comment_id")
      .eq("post_id", post_id)
      .is("parent_comment_id", null)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(comment_limit ?? 20);

    if (cErr) return errorResult(cErr.message);

    return jsonResult(
      { post, comments: comments ?? [] },
      `${post.title} — ${comments?.length ?? 0} top-level comment(s).`,
    );
  },
});
