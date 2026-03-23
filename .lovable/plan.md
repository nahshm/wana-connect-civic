

# Intelligence Hub + Civic Publisher — Revised Plan

## Summary

New admin "Intelligence" section + `civic-publisher` edge function that converts scout findings into localized community posts. All 6 gaps from the review are addressed.

## Gap Resolutions

| Gap | Resolution |
|-----|------------|
| **1. Seed mode auto-approves scandals** | Add `requires_review BOOLEAN DEFAULT false` to `publisher_templates`. Seed mode checks this flag per category — scandal/promise templates default to `requires_review=true`, so those always go to `pending_review` even in seed mode |
| **2. Scope resolution underspecified** | Add `resolveScope()` to `_shared/agentUtils.ts` with 3 explicit rules: ward-level → exact match, county-level → all communities with `location_value=county`, national → all communities. Queries `communities` table using `location_type` + `location_value` columns |
| **3. Seed post backdating** | Seed mode sets `created_at = NOW() - (index * interval '18 hours')` per post. 5 posts = ~3.5 days of apparent history |
| **4. Model string verification** | Use `google/gemini-3-flash-preview` via Lovable AI Gateway (confirmed available). Store `fallback_model` in `agent_state` for civic-publisher |
| **5. Dedup queries wrong table** | Use **Option A**: dedup against `scout_findings WHERE published=true` using existing embeddings from vectors table where `source='scout'`. Same source data, correct similarity check |
| **6. Bulk publish rate limit** | Bulk "Publish" writes finding IDs to `agent_state` as `civic-publisher/publish_queue`. Publisher processes max 10 per invocation. UI shows "Queued" badge |

## Database Migrations (4)

**Migration 1 — Posts table**: Add `auto_generated BOOLEAN DEFAULT false`, `finding_id UUID REFERENCES scout_findings(id)`, `published_by_agent TEXT`

**Migration 2 — publisher_templates table**:
```sql
CREATE TABLE publisher_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  output_format JSONB DEFAULT '{}',
  example_good TEXT,
  example_bad TEXT,
  requires_review BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
RLS: admin-only CRUD via `is_admin()`. Seed 6 default templates (budget, project, scandal, promise, policy, tender) with scandal and promise having `requires_review=true`.

**Migration 3 — communities**: Add `publisher_context TEXT`

**Migration 4 — scout_findings**: Add `published BOOLEAN DEFAULT false`

## New Edge Function: `civic-publisher/index.ts`

Two modes via request body:
- **Ongoing** `{ trigger: 'cron' }`: Finds `processed=true AND published=false AND relevance_score >= 0.7`, max 2 posts per community
- **Seed** `{ seed: true, community_id }`: Last 30 days, relevance >= 0.5, max 5 posts, backdated

Per finding:
1. `resolveScope(finding)` → list of matching community IDs
2. Dedup: `embedText(title+summary)`, check similarity against `scout_findings WHERE published=true` embeddings. Skip if > 0.91
3. Load `publisher_templates` for category. Inject community `publisher_context`. Call Lovable AI Gateway
4. Insert into `posts` with `auto_generated=true`, `finding_id`, `published_by_agent='civic-publisher'`, `author_id` = service account
5. If template `requires_review=true` → `moderation_status='pending_review'`, else in seed mode → `'approved'`, in ongoing mode → `'pending_review'`
6. Mark `scout_findings.published=true`

Uses `LOVABLE_API_KEY` for LLM calls.

## New Admin Section: `IntelligenceSection.tsx`

Added as section between AI Command and Accountability in SuperAdminDashboard.

**4 sub-tabs:**

**A. Findings Review**: Table of `scout_findings` with category/county filters, embedded/processed/published status badges. Row action: "Publish to Communities" (single finding → invoke civic-publisher). Bulk action: queues finding IDs to `agent_state`, shows "Queued" badge, publisher processes max 10 per run.

**B. Auto-Generated Posts**: Query `posts WHERE auto_generated=true`. Shows community, moderation_status, source finding. Actions: Approve, Edit, Reject.

**C. Publisher Templates**: CRUD for `publisher_templates` — edit system_prompt, examples, requires_review toggle. Preview: paste finding text, call civic-publisher in dry-run mode, show output.

**D. Publisher Settings**: Global auto-publish toggle (agent_state), daily cap slider, relevance threshold, seed trigger (select community → "Seed"), community context editor.

## CivicIntelligenceCard.tsx Update

Existing card already has category badge, relevance score, source link. Add:
- `auto_generated` prop → shows "AI Generated" badge with Bot icon
- `source_attribution` prop → shows "via Nation Africa" etc.
- Used in community feed when rendering auto-generated posts

## Shared Utility: `resolveScope()` in `_shared/agentUtils.ts`

```text
resolveScope(finding) → { community_ids: string[] }

Rules:
1. finding.related_to = 'ward' → communities WHERE location_type='ward' AND location_value=finding.related_name
2. finding.related_to = 'county' OR finding.county set → communities WHERE location_type='county' AND location_value=finding.county
   PLUS communities WHERE location_type='ward' AND location_value IN (wards of that county)
3. finding.related_to = 'national' or no geographic info → all communities
```

## Files

| Action | File | What |
|--------|------|------|
| MIGRATION | 4 migrations | posts columns, publisher_templates + seed data, communities.publisher_context, scout_findings.published |
| CREATE | `supabase/functions/civic-publisher/index.ts` | Two-mode publisher with scope resolution, dedup, LLM rewrite |
| CREATE | `src/features/admin/pages/components/IntelligenceSection.tsx` | Full 4-tab admin Intelligence section |
| EDIT | `src/features/admin/pages/SuperAdminDashboard.tsx` | Add Intelligence section to nav |
| EDIT | `supabase/functions/_shared/agentUtils.ts` | Add `resolveScope()` helper |
| EDIT | `src/features/admin/pages/components/AICommandSection.tsx` | Register civic-publisher in agent registry + trigger payloads |
| EDIT | `supabase/config.toml` | Register civic-publisher |
| EDIT | `src/components/civic/CivicIntelligenceCard.tsx` | Add auto_generated badge + source attribution |

Total: 4 migrations, 2 new files, 5 edits.

