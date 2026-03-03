

# Revised Combined Plan: Fix Types, Onboarding Persona Loop, Dashboard Errors, and Community Categories

## Critical Discovery: Corrupted `types.ts` is the Root Cause of 50+ Build Errors

The `src/integrations/supabase/types.ts` file is **corrupted**. It is UTF-16 encoded with null bytes, and the `Database` type defines `Tables: { [_ in never]: never }` — an empty schema. This is why EVERY Supabase query across the entire app (chat, community, posts, profiles, etc.) resolves to type `never`, producing the massive wall of build errors.

**This single file corruption causes ALL of the following build errors**: `ChannelChatWindow.tsx`, `ChatSidebar.tsx`, `ChatWindow.tsx`, `UserSearch.tsx`, `CommunityBookmarks.tsx`, `CommunitySettingsDialog.tsx`, `CommunitySidebar.tsx`, `CreateCommunityWizard.tsx`, `CreatePostModal.tsx`, `ModMailDialog.tsx`, `RelatedCommunities.tsx`, `RulesManageDialog.tsx`, and many more.

**Fix**: Regenerate `types.ts` from the Supabase schema. This is an auto-generated file that should contain full table definitions for all ~60+ tables in the database. Once regenerated, all `never` type errors disappear without touching any component code.

---

## Part 1: Regenerate `types.ts` (Fixes 50+ Build Errors)

Regenerate the Supabase types file so the `Database` type includes all public tables, views, functions, and enums. This is the standard Supabase-generated file and should not be manually edited — it needs to be re-synced from the database schema.

---

## Part 2: Persona Enum — Expand Rather Than Collapse

### Current State
- **DB enum `user_persona`**: `active_citizen`, `community_organizer`, `civic_learner`, `government_watcher`, `professional`
- **Frontend Step3Persona options**: `citizen`, `youth_leader`, `community_organizer`, `business_owner`, `journalist`, `official`, `ngo_worker`
- **DB `role` column** (text, not enum): `citizen`, `official`, `expert`, `journalist`, `admin` — used for **permissions/RLS**
- **DB `app_role` enum**: `admin`, `moderator`, `official`, `expert`, `journalist`, `citizen`, `super_admin` — used in `user_roles` table for **authorization**

### Analysis: Why You Have Two Separate Systems

The `role` column = **permissions** (what you can do). The `persona` column = **personalization** (how the platform talks to you). These serve different purposes and should remain separate.

The current 5 enum values are too abstract. "Active Citizen" and "Professional" don't match the rich, descriptive persona options on the onboarding screen. The AI `promptBuilder.ts` maps personas to communication styles — it already has 7 styles (`citizen`, `youth_leader`, `community_organizer`, `journalist`, `official`, `ngo_worker`, `business_owner`) but the DB enum only allows 5 values, so the mapping breaks.

### Decision: Expand the `user_persona` Enum

**Add 2 new values** and **rename 3 existing values** to match the frontend options exactly:

| Old Enum Value | New Enum Value | Frontend Label |
|---|---|---|
| `active_citizen` | `active_citizen` | Regular Citizen (keep) |
| `community_organizer` | `community_organizer` | Community Organizer (keep) |
| `civic_learner` | rename to `journalist` | Journalist |
| `government_watcher` | rename to `government_watcher` | Government Watcher (keep, relabel from "Gov Official") |
| `professional` | rename to `business_owner` | Business Owner |
| (new) | `youth_leader` | Youth Leader |
| (new) | `ngo_worker` | NGO/CSO Worker |

**Why this approach**:
- The `promptBuilder.ts` already has communication styles for all 7 personas — this makes the mapping 1:1 with no lossy compression
- AI agents (`civic-brain`, `civic-guardian`) use `persona` directly for personalization — richer values = better personalization
- The `role` column stays untouched (permissions unchanged)
- No RLS policy changes needed — `persona` is never used in RLS, only in AI prompt construction
- Users see meaningful labels that match their self-identity, increasing engagement

### DB Migration

```sql
-- Add new values
ALTER TYPE user_persona ADD VALUE IF NOT EXISTS 'youth_leader';
ALTER TYPE user_persona ADD VALUE IF NOT EXISTS 'ngo_worker';
ALTER TYPE user_persona ADD VALUE IF NOT EXISTS 'journalist';
ALTER TYPE user_persona ADD VALUE IF NOT EXISTS 'business_owner';

-- Migrate existing data for renamed values
UPDATE profiles SET persona = 'journalist' WHERE persona = 'civic_learner';
UPDATE profiles SET persona = 'business_owner' WHERE persona = 'professional';
```

Note: Postgres does not support renaming enum values or removing old ones easily. The old values (`civic_learner`, `professional`) will remain in the enum but won't be used. New onboarding will only write the 7 active values.

### Frontend Update: `Step3Persona.tsx`

Update the 7 persona IDs to match the expanded enum:

| ID | Title | Description |
|---|---|---|
| `active_citizen` | Regular Citizen | I want to access services and report issues |
| `youth_leader` | Youth Leader | I want to mobilize youth and find opportunities |
| `community_organizer` | Community Organizer | I want to lead initiatives and track civic progress |
| `business_owner` | Business Owner | I want to find tenders, licenses, and business support |
| `journalist` | Journalist | I need to verify facts, data, and government records |
| `government_watcher` | Government Watcher | I want to track budgets, accountability, and government performance |
| `ngo_worker` | NGO/CSO Worker | I want to coordinate development projects and advocacy |

### Backend Update: `promptBuilder.ts`

