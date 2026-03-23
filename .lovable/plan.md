

# Wire Scout Data Pipeline — Separated Architecture

## Summary

The user's critique is correct. civic-scout is already doing scrape → parse → classify × N. Adding embedding + clustering + quill triggers into the same function creates a fragile monolith with no recovery path. The fix is to separate concerns into 3 clean layers.

## Architecture

```text
civic-scout (scrape + classify only)
       │
       ├── inserts scout_findings (embedded=false, processed=false)
       └── emits "ingest_complete" event when done
       
civic-processor (new, idempotent cron)
       │
       ├── Step 1: embed unembedded findings → vectors table
       │           marks embedded=true
       │
       └── Step 2: cluster unprocessed findings by category
                   assigns cluster_id UUID to each group
                   calls civic-quill per cluster
                   marks processed=true

_shared/embeddings.ts (new, shared module)
       └── embedText() + embedAndInsert() — used by civic-ingest AND civic-processor
```

## Changes

### Migration: Add columns to scout_findings

```sql
ALTER TABLE scout_findings ADD COLUMN IF NOT EXISTS cluster_id UUID;
ALTER TABLE scout_findings ADD COLUMN IF NOT EXISTS processor_run_id UUID;
```

### File 1: CREATE `supabase/functions/_shared/embeddings.ts`

Extract the embedding logic already in civic-ingest (lines 206-218) into a shared module:

- `embedText(text: string): Promise<number[]>` — calls OpenAI text-embedding-ada-002, returns vector
- `embedAndInsert(client, chunks: {content, title, metadata}[]): Promise<{inserted: number, failed: number}>` — embeds + inserts into vectors table with rate limiting

civic-ingest will import from this instead of inline code. civic-processor will use the same functions.

### File 2: EDIT `supabase/functions/civic-scout/index.ts`

Minimal change — scout stays focused on scraping:
- Remove any future post-processing code paths
- After scraping completes, emit `ingest_complete` event (already does this at line 284) — no change needed
- Update JSDoc to clarify "scrape + classify only, downstream processing handled by civic-processor"

### File 3: CREATE `supabase/functions/civic-processor/index.ts`

New idempotent edge function with two pipelines:

**Embedding pipeline:**
1. Query `scout_findings WHERE embedded = false LIMIT 20`
2. For each: call `embedText(title + ' ' + summary)` from shared embeddings.ts
3. Insert into `vectors` table with source metadata (`source: 'scout'`, finding ID, category)
4. Update `embedded = true` on the finding

**Clustering pipeline:**
1. Query `scout_findings WHERE processed = false AND embedded = true`
2. Group by `category` (budget findings together, scandal findings together, etc.)
3. For each group ≥ 2 findings:
   - Generate a `cluster_id` UUID
   - Update all findings in the group with that `cluster_id` and `processor_run_id`
   - Call civic-quill with `{ cluster_id, issues: [summaries], ward }` 
   - Mark all as `processed = true`
4. Single findings (group size 1): mark `processed = true` but skip quill (not enough to cluster)

**Recovery**: Because it reads `embedded = false` / `processed = false`, re-running is always safe. Failed embeddings stay unembedded; failed clusters stay unprocessed.

### File 4: EDIT `supabase/functions/civic-ingest/index.ts`

Replace inline embedding code (lines 206-218) with import from `_shared/embeddings.ts`. Functional behavior unchanged — just DRY.

### File 5: EDIT `supabase/config.toml`

Add civic-processor registration:
```toml
[functions.civic-processor]
verify_jwt = false
```

### File 6: EDIT `src/features/admin/pages/components/DataSourcesPanel.tsx`

Enhance scout findings section:
- Show `embedded` and `processed` status badges per finding (green check / grey pending)
- Add "Run Processor" button that invokes `civic-processor` via `supabase.functions.invoke`
- Add delete button per finding
- Add `cluster_id` display when present (shows which findings were grouped together)

### File 7: CREATE `src/components/civic/CivicIntelligenceCard.tsx`

Reusable card for displaying scout findings to users:
- Props: title, summary, category, relevance_score, source_url, created_at
- Badge for category, link to source, relevance indicator
- Used on community feeds and official profile pages

---

## Files Summary

| Action | File | What |
|--------|------|------|
| MIGRATION | `scout_findings` | Add `cluster_id` and `processor_run_id` UUID columns |
| CREATE | `supabase/functions/_shared/embeddings.ts` | Shared `embedText()` + `embedAndInsert()` |
| CREATE | `supabase/functions/civic-processor/index.ts` | Idempotent cron: embed → cluster → trigger quill |
| EDIT | `supabase/functions/civic-ingest/index.ts` | Import embeddings from shared module |
| EDIT | `supabase/functions/civic-scout/index.ts` | JSDoc cleanup only — already correct |
| EDIT | `supabase/config.toml` | Register civic-processor |
| EDIT | `DataSourcesPanel.tsx` | Embedded/processed badges, delete, run processor button |
| CREATE | `CivicIntelligenceCard.tsx` | Public-facing finding card |

Total: 1 migration, 3 new files, 4 edits.

