

# Phase 3: AI Infrastructure + Build Error Fixes

## Part A: Fix Build Errors (Pre-requisite)

The build errors stem from two root causes:

### A.1 Missing Supabase Types

Tables `forum_threads`, `forum_replies`, `project_verifications`, and `administrative_divisions` exist in the database but are **not** in the auto-generated `src/integrations/supabase/types.ts` (which we cannot edit directly).

**Fix**: Add `as any` type assertions at Supabase query call sites for these 4 tables. This is the standard workaround when DB tables exist but types haven't been regenerated.

| File | Table | Instances |
|------|-------|-----------|
| `src/components/community/discord/ForumChannel.tsx` | `forum_threads`, `forum_replies` | 6 calls |
| `src/components/projects/ProjectVerificationButton.tsx` | `project_verifications` | 4 calls |
| `src/features/accountability/pages/ProjectDetail.tsx` | `project_verifications` | 1 call |
| `src/features/accountability/pages/SubmitProject.tsx` | `administrative_divisions` | 6 calls |

**Pattern applied**:
```typescript
// Before (type error)
const { data } = await supabase.from('forum_threads').select(...)

// After (type-safe workaround)
const { data } = await (supabase.from as any)('forum_threads').select(...)
```

### A.2 BookmarkManageDialog Schema Mismatch

The `community_bookmarks` table has columns `title`, `description`, `display_order` but the code uses `label`, `icon`, `position`. 

**Fix**: Update `BookmarkManageDialog.tsx` to use the correct column names:
- `label` -> `title`
- `icon` -> Store in `description` (or add column via migration)
- `position` -> `display_order`

Since adding columns requires a migration and this is a bookmark feature, I'll map existing columns:
- `title` = label text
- `description` = icon name
- `display_order` = position
- `url` = url (already matches)

---

## Part B: AI Infrastructure - Hybrid Architecture

### B.1 Database Migration

Create 5 new tables for the AI infrastructure:

```text
+------------------------+     +-------------------+
| ai_configurations      |     | moderation_logs   |
| - provider_slug (text) |     | - content_type    |
| - api_key (text)       |     | - verdict         |
| - models (jsonb)       |     | - ai_confidence   |
| - is_active (bool)     |     | - reason          |
+------------------------+     +-------------------+

+-------------------+     +-------------------+     +-------------------+
| routing_logs      |     | vectors           |     | rag_chat_history  |
| - issue_type      |     | - content (text)  |     | - session_id      |
| - department_slug |     | - embedding       |     | - role            |
| - severity (int)  |     | - metadata (json) |     | - content         |
| - confidence      |     +-------------------+     | - sources (json)  |
+-------------------+                               +-------------------+
```

**RLS Policies**:
- `ai_configurations`: Service role only (stores API keys)
- `moderation_logs`: Insert for authenticated, select own logs
- `routing_logs`: Insert for authenticated, select own logs
- `rag_chat_history`: Users read/write their own sessions
- `vectors`: Read for authenticated (knowledge base)

### B.2 Edge Functions (3 Functions)

#### Function 1: `civic-steward` (Content Moderation)

- **Endpoint**: POST with `{ content_type, content, user_id }`
- **Logic**: Fetches Groq API key from `ai_configurations`, sends content to Llama 3 for moderation
- **Checks**: Hate speech, PII, quality (promises need dates)
- **Output**: `{ verdict: 'APPROVED' | 'NEEDS_REVISION' | 'BLOCKED', reason, confidence }`
- **Logging**: Inserts into `moderation_logs`

#### Function 2: `civic-router` (Issue Routing)

- **Endpoint**: POST with `{ issue_description, location, user_id }`
- **Logic**: Uses Llama 3 to classify issue type, determine jurisdiction, assign severity
- **Output**: `{ issue_type, department_name, severity, confidence, recommended_actions }`
- **Logging**: Inserts into `routing_logs`

#### Function 3: `civic-brain` (RAG Q&A)

- **Endpoint**: POST with `{ query, session_id, user_id, language }`
- **Logic**: Embeds query, vector search in `vectors` table, generates answer with Llama 3
- **Output**: `{ answer, sources, confidence }`
- **Logging**: Inserts into `rag_chat_history`

### B.3 Frontend Integration

**New file**: `src/services/aiClient.ts`

A unified TypeScript service:

```typescript
export const aiClient = {
  governance: (contentType, content) => 
    supabase.functions.invoke('civic-steward', { body: {...} }),
  
  routing: (issueDescription, location) => 
    supabase.functions.invoke('civic-router', { body: {...} }),
  
  rag: (query, sessionId, language) => 
    supabase.functions.invoke('civic-brain', { body: {...} }),
};
```

### B.4 Groq API Key Setup

Before edge functions work, you'll need to provide your Groq API key. I'll use the secrets tool to securely store it as a Supabase secret accessible by edge functions.

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/civic-steward/index.ts` | Content moderation edge function |
| `supabase/functions/civic-router/index.ts` | Issue routing edge function |
| `supabase/functions/civic-brain/index.ts` | RAG Q&A edge function |
| `src/services/aiClient.ts` | Unified frontend AI client |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/community/discord/ForumChannel.tsx` | Add type assertions for missing tables |
| `src/components/projects/ProjectVerificationButton.tsx` | Add type assertions |
| `src/features/accountability/pages/ProjectDetail.tsx` | Add type assertions |
| `src/features/accountability/pages/SubmitProject.tsx` | Add type assertions |
| `src/components/community/BookmarkManageDialog.tsx` | Fix column name mismatch |
| `supabase/config.toml` | Register 3 new edge functions |

## Database Changes

| Change | Type |
|--------|------|
| Create `ai_configurations` table | Migration |
| Create `moderation_logs` table | Migration |
| Create `routing_logs` table | Migration |
| Create `vectors` table (with pgvector) | Migration |
| Create `rag_chat_history` table | Migration |
| Add RLS policies for all 5 tables | Migration |

## Implementation Order

1. Fix build errors first (Part A) - unblocks development
2. Run database migration (Part B.1) - creates AI tables
3. Request Groq API key secret (Part B.4)
4. Deploy edge functions (Part B.2)
5. Create frontend aiClient (Part B.3)
6. Test end-to-end

## Effort Estimate

| Phase | Duration |
|-------|----------|
| Build error fixes | 1 hour |
| Database migration | 30 minutes |
| Edge functions (3) | 3-4 hours |
| Frontend client | 1 hour |
| Testing | 1 hour |
| **Total** | **6-7 hours** |

