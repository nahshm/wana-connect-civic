

# Root Cause: New Users Only See 1 Community in "My Communities"

## The Bug — Two Competing Creation Paths

There are **two independent systems** creating geographic communities, and they don't know about each other:

### Path 1: `Step4Communities.tsx` → `createGeographicCommunities()`
- Runs **FIRST** (line 131, before profile update)
- Looks for existing community by `name = countyName.replace(/\s+/g, '')` (e.g. `"Bungoma"`)
- If not found, calls `create_community_with_channels` RPC
- The RPC inserts into `communities` with **NO `type`, `location_type`, or `location_value`** — defaults to `type = 'interest'`
- Returns a mapping of temp IDs → real community IDs
- Later (line 185-226) joins user to these communities

### Path 2: Profile update trigger → `handle_location_community_creation()`
- Fires **AFTER** profile update (line 143-159, which runs after step 1)
- Creates communities with proper `type = 'location'`, `location_type`, `location_value`
- Uses naming pattern: `county-bungoma`, `constituency-webuye-west`, `ward-bokoli`
- Only auto-joins user to the **ward** community (county and constituency are created but user is NOT joined)

### The Result

For a new user from Bungoma/Webuye West/Bokoli:

1. Step4 creates `"Bungoma"` (type=interest), `"WebuweWest"` (type=interest), `"Bokoli"` (type=interest)
2. Step4 joins user to these 3 communities
3. Profile update trigger creates `"county-bungoma"` (type=location), `"constituency-webuye-west"` (type=location), `"ward-bokoli"` (type=location)
4. Trigger joins user to `"ward-bokoli"` only

MyCommunitiesPage filters `type === 'location'` → user only sees 1 community (the ward from the trigger). The 2-3 communities from Step4 are `type = 'interest'` and show in the wrong section (or not at all if the RPC failed silently).

**Evidence from DB:** User `76f877bc` (Bungoma): joined to 1 community (`ward-bokoli`). Three proper location communities exist (`county-bungoma`, `constituency-webuye-west`, `ward-bokoli`) but user is only in the ward.

## Fix Plan

**Single source of truth**: Remove the duplicate community creation from Step4. Instead, let the trigger handle community creation, then look up the resulting communities by `location_type` + `location_value` and join the user to all three.

### Step4Communities.tsx — Rewrite `handleComplete`

1. **Update profile FIRST** (county/constituency/ward text fields + persona + onboarding_completed) — this fires the trigger which creates proper `type='location'` communities
2. **Wait, then look up** the 3 location communities by `location_type`/`location_value` matching the user's county, constituency, ward
3. **Join user** to all 3 found communities via `community_members` upsert
4. **Remove** `createGeographicCommunities()` entirely — it's the source of duplicates

### DB trigger fix — `handle_location_community_creation`

Update the trigger to auto-join the user to **all 3 tiers** (county, constituency, ward), not just ward. This provides a safety net even if the Step4 join fails.

### Cleanup migration

- Delete orphaned `type='interest'` communities that were accidentally created by the old RPC path (duplicates of proper location communities)
- Join existing users to their missing location communities based on their profile's county/constituency/ward fields

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Onboarding/Step4Communities.tsx` | Rewrite `handleComplete`: profile update first, then lookup + join location communities. Remove `createGeographicCommunities()` |
| SQL migration | Update `handle_location_community_creation` to join user to all 3 tiers. Backfill missing memberships. Clean up duplicate interest-type communities |

