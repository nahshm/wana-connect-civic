

# Channel Order Mismatch in Geographic Communities

## Root Causes Found

### Bug 1: `type='feed'` filter steals MONITORING channels into FEED category

In `ChannelList.tsx` line 102-104, the grouping logic is:

```
FEED: channels.filter(c => c.category === 'FEED' || c.type === 'feed'),
MONITORING: channels.filter(c => c.category === 'MONITORING' && c.type !== 'feed'),
```

The seed function (latest migration) sets `our-leaders`, `projects-watch`, and `promises-watch` to `type='feed'`. Because of the `|| c.type === 'feed'` condition, these three MONITORING channels get pulled into the FEED category. This means:

- **FEED category shows**: community-feed, our-leaders, projects-watch, promises-watch
- **Civic Watch (MONITORING) shows**: only project-tracker (the forum)
- This is the primary mismatch

### Bug 2: Inconsistent channel types across old vs new communities

Old communities (Nairobi, EmbakasiEast, Utawala) have `our-leaders`, `projects-watch`, `promises-watch` as `type='text'`. Newer communities created after the latest migration have them as `type='feed'`. This means the grouping bug only manifests on **newly created** communities, while old ones happen to work correctly (because `type='text'` doesn't trigger the feed filter).

### Bug 3: No position-based ordering in the query

`useCommunity.ts` fetches `channels(*)` with no `order` clause. The DB returns channels in insertion order, which happens to match position order for seeded channels, but any manually created channels will appear at the end regardless of their position value.

## Plan

### Fix 1: Fix the grouping logic in ChannelList.tsx (line 101-105)

Group channels **only by their `category` field**, removing the `type === 'feed'` override. The `type` field describes the channel's rendering behavior (feed view, chat, forum), NOT its category placement.

```
FEED: channels.filter(c => c.category === 'FEED'),
INFO: channels.filter(c => c.category === 'INFO'),
MONITORING: channels.filter(c => c.category === 'MONITORING'),
ENGAGEMENT: channels.filter(c => c.category === 'ENGAGEMENT'),
```

### Fix 2: Standardize channel types in DB

SQL migration to update the MONITORING channels to `type='text'` (they use special name-based routing in ChannelContent anyway — LeadersGrid, ProjectsGrid, PromisesGrid). Also update the seed function to use `type='text'` for these channels.

### Fix 3: Add position ordering to channel query

In `useCommunity.ts`, change `channels(*)` to fetch with ordering. Since PostgREST embedded resource ordering requires the syntax `channels(*).order(position)` or sorting client-side, sort channels by position on the client after fetch.

### Files to Change

| File | Change |
|------|--------|
| `src/components/community/discord/ChannelList.tsx` | Fix grouping to use category only, sort by position |
| `src/hooks/useCommunity.ts` | Sort channels by position after fetch |
| SQL migration | Standardize MONITORING channel types to `text`, update seed function |

