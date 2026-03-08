

# Upgrade: Our Leaders Channel

## Current State

The `our-leaders` channel is a flat grid of position cards showing name, avatar, verification badge, and term dates. It has no interactivity beyond "Claim This Office" for vacant positions. Key gaps:

1. **No clickable profiles** -- Leader cards don't link to `/g/username` profiles. The hook doesn't even fetch `username` from profiles.
2. **No hierarchy grouping** -- All positions render in a flat grid regardless of authority level (Governor, Senator, MP are all jumbled).
3. **No accountability context** -- No connection to promises/projects. Citizens can't see at a glance what a leader has done.
4. **No pending claims visibility** -- Only verified holders show; pending claims are invisible to community members.
5. **Static display** -- No search, no filter by position type, no way for citizens to engage (ask questions, rate performance).

## Plan

### 1. Enrich the data layer (`useLeaderPositions.ts`)

Fetch additional fields from profiles: `username`, `is_verified`, `official_position`, `official_position_id`. This enables profile linking via `buildProfileLink()`.

Also fetch counts of linked promises and projects per position (via `office_holders` join) to show accountability stats.

### 2. Group positions by authority tier (`LeadersGrid.tsx`)

Group positions into collapsible sections by `authority_level` ranges:
- **Executive** (authority 90+): Governor, Deputy Governor
- **Legislative** (authority 70-89): Senator, MP, Women Rep
- **Ward Level** (authority 50-69): MCA
- **Other** (below 50)

Each group gets a header with count of filled vs total positions.

### 3. Clickable leader cards with accountability stats

Each filled position card becomes a `Link` to the leader's `/g/username` profile. Add mini-stats row:
- Projects linked count
- Promises tracked count
- Verification badge links to office page

### 4. Pending claims indicator

Show pending (unverified) holders with a distinct "Pending Verification" card style -- amber border, muted avatar -- so citizens know someone has claimed but isn't yet verified.

Update the hook query: fetch holders with `verification_status IN ('verified', 'pending')` instead of only `verified`.

### 5. Empty state upgrade

Replace generic "No Positions Found" with an actionable CTA explaining the governance identity system and inviting officials to claim their positions.

## Files to Change

| File | Change |
|------|--------|
| `src/hooks/useLeaderPositions.ts` | Fetch `username, is_verified, official_position, official_position_id` from profiles. Fetch pending holders too. Add promise/project counts. |
| `src/components/community/discord/LeadersGrid.tsx` | Group by authority tier. Clickable cards linking to `/g/username`. Show accountability stats. Pending claims. Improved empty state. |

## Technical Details

**Profile query expansion** (useLeaderPositions.ts line 87-90):
```
.select('id, display_name, avatar_url, username, is_verified, official_position, official_position_id')
```

**Holder query expansion** (line 74-75): Change from `.eq('verification_status', 'verified')` to `.in('verification_status', ['verified', 'pending'])`.

**Authority tier grouping logic**:
```typescript
const tiers = [
  { label: 'Executive Leadership', min: 90, max: 100 },
  { label: 'Legislative Representatives', min: 70, max: 89 },
  { label: 'Ward Representatives', min: 50, max: 69 },
  { label: 'Other Positions', min: 0, max: 49 },
];
```

**Profile linking**: Import `buildProfileLink` and wrap filled position cards in `<Link to={buildProfileLink(holder.user)}>`.

