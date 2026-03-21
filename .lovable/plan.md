

# Audit Report Assessment

## Status: 13 of 14 Bugs Already Fixed

All edge function bugs (#1-9) and frontend bugs (#12-14) are already patched in the current codebase. The audit accurately describes fixes that have been applied.

## Remaining Item: Bug #11 — scout_findings unique index

`scout_findings.source_url` has no UNIQUE index. The civic-scout code does application-level deduplication (bulk pre-check + insert error catching), but concurrent cron runs could still insert duplicates in a race condition window.

**Fix**: Add a unique index on `source_url` via migration:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_scout_findings_source_url
ON public.scout_findings (source_url);
```

## Bug #10 Correction — No "incidents" table exists

The audit references an `incidents` table with `case_number` using `random()`. This table does not exist in the project. The actual `case_number` field is on `civic_actions` and uses `MD5(NEW.id::text)` where `id` is a UUID — this is collision-resistant by design (unique UUID input → unique MD5 output). No sequence replacement is needed.

## Production Hardening Recommendations (from audit)

The audit's remaining recommendations are valid deployment decisions, not code bugs:
1. Set `ADMIN_HEALTH_SECRET` env var in Supabase secrets
2. Add `AbortSignal.timeout(30000)` wrapper around `callLLM()` in `llmClient.ts`
3. Consider server-side rate limiting for anonymous submissions

## Implementation

### Files Changed
- **1 migration** — Add unique index on `scout_findings.source_url`
- **1 edit** to `supabase/functions/_shared/llmClient.ts` — Add timeout guard around LLM calls (defensive hardening)

Total: 2 small changes. Everything else is already done.

