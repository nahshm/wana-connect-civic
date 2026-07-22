import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, jsonResult, requireAuth, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "whoami",
  title: "Who am I",
  description:
    "Return the signed-in WanaIQ user's profile (username, display name, county, constituency, ward, karma).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const gate = requireAuth(ctx);
    if (gate) return gate;

    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("profiles")
      .select(
        "id, username, display_name, bio, avatar_url, county, constituency, ward, location, karma, post_karma, comment_karma, is_verified, role, onboarding_completed, created_at",
      )
      .eq("id", ctx.getUserId())
      .maybeSingle();

    if (error) return errorResult(error.message);
    if (!data) return errorResult("Profile not found.");

    return jsonResult(
      data,
      `${data.display_name ?? data.username ?? "user"} (u/${data.username ?? "unknown"}) — ${
        data.county ?? "no county"
      }${data.constituency ? `, ${data.constituency}` : ""}${
        data.ward ? `, ${data.ward}` : ""
      }`,
    );
  },
});
