

# Fix User Context to Use Actual Onboarding Data

## Problem

The onboarding flow collects three key pieces of personalization data, but the AI backend (`userContext.ts`) crashes because it queries non-existent columns. The data is stored correctly but never reaches the AI.

### Where the Data Actually Lives

| Onboarding Step | Data | Stored In |
|----------------|------|-----------|
| "Your Location" | county, constituency, ward | `profiles.county`, `profiles.constituency`, `profiles.ward` (text) + UUID refs |
| "What Matters to You" | civic interests (3+) | `user_interests` table (maps user_id to `civic_interests.id`) |
| "How Do You Want to Engage?" | persona | `profiles.persona` (enum: active_citizen, community_organizer, etc.) |

### What `userContext.ts` Currently Tries to Read (and fails)

- `profiles.interests` -- does NOT exist (interests are in `user_interests` table)
- `profiles.preferred_language` -- does NOT exist
- `profiles.full_name` -- does NOT exist (it's `display_name`)
- `profiles.verified_role` -- does NOT exist (it's `is_verified`)
- `profiles.expertise_areas` -- does NOT exist (it's `expertise`)
- `profiles.engagement_score` -- does NOT exist (it's `karma`)
- `profiles.total_contributions` -- does NOT exist
- `profiles.last_active_at` -- does NOT exist (it's `last_activity`)
- `user_context_cache` table -- does NOT exist
- `user_activity_context` table -- does NOT exist

## Solution

### 1. Rewrite `supabase/functions/_shared/userContext.ts`

Query the correct columns from `profiles` and fetch interests from the `user_interests` + `civic_interests` tables:

```text
profiles: display_name, county, constituency, ward, role, persona, 
          is_verified, expertise, karma, last_activity

user_interests + civic_interests: join to get interest names 
  (e.g., "Water & Sanitation", "Healthcare")
```

Key changes:
- Query `profiles` with correct column names
- Query `user_interests` joined with `civic_interests` to get interest display names
- Map `persona` to `role` (persona is the engagement style from onboarding, more descriptive than the generic `role` field)
- Remove all references to non-existent cache tables
- Default `preferredLanguage` to `'en'` (no column exists for this yet)

### 2. Update `supabase/functions/civic-brain/index.ts`

- Fix the fire-and-forget profile update: change `last_active_at` to `last_activity`

### 3. Deploy both functions

## What This Unlocks

Once fixed, the existing `promptBuilder.ts` (which is already well-built) will finally receive real data:

- **Interest personalization**: "Primary Interest: Water & Sanitation" will bias answers toward water issues
- **Persona-based communication style**: A "community_organizer" gets strategic, resource-focused answers; a "civic_learner" gets educational, empowering ones
- **Location-aware answers**: Specific county/ward facilities and contacts
- **Activity insights**: Karma-based engagement level adjustments

## What Stays the Same

- `promptBuilder.ts` -- no changes needed, it already handles all personalization logic
- The `UserContext` interface shape stays compatible
- Frontend `CivicChat.tsx` -- no changes needed
- All onboarding components -- no changes needed

## Scope

- 2 files modified (`userContext.ts`, `civic-brain/index.ts`)
- 0 new files
- 0 database changes

