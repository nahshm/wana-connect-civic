

# Fix: Remove MONITORING Channels from Interest Communities

## Problem

All interest communities currently have the same 10 channels as geographic communities, including 4 MONITORING/Civic Watch channels (`our-leaders`, `projects-watch`, `promises-watch`, `project-tracker`). These are location-specific tools that have no meaning in a topical interest community like "civic-education" or "governance."

The seed function was already fixed to only seed location communities, but old data was never cleaned up, and there's no separate seed path for interest communities.

## Recommended Channel Set for Interest Communities

Interest communities are topical discussion spaces. Their channels should support knowledge sharing, discussion, and community building — not governance monitoring.

| Channel | Type | Category | Purpose |
|---------|------|----------|---------|
| `community-feed` | feed | FEED | Member posts and updates |
| `announcements` | announcement | INFO | Moderator announcements |
| `resources` | text | INFO | Shared links, guides, reading material |
| `general-chat` | text | ENGAGEMENT | Open discussion |
| `public-forum` | forum | ENGAGEMENT | Threaded topic discussions |

5 channels — lean, purposeful, no civic watch overhead.

## Plan

### 1. DB cleanup: Remove MONITORING channels from interest communities

Delete all channels with `category = 'MONITORING'` from communities where `type != 'location'`. Also remove `intros` and `baraza` (these are tier-specific onboarding/town-hall features).

### 2. Add missing `resources` channel to interest communities

Insert a `resources` channel (category INFO, position 2) for all interest communities that don't already have one.

### 3. Update seed function to handle interest communities

Add an `ELSE` branch to `seed_community_channels()` that seeds the 5-channel interest set when `NEW.type != 'location'`.

### 4. Hide MONITORING category for non-tier communities in ChannelList

Already partially handled by `isTierCommunity` for Interactive section, but the MONITORING group still renders if channels exist. Add a guard: skip rendering MONITORING category when `!isTierCommunity`.

### Files to Change

| File | Change |
|------|--------|
| SQL migration | Delete MONITORING channels from interest communities. Add `resources` channel. Update seed function with interest community branch. |
| `src/components/community/discord/ChannelList.tsx` | Skip MONITORING category when `!isTierCommunity` as safety guard |

