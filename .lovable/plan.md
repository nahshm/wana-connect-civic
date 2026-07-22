
# Add Agent Integrations (MCP) to WanaIQ

Expose this app as an OAuth-protected MCP server so ChatGPT / Claude / Cursor / Codex can connect as real WanaIQ users, with all tool calls scoped by Supabase RLS.

## Architecture

- Author tools in `src/lib/mcp/tools/` using `defineTool` from `@lovable.dev/mcp-js`.
- Register them in `src/lib/mcp/index.ts` via `defineMcp`, with `auth.oauth.issuer(...)` pointing at the direct `https://<project-ref>.supabase.co/auth/v1` issuer built from `import.meta.env.VITE_SUPABASE_PROJECT_ID`.
- Add `mcpPlugin()` from `@lovable.dev/mcp-js/stacks/supabase/vite` to `vite.config.ts`. The plugin generates `supabase/functions/mcp/index.ts` at build time (do not hand-edit).
- Add a `/.lovable/oauth/consent` React route wired to `supabase.auth.oauth.{getAuthorizationDetails, approveAuthorization, denyAuthorization}`, and ensure unauthenticated visitors are redirected to `/login?next=<full consent URL>` and returned back after sign-in (including social `redirect_uri` and signup `emailRedirectTo`).
- Deploy the generated `mcp` edge function.

## Initial tool set (all RLS-scoped via `ctx.getToken()`)

Read-only, safe defaults that mirror the platform's core civic surface:

1. `whoami` — return the signed-in user's profile (username, display name, county/constituency/ward).
2. `search_posts` — full-text/ILIKE search over posts the user can read.
3. `get_post` — fetch a single post + top-level comments by id or slug.
4. `list_my_communities` — communities the user has joined.
5. `list_representatives` — leaders for the user's geography (county/constituency/ward).
6. `search_promises` — search accountability promises with status filter.
7. `list_notifications` — user's recent notifications.

Mutating tools (create post, comment, vote, report issue) are deliberately **not** in the first cut — they need `needsApproval` UX and stricter validation. Add in a follow-up once the read-only surface is verified.

Every tool: clear `title`, one-sentence `description`, `annotations.readOnlyHint: true`, narrow Zod `inputSchema`, forwards `ctx.getToken()` to a per-request Supabase client so RLS runs as the caller. Never reads `SUPABASE_SERVICE_ROLE_KEY`.

## Files

```text
package.json                                   (+ @lovable.dev/mcp-js, zod already present)
vite.config.ts                                 (+ mcpPlugin())
src/lib/mcp/index.ts                           (new — defineMcp entry)
src/lib/mcp/tools/whoami.ts                    (new)
src/lib/mcp/tools/search-posts.ts              (new)
src/lib/mcp/tools/get-post.ts                  (new)
src/lib/mcp/tools/list-my-communities.ts       (new)
src/lib/mcp/tools/list-representatives.ts      (new)
src/lib/mcp/tools/search-promises.ts           (new)
src/lib/mcp/tools/list-notifications.ts        (new)
src/pages/OAuthConsent.tsx                     (new — /.lovable/oauth/consent)
src/App.tsx                                    (+ consent route, public — no ProtectedRoute)
src/pages/Auth.tsx (or login flow)             (consume `next` param on password, signup emailRedirectTo, and social redirect_uri)
```

The MCP entry stays import-safe: no top-level env reads, no I/O, no throws — secrets are read inside handlers only.

## Steps

1. Install `@lovable.dev/mcp-js`.
2. Add `mcpPlugin()` to `vite.config.ts` plugin array (keep PWA, react-swc, lovable-tagger untouched).
3. Write the seven tool files and `src/lib/mcp/index.ts`.
4. Add `OAuthConsent.tsx` and route it at `/.lovable/oauth/consent`; update the login/signup/social paths to preserve and consume `next`.
5. Validate the manifest (`app_mcp_server--extract_mcp_manifest`).
6. Deploy the `mcp` edge function (`supabase--deploy_edge_functions`, `function_names: ["mcp"]`).
7. Verify: connect from Claude/ChatGPT, sign in via consent screen, call `whoami` — confirm it returns the signed-in user's profile.

## Notes / constraints

- Issuer is `https://${VITE_SUPABASE_PROJECT_ID}.supabase.co/auth/v1` — not the `SUPABASE_URL` (would break discovery if a proxy host is ever used).
- Add the consent path to the project's Supabase redirect allow-list.
- Favicon already exists (`public/favicon.png`) — connector icon covered.
- Existing PWA denylist already excludes `/api` and `/~oauth`; the MCP function lives at `https://<ref>.supabase.co/functions/v1/mcp`, so no PWA fallback conflict.
- No changes to existing tools, RLS, or UI beyond the consent route and its auth-return plumbing.
