

# AI Command Center: End-to-End Fix

## Issues Found (10 problems across 5 categories)

### A. admin-health Returning Error

**Root cause**: The function uses `sb()` which creates a service-role client. But the frontend calls it via `supabase.functions.invoke('admin-health')` which passes the anon key. The function itself doesn't use JWT auth — it uses an optional `ADMIN_HEALTH_SECRET` header. The real issue is that the function queries tables like `data_sources` using `(client as any)` with the service role key, but the `is_admin()` RLS checks on `agent_runs` require `auth.uid()` — which is null for a service-role client without a user session.

Wait — `sb()` uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely. So the function should work. The error is likely a deployment issue or the function isn't deployed.

**Investigation**: No logs at all for `admin-health` — the function may not be deployed. The code exists but may have never been pushed to Supabase.

**Fix**: Ensure the function is deployed (it will auto-deploy on code change). Also, the `agent_runs` data only has runs for `civic-guardian`, `civic-minion`, `civic-sage`, `civic-scout` — but the health check looks for `civic-steward`, `civic-quill`, `civic-brain`, `civic-router`, `civic-ingest`. None of those have runs, so all agents show "No runs recorded" / "unknown" status. This is expected for a fresh system but looks broken.

### B. data_sources RLS — INSERT/UPDATE/DELETE Missing

**Root cause**: `data_sources` has RLS enabled with only a `SELECT` policy (public read). There are NO policies for INSERT, UPDATE, or DELETE. Admin operations from the frontend (add source, toggle active, delete) all fail with "new row violates row-level security policy".

**Fix**: Add INSERT, UPDATE, DELETE policies for admins using `is_admin()`.

### C. Agent Trigger Runs Not Working

**Root cause**: The "Trigger Run" button in Agent Directory does `supabase.from('agent_runs').insert(...)` from the browser. But `agent_runs` has RLS enabled with only a SELECT policy for admins — no INSERT policy. The insert silently fails.

Also, this button doesn't actually trigger the edge function — it just inserts a fake run log record. It should invoke the actual edge function.

**Fix**: 
1. Add INSERT policy on `agent_runs` for admins
2. Change the "Trigger Run" button to actually invoke the edge function via `supabase.functions.invoke(agent.name)`

### D. Live Events — Empty

**Root cause**: `agent_events` table has 0 rows. Events are only created by edge functions via `emitTypedEvent()`. Since no agents have been triggered with the new codebase (runs are all from old agents: civic-guardian, civic-sage), no events exist.

The Realtime subscription is correctly wired. Events will appear once agents actually run and emit events. Not a bug — just no data yet.

**Fix**: No code change needed for the subscription. Once agents run, events will flow. But the Live Events tab should show a better empty state explaining this.

### E. Data Sources — Where Does Scraped Data Go?

`civic-scout` reads from `data_sources`, scrapes URLs, classifies with LLM, and inserts into `scout_findings`. Currently `scout_findings` has 0 rows because:
1. `data_sources` can't be populated (RLS blocks inserts — see B above)
2. `civic-scout` hasn't been triggered since the redesign

Once data_sources RLS is fixed and scout runs, findings go to `scout_findings` table. The admin UI doesn't currently have a view for scout_findings — it should be linked from the Data Sources panel.

### F. Agent Run Statistics — Items is 0

The Analytics tab queries `agent_runs` from the last 7 days. All 8,767 runs are from old agents (`civic-guardian`, `civic-minion`, `civic-sage`, `civic-scout`). The Analytics query uses `AGENT_NAMES` filter — but it doesn't filter by name, it just selects all. The issue is `items_scanned` is 0 for most runs.

Actually, looking at the Analytics code, it queries ALL agent_runs (no name filter). The data exists (8,767 rows) but the admin might not see it due to the RLS SELECT policy requiring `is_admin()`. If the admin user doesn't have the admin role in `user_roles`, the query returns empty.

**Fix**: Verify admin user has proper role. Also update agent names in AGENT_REGISTRY to include legacy agents or show them as "deprecated".

### G. Agent Queue — No Proposals

`agent_proposals` has 0 rows. Proposals are created by agents (civic-steward creates moderation proposals, civic-minion reviews them). Since civic-steward hasn't run with the new code, no proposals exist.

