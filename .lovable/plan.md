

# Understanding Check: Tier Community Channels vs. Interest Community Channels

## Example — "Report an Issue" Channel

Your tier communities (County, Constituency, Ward) are auto-joined during onboarding. Every user in Nairobi County is automatically in `c/Nairobi`. These tier communities already have channel categories:

- **FEED** — posts, feed
- **INFO** — announcements, resources  
- **MONITORING** — projects, promises, leaders (Civic Watch)
- **ENGAGEMENT** — general-chat, events, polls

Now imagine someone creates an interest community like `c/NairobiCyclists`. If that community also creates a `#report-issues` channel, a `#projects` channel, and a `#leaders` channel — those **duplicate** what the tier community already provides.

**The correct pattern:**

| Function | Where it lives | Why |
|----------|---------------|-----|
| Report a pothole on Bike Lane X | `c/Nairobi` → `#report-issues` (MONITORING) | It's a civic issue tied to geography — the county government handles it |
| Track road project progress | `c/Nairobi` → `#projects` (MONITORING) | Accountability is location-bound |
| Discuss best cycling routes | `c/NairobiCyclists` → `#general` (ENGAGEMENT) | Interest-specific discussion |
| Organize a group ride | `c/NairobiCyclists` → `#events` (ENGAGEMENT) | Community-specific activity |

So `c/NairobiCyclists` should **not** have MONITORING channels (projects, promises, leaders, report-issues) because those are civic functions handled by the tier community. Interest communities should focus on FEED and ENGAGEMENT channels.

---

# Implementation Plan

## Phase 1: Route Landing Page Logic

**File: `src/features/feed/pages/Home.tsx`**

- If `user` is authenticated → redirect to `/my-communities` (or render MyCommunitiesPage inline)
- If guest (no user) → show the current unified feed as the "National Feed"
- This is a simple conditional at the top of the `Index` component

## Phase 2: Enhance MyCommunitiesPage as the Logged-in Home

**File: `src/features/community/pages/MyCommunitiesPage.tsx`**

Current state: a static list of cards grouped by location vs. interest. Needs to become an active dashboard:

- **Activity summary strip** at top: unread counts / recent activity badges per community
- **Quick-switch tiles** for tier communities (County → Constituency → Ward) with activity indicators
- **Interest communities** section below with last-active sorting
- **"Explore more"** CTA linking to `/communities?view=explore`
- Clicking any community tile navigates to `/c/{name}` (existing behavior)

## Phase 3: Channel Category Enforcement for Non-Tier Communities

**File: `src/components/community/discord/CreateChannelDialog.tsx`**

- Detect if the community is a tier/location community (category === 'location' or matched to user geo)
- **Tier communities**: allow all 4 channel categories (FEED, INFO, MONITORING, ENGAGEMENT)
- **Interest/org communities**: only allow FEED and ENGAGEMENT categories — hide MONITORING and INFO from the category picker
- This prevents duplication of civic functions (projects, promises, leaders, issue reporting) in non-geographic communities

**File: `src/components/community/discord/ChannelList.tsx`**

- No structural change needed — it already renders by category. The enforcement happens at creation time.

## Phase 4: Smart Feed Ordering (Future-Ready)

The unified feed RPC `get_unified_feed` already exists. The personalization layer (engagement, urgency, relevance) is a backend concern. For now:

- Add a `community_id` filter param so the feed can be scoped per community
- The existing `sortBy` param (hot/new/top/rising) provides basic ordering
- True personalization (user interests, engagement history) requires an edge function or DB function update — flag this for a separate iteration

## Files Changed

| File | Change |
|------|--------|
| `src/features/feed/pages/Home.tsx` | Auth check: redirect logged-in users to `/my-communities`, keep feed for guests |
| `src/features/community/pages/MyCommunitiesPage.tsx` | Add activity indicators, quick-switch tier tiles, better layout as "home" |
| `src/components/community/discord/CreateChannelDialog.tsx` | Restrict channel categories for non-tier communities |

