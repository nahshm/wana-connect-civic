

# Disconnect Audit: Geographic Community Channels

## Database Status: All 3 tier communities (Nairobi, EmbakasiEast, Utawala) have IDENTICAL channel sets

All 10 channels present in each:

| Channel | Type | Category | Status |
|---------|------|----------|--------|
| community-feed | feed | FEED | Falls to POST FEED fallback (works but uses legacy PostCard, not unified feed) |
| intros | text | INFO | Works — routes to ChannelChatWindow |
| announcements | announcement | INFO | Works — routes to ChannelChatWindow (read-only for non-admins) |
| our-leaders | text | MONITORING | Works — special name-based routing to LeadersGrid |
| projects-watch | text | MONITORING | Works — special name-based routing to ProjectsGrid |
| promises-watch | text | MONITORING | Works — special name-based routing to PromisesGrid |
| project-tracker | forum | MONITORING | Works — routes to ForumChannel |
| general-chat | text | ENGAGEMENT | Works — routes to ChannelChatWindow |
| baraza | video | ENGAGEMENT | **BROKEN** — `video` type not handled in ChannelContent routing |
| public-forum | forum | ENGAGEMENT | Works — routes to ForumChannel |

## Disconnects Found

### 1. `baraza` channel (video type) — BROKEN
`ChannelContent.tsx` line 100 handles `text`, `announcement`, `voice`, `chat` but NOT `video`. The baraza channel (type=`video`) falls through to the POST FEED fallback, showing an empty posts view instead of video/audio functionality. The `BarazaRoom` component exists but connects to a hardcoded `localhost:5000` WebSocket — not production-ready.

### 2. Virtual Interactive channels (Events/Polls) — FUNCTIONAL but hardcoded
`virtual-events` and `virtual-polls` are hardcoded in `ChannelList.tsx` as virtual buttons (not DB channels). They render `CommunityEventsWidget` and `CommunityPollsWidget` via special-case handling in `Community.tsx`. These work but appear identically in ALL communities (tier and interest), with no filtering to prevent duplication per the tier-only principle.

### 3. `community-feed` channel (feed type) — SUBOPTIMAL
Feed-type channels fall to the POST FEED fallback which uses a basic `PostCard` list with `CreatePostInput`. This works but doesn't use the unified feed system (`get_unified_feed` RPC with smart sorting). It's a disconnected, simpler feed.

### 4. Seed function mismatch
The current `seed_community_channels()` trigger function (from latest migration `20260103180000`) does NOT seed `intros` or `projects-watch`. These exist in older communities because earlier migrations backfilled them, but **new communities created after Jan 2026 will be missing `intros` and `projects-watch`**.

## Plan

### Fix 1: Route `video` type in ChannelContent
Add `channel?.type === 'video'` to the chat/voice routing condition in `ChannelContent.tsx`. Since baraza has no production backend, render a "Coming Soon" placeholder or route to ChannelChatWindow as a text fallback.

### Fix 2: Update seed function to include missing channels
SQL migration to add `intros` (INFO) and `projects-watch` (MONITORING) to the seed function, and backfill any communities missing them.

### Fix 3: Restrict Interactive section to tier communities
Pass `isTierCommunity` prop to `ChannelList` and conditionally hide the Interactive section (Events/Polls) for interest communities — same principle as the MONITORING/INFO restriction in `CreateChannelDialog`.

### Fix 4: Connect community-feed to unified feed
Update `ChannelContent` to detect `feed` type channels and render the unified feed with `FeedSortBar` + `get_unified_feed` RPC (scoped by `community_id`) instead of the legacy PostCard list.

### Files to Change
| File | Change |
|------|--------|
| `src/components/community/discord/ChannelContent.tsx` | Add `video` type handling; upgrade `feed` type to use unified feed |
| `src/components/community/discord/ChannelList.tsx` | Accept `isTierCommunity` prop, hide Interactive for non-tier |
| `src/features/community/pages/Community.tsx` | Pass `isTierCommunity` to ChannelList |
| SQL migration | Update seed function to include `intros` + `projects-watch`; backfill |

