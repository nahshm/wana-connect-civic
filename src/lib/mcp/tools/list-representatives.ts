import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireAuth, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "list_representatives",
  title: "List representatives",
  description:
    "List verified office holders for a Kenyan county (defaults to the signed-in user's county). Returns active leaders with their office and profile info.",
  inputSchema: {
    county: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Kenyan county name. Defaults to the signed-in user's county."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ county }, ctx) => {
    const gate = requireAuth(ctx);
    if (gate) return gate;

    const sb = supabaseForUser(ctx);

    let targetCounty = county;
    if (!targetCounty) {
      const { data: me } = await sb
        .from("profiles")
        .select("county")
        .eq("id", ctx.getUserId())
        .maybeSingle();
      targetCounty = me?.county ?? undefined;
    }

    if (!targetCounty) {
      return errorResult(
        "No county specified and the signed-in user has no county on their profile.",
      );
    }

    const { data, error } = await sb
      .from("office_holders")
      .select(
        "id, position_id, term_start, term_end, is_active, verification_status, profiles:user_id(id, username, display_name, avatar_url, county, constituency, ward, official_position)",
      )
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .limit(100);

    if (error) return errorResult(error.message);

    const filtered = (data ?? []).filter((row: any) => {
      const p = row.profiles;
      return p && (p.county ?? "").toLowerCase() === targetCounty!.toLowerCase();
    });

    return jsonResult(
      filtered,
      `${filtered.length} representative(s) for ${targetCounty}.`,
    );
  },
});
