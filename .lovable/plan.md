

# Fix: Chat Input Below Fold, Slow Images, Whole-Page Scroll

## Problem Analysis

### 1. Message box requires scrolling to access (chat + forum channels)
**Root cause**: In `Community.tsx` line 302, the main content area is wrapped in a `<ScrollArea>`. Chat and forum channels use `flex flex-col h-full` internally with their own `ScrollArea` for messages. But the parent `ScrollArea` creates a viewport that expands to fit content rather than constraining it. So `h-full` on child components resolves to content height, not viewport height, pushing the input bar below the fold.

### 2. Entire community page scrolls
**Same root cause**: The parent `<ScrollArea>` on the main content area lets everything scroll as one unit. Chat channels, forums, and feeds should each be independent scrolling sections. The parent should be `overflow-hidden`, not scrollable.

### 3. Chat images load slowly
**Root cause**: `MessageMedia.tsx` calls `getPublicUrl()` for every image on every render (no memoization). Additionally, images are rendered at full resolution with no `width`/`height` hints, causing layout shifts and slow progressive loading. Adding explicit dimensions and using `decoding="async"` will help.

## Solution

### File: `src/features/community/pages/Community.tsx`
Replace the `<ScrollArea>` wrapper (line 302) for the main content area with a plain `div` that uses `flex-1 overflow-hidden`. This lets child components (chat, forum) fill the available height with their own internal scroll. For non-chat content that needs scrolling (feed, grids), each component already handles its own scroll or can use `overflow-auto`.

```
Before: <ScrollArea className="flex-1 bg-background">
After:  <div className="flex-1 flex flex-col overflow-hidden bg-background">
```

Close tag changes from `</ScrollArea>` to `</div>`.

For content types that DO need scrolling (feed, events, polls, leaders grids), wrap them in their own `ScrollArea` or `overflow-auto` container inside `ChannelContent`.

### File: `src/components/community/discord/ChannelContent.tsx`
Wrap non-chat channel content (feed, grids, legacy posts) in a `ScrollArea` or `overflow-auto div` so they scroll independently. Chat and forum channels already have their own scroll internally.

Specifically:
- The `CommunityUnifiedFeed` section, `LeadersGrid`, `ProjectsGrid`, `PromisesGrid`, legacy feed, and video placeholder all need their own scroll wrapper since they lost the parent `ScrollArea`.
- Wrap the return of each in `<div className="flex-1 overflow-auto h-full">...</div>`

### File: `src/components/chat/MessageMedia.tsx`
- Memoize `getPublicUrl` results using `useMemo`
- Add `width` and `height` attributes to `<img>` tags for faster layout
- Add `decoding="async"` to images
- Add a loading placeholder/skeleton while image loads

## Files to Modify

| File | Change |
|------|--------|
| `src/features/community/pages/Community.tsx` | Replace `ScrollArea` with `div overflow-hidden` for main content |
| `src/components/community/discord/ChannelContent.tsx` | Add scroll wrappers to non-chat channel content |
| `src/components/chat/MessageMedia.tsx` | Memoize URLs, add image dimensions + async decoding + loading state |

