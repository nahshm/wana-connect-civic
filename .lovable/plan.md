

## Unified Feed / National Feed Redesign

### Current State & Issues

1. **Authenticated users never see the national feed.** `Home.tsx` redirects logged-in users to `/my-communities` immediately. The sidebar "For You" link points to `/` which triggers this redirect. There is no route for authenticated users to access the unified feed.

2. **Community posts reach the national feed** via the `get_unified_feed` RPC, which queries all posts regardless of community (when `p_community_id` is NULL). User posts without a community also appear. This works correctly in the DB layer.

3. **Guest feed works** but has no way for guests to understand the platform value proposition — it shows raw feed items with no onboarding context.

4. **Architectural issues:**
   - `UnifiedFeedItem` silently hides most activity types (the `hiddenTypes` array filters out 8 of the 16 types), defeating the "unified" purpose
   - The `RightSidebar` duplicates the "Popular Communities" widget that `Home.tsx` also renders
   - The `FeedSortBar` has a "Best" option that just maps to "hot" — confusing
   - `link_url` and `link_title` fields from the RPC are handled in `PostCard` but not included in the RPC's `json_build_object`
   - The Home page has dead Baraza code that's feature-flagged off

### Plan

#### 1. Remove the authenticated redirect — make `/` the unified feed for everyone

- **`Home.tsx`**: Remove the `if (user) return <Navigate to="/my-communities" />` block
- Merge `GuestFeed` into the main component, using `userId: user?.id` in the `useUnifiedFeed` hook so votes are tracked for logged-in users
- Keep `/my-communities` accessible via sidebar but not the default landing

#### 2. Redesign the Home page layout (Reddit reference)

Following the uploaded screenshots, the layout will be:

```text
┌─────────────────────────────────────────────────┐
│  FeedSortBar (Best ▾) (Card/Compact ▾)          │
├──────────────────────────┬──────────────────────┤
│                          │  RECENT POSTS        │
│  PostCard (community     │  - post title...     │
│  avatar, c/name,         │  - post title...     │
│  u/author, time,         │                      │
│  "Suggested for you")    │  POPULAR COMMUNITIES │
│                          │  - c/name  [Join]    │
│  [Join] button on cards  │  - c/name  [Join]    │
│  for non-members         │                      │
│                          │  Footer links        │
│  PostCard ...            │                      │
│  ProjectFeedCard ...     │                      │
│  PromiseFeedCard ...     │                      │
│                          │                      │
│  ∞ infinite scroll       │                      │
└──────────────────────────┴──────────────────────┘
```

Key changes:
- **Remove dead Baraza section** and duplicate Popular Communities from the main column
- **Right sidebar**: Consolidate into `RightSidebar` with "Recent Posts" (with thumbnail, like Reddit screenshot), "Popular Communities", and footer links. Add a "Clear" button for recent posts.
- **FeedSortBar**: Clean up — remove duplicate "Best" option or make it the default label for "hot"
- **Post cards**: Already have Join button + community header — ensure `isMember` and `onJoinCommunity` are properly wired from the feed

#### 3. Wire up membership checks for Join buttons on feed posts

- In `useUnifiedFeed`, after fetching feed items, batch-check which communities the user is a member of (query `community_members` for the user + unique community IDs from the feed)
- Pass `isMember` and `onJoinCommunity` through `UnifiedFeedItem` to `PostCard`

#### 4. Fix UnifiedFeedItem filtering logic

- Remove the overly aggressive `hiddenTypes` array that hides most activity types
- Keep filtering only truly redundant types (e.g., `vote_cast`, `comment_created`) that are noise
- Re-enable `AchievementCard` rendering for `achievement_earned` and `quest_completed`

#### 5. Update the RPC to include `link_url`, `link_title`, `link_description`, `link_image`

- Add these fields to the `json_build_object` in the posts section of `get_unified_feed` so link previews render correctly

#### 6. Early-stage platform handling for guests

- When the feed is empty or has very few items (< 5), show an enhanced `EmptyFeedState` that explains the platform and has clear CTAs (Browse Communities, Create Account)
- No complex user-count-based rules needed yet — the feed naturally fills as content is created. The sort algorithm handles sparse content gracefully (hot score decays, so even few posts surface well)

#### 7. Sidebar navigation update

- "For You" link in `AppSidebar` stays at `/` — now works for both guests and authenticated users
- Add "My Communities" as a separate link to `/my-communities` (already exists)

### Files to modify

| File | Change |
|------|--------|
| `src/features/feed/pages/Home.tsx` | Remove auth redirect, merge into single component, wire membership checks, remove Baraza section, clean up sidebar duplication |
| `src/components/feed/UnifiedFeedItem.tsx` | Fix hiddenTypes filter, re-enable AchievementCard, pass isMember/onJoinCommunity to PostCard |
| `src/hooks/useUnifiedFeed.ts` | Add batch membership check for community posts |
| `src/components/feed/FeedSortBar.tsx` | Clean up Best/Hot duplication |
| `src/components/layout/RightSidebar.tsx` | Add "Recent Posts" with thumbnails (Reddit-style), add "Clear" |
| `src/components/feed/UnifiedFeedItem.tsx` (types) | Add `isMember`/`onJoinCommunity` to props |
| `supabase/migrations/` (new) | Update `get_unified_feed` to include link preview fields |
| `src/components/feed/EmptyFeedState.tsx` | Enhanced guest-friendly empty state |

### Technical details

- **Membership batch check**: Single query `SELECT community_id FROM community_members WHERE user_id = ? AND community_id IN (...)` after feed loads — returns a Set for O(1) lookup
- **RPC update**: Add `'link_url', p.link_url, 'link_title', p.link_title, 'link_description', p.link_description, 'link_image', p.link_image` to the posts json_build_object
- **No breaking changes**: `/my-communities` route remains, sidebar links stay the same