**How proposals should work**: civic-steward scans content, detects violations, creates proposals with confidence scores. civic-minion auto-approves high-confidence proposals and escalates low-confidence ones for admin review in this Queue tab. The Queue UI is correctly built — it just needs data flowing.

### H. Content Drafts — Empty

`agent_drafts` has 0 rows. Drafts are created by civic-quill (issue summaries). civic-quill hasn't been triggered. The UI is correctly built.

### I. Knowledge Base — No PDF Support

`civic-ingest` currently:
- Accepts `content` (raw text) or `storage_path` (file in Supabase Storage)
- Does NOT accept a `url` parameter for PDF URLs
- PDF parsing returns an error: "PDF parsing not yet implemented"
- Only `.txt` and `.md` files work
- Inserts into `vectors` table (not `civic_documents` as mentioned in user's notes)
- Drag-and-drop only accepts `.txt`, `.md`, `.csv`

The KB UI has no "Ingest PDF from URL" button at all.

**Fix**: 
1. Add URL-based ingestion to `civic-ingest` (fetch URL → extract text → chunk → embed)
2. For PDFs: use Jina AI reader (`https://r.jina.ai/URL`) to extract text (already used by civic-scout)
3. Add "Ingest from URL" button to Knowledge Base UI

### J. Knowledge Base Insert — Missing Embeddings

The "Add Document" button in KB inserts into `vectors` with `embedding: null`. Without an embedding, the document is invisible to RAG search (civic-brain uses vector similarity). The insert should call civic-ingest to generate proper embeddings, not insert directly.

---

## Implementation Plan

### Migration 1: RLS Policies for AI Command Tables

```sql
-- data_sources: admin CRUD
CREATE POLICY "Admins can insert data_sources" ON public.data_sources
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can update data_sources" ON public.data_sources
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can delete data_sources" ON public.data_sources
  FOR DELETE TO authenticated USING (is_admin());

-- agent_runs: admin insert (for manual triggers + edge functions use service role)
CREATE POLICY "Admins can insert agent_runs" ON public.agent_runs
  FOR INSERT TO authenticated WITH CHECK (is_admin());

-- agent_events: admin insert
CREATE POLICY "Admins can insert agent_events" ON public.agent_events
  FOR INSERT TO authenticated WITH CHECK (is_admin());
```

### Edit 1: AICommandSection.tsx — Fix "Trigger Run" Button

Change from inserting a fake log to actually invoking the edge function:
```typescript
onClick={async () => {
  toast.info(`Triggering ${agent.displayName}...`);
  const { error } = await supabase.functions.invoke(agent.name, {
    body: { mode: 'manual' }
  });
  if (error) toast.error(`Failed: ${error.message}`);
  else toast.success(`${agent.displayName} triggered successfully`);
}}
```

### Edit 2: AICommandSection.tsx — Knowledge Base "Ingest from URL"

Add a URL ingestion form that calls `civic-ingest` with a URL. The edge function will use Jina reader to extract text from any URL (including PDFs).

### Edit 3: civic-ingest — Add URL Support + PDF via Jina

Add `url` parameter to the request body. When provided:
1. Fetch via Jina reader (`https://r.jina.ai/URL`) to get clean text
2. Chunk and embed as normal
3. This handles PDFs, web pages, and any document Jina can read

### Edit 4: AICommandSection.tsx — KB "Add Document" Should Use civic-ingest

Instead of inserting directly into `vectors` with `embedding: null`, call `civic-ingest` with `content` so embeddings are generated.

### Edit 5: Data Sources Panel — Add Scout Findings View

Add a collapsible section showing recent `scout_findings` so admins can see where scraped data goes.

### Edit 6: Live Events — Better Empty State

Show explanation that events appear when agents run, with a "Trigger an agent from the Agents tab" call-to-action.

---

## Files Changed

| Action | File |
|--------|------|
| MIGRATION | RLS policies for `data_sources`, `agent_runs`, `agent_events` |
| EDIT | `AICommandSection.tsx` — Fix trigger button, KB URL ingest, KB add doc to use civic-ingest, better empty states |
| EDIT | `civic-ingest/index.ts` — Add `url` parameter with Jina reader for PDF/web content |
| EDIT | `DataSourcesPanel.tsx` — Add scout_findings preview section |
| EDIT | `LiveEventsFeed.tsx` — Better empty state |