Update `getRoleDescription()` keys to match the new enum values. The communication styles already exist for all 7 — just ensure the key mapping is correct (e.g., `official` key becomes `government_watcher`).

### Backend Update: `userContext.ts`

The line `const effectiveRole = profile.persona || profile.role || 'citizen'` already works. The persona value flows directly into `context.role`, which feeds `getRoleDescription()` and `buildCommunicationStyle()`. With the expanded enum, this mapping becomes 1:1 — no lossy compression.

---

## Part 3: Fix Quest Column Mismatches (Dashboard 400 Errors)

The `quests` table has `points` (integer). It does NOT have `xp_reward`, `tasks_total`, or `badge_name`. The `user_quests` table does NOT have `tasks_completed`.

**Files to update** (replace `xp_reward` with `points`, remove missing columns):

| File | Changes |
|---|---|
| `src/components/dashboard/DashboardQuestWidget.tsx` | `xp_reward` -> `points` in select and mapping |
| `src/components/widgets/ActiveQuestsWidget.tsx` | `xp_reward` -> `points`, remove `tasks_total`, `badge_name`, `tasks_completed` references; use `progress` field from `user_quests` instead |
| `src/components/feed/QuestCard.tsx` | Update interface: `xp_reward` -> `points`, remove `tasks_total` |
| `src/types/feed.ts` | Rename `xp_reward` to `points` |
| `src/utils/feedIntegration.ts` | Replace `xp_reward` sort with `points` |

UI labels can still display "XP" — only the data field name changes.

---

## Part 4: Fix Leaderboard Join (Dashboard 400 Error)

`leaderboard_scores` has **no foreign keys at all** (confirmed via query). The `profiles!inner(...)` join fails because PostgREST requires a FK relationship.

**DB Migration**: Add FK from `leaderboard_scores.user_id` to `profiles.id`:

```sql
ALTER TABLE leaderboard_scores
ADD CONSTRAINT leaderboard_scores_profile_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id);
```

No code changes needed in `DashboardLeaderboardWidget.tsx` — the existing query will work once the FK exists.

---

## Part 5: Clean Up Step4Communities (FK Safety)

Step4Communities is **geographic-only**. The interest-based query on lines 47-51 filters by categories that don't exist in the DB, always returns empty, and is dead code.

**Changes to `Step4Communities.tsx`**:
1. **Remove** lines 47-51 (dead interest-based query)
2. **Remove** the `isGeo: false` mapping on line 55
3. **Update subtitle** to "based on your location" (remove "and interests")
4. **Add FK safety check** before upserting into `community_members`: verify all resolved community IDs exist in the `communities` table to prevent error 23503

```text
Before upsert:
  1. Collect all community IDs to join
  2. SELECT id FROM communities WHERE id IN (collected IDs)
  3. Filter memberships to only include verified IDs
  4. Upsert only the verified memberships
```

---

## Part 6: Community Category Picker (New Feature)

### New file: `src/constants/communityCategories.ts`

Shared category definitions used by both the community creation wizard and any future category-based filtering:

| Group | Categories |
|---|---|
| Civic and Governance | `governance`, `accountability`, `civic-education`, `discussion` |
| Social Services | `education`, `healthcare`, `infrastructure`, `environment`, `security` |
| Organizations | `economic-empowerment`, `youth`, `women-rights`, `ngo`, `community-org` |

### Update: `CreateCommunityWizard.tsx`
- Add `category` to `CommunityData` interface (default: `'discussion'`)
- Pass `communityData.category` into `.insert()` instead of hardcoding `'discussion'`

### Update: `Step2_NameDescription.tsx`
- Add category picker UI (responsive grid of selectable cards grouped by section)
- Single-select, required field

---

## Part 7: How Onboarding Data Flows to Agents and Platform Features

After implementing Parts 2-5, the onboarding "loop" closes as follows:

```text
User completes onboarding
  -> profiles.persona = 'youth_leader' (expanded enum)
  -> profiles.county/constituency/ward = location text
  -> profiles.county_id/constituency_id/ward_id = location UUIDs
  -> user_interests rows = selected civic_interest IDs
  -> community_members rows = geographic communities joined
  -> profiles.onboarding_completed = true

When user uses CivicChat:
  -> civic-brain calls getUserContext()
  -> getUserContext reads profiles.persona + user_interests + civic_interests
  -> buildPersonalizedPrompt() uses persona for:
     - getRoleDescription() -> identity section
     - buildCommunicationStyle() -> tone/approach
     - interests -> topic bias in responses

When user views feed:
  -> interests influence content ranking
  -> persona influences widget suggestions
  -> location filters local content
```

The existing `userContext.ts` and `promptBuilder.ts` already support this flow — the only gap is the persona enum mismatch, which Part 2 fixes.

---

## Implementation Order

| Step | Change | Impact |
|---|---|---|
| 1 | Regenerate `types.ts` | Fixes 50+ build errors across entire app |
| 2 | DB migration: expand `user_persona` enum + leaderboard FK | Enables persona fix + leaderboard join |
| 3 | Update `Step3Persona.tsx` persona IDs | Fixes onboarding 400 error |
| 4 | Update `promptBuilder.ts` key mappings | Aligns AI personalization with new enum |
| 5 | Fix quest `xp_reward` -> `points` (5 files) | Fixes dashboard quest 400 errors |
| 6 | Clean up `Step4Communities.tsx` + FK safety | Fixes community FK 23503 error |
| 7 | Add community category picker (3 files) | New feature for community creation |

