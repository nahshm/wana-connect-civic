


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

civic-publisher (new, cron + seed mode)
       │
       ├── resolves geographic scope per finding
       ├── deduplicates via embedding similarity (0.91 threshold)
       ├── rewrites to citizen language via LLM (publisher_templates)
       └── inserts into posts table (auto_generated=true)

_shared/embeddings.ts (shared module)
       └── embedText() + embedAndInsert() — used by civic-ingest AND civic-processor
```

## Status: IMPLEMENTED ✅

All migrations applied, all files created/edited, civic-publisher deployed.

### Files

| Action | File | Status |
|--------|------|--------|
| MIGRATION | `scout_findings.cluster_id`, `processor_run_id` | ✅ Done |
| MIGRATION | `posts.auto_generated`, `finding_id`, `published_by_agent` | ✅ Done |
| MIGRATION | `publisher_templates` table + seed data | ✅ Done |
| MIGRATION | `communities.publisher_context` | ✅ Done |
| MIGRATION | `scout_findings.published` | ✅ Done |
| CREATE | `supabase/functions/_shared/embeddings.ts` | ✅ Done |
| CREATE | `supabase/functions/civic-processor/index.ts` | ✅ Done |
| CREATE | `supabase/functions/civic-publisher/index.ts` | ✅ Done + Deployed |
| CREATE | `src/features/admin/pages/components/IntelligenceSection.tsx` | ✅ Done |
| EDIT | `src/features/admin/pages/SuperAdminDashboard.tsx` | ✅ Intelligence section added |
| EDIT | `src/features/admin/pages/components/AICommandSection.tsx` | ✅ Publisher agent registered |
| EDIT | `supabase/config.toml` | ✅ civic-publisher registered |
| EDIT | `src/components/civic/CivicIntelligenceCard.tsx` | ✅ AI badge + source attribution |
