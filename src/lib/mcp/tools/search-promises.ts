import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, requireAuth, supabaseForUser } from "./_supabase";

export default defineTool({
  name: "search_promises",
  title: "Search campaign promises",
  description:
    "Search WanaIQ campaign promises by keyword and/or status. Returns up to 20 tracked promises.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .optional()
      .describe("Search keywords matched against promise title and description."),
    status: z
      .string()
      .trim()
      .optional()
      .describe("Optional status filter (e.g. 'pending', 'in_progress', 'fulfilled', 'broken')."),
    limit: z.number().int().min(1).max(20).optional().describe("Max results (1-20, default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, status, limit }, ctx) => {
    const gate = requireAuth(ctx);
    if (gate) return gate;

    const sb = supabaseForUser(ctx);
    let q = sb
      .from("campaign_promises")
      .select(
        "id, title, description, status, politician_id, politician_name, due_date, created_at, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(limit ?? 10);

    if (status) q = q.eq("status", status);
    if (query && query.length > 0) {
      const term = `%${query.replace(/[%_]/g, "")}%`;
      q = q.or(`title.ilike.${term},description.ilike.${term}`);
    }

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return jsonResult(data ?? [], `${data?.length ?? 0} promise(s) found.`);
  },
});
