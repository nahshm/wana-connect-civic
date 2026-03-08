

# Community System Deep Dive: Issues Found & Improvement Plan

## Issues Discovered

### Critical Bugs

1. **PromisesGrid: Hook called inside loop (Rules of Hooks violation)**
   `src/components/community/discord/PromisesGrid.tsx` line 159 calls `useVerification()` inside a `.map()` callback. This violates React's Rules of Hooks and will cause unpredictable crashes. Must extract to a separate component.

2. **CommunitySidebar: useState inside IIFE (Rules of Hooks violation)**
   `src/components/community/CommunitySidebar.tsx` lines 116-140 use `React.useState()` inside an immediately-invoked function expression inside JSX render. This is technically a hook violation and can cause issues with React's reconciler.

3. **ProjectsGrid/PromisesGrid: Hardcoded light-mode colors**
   Both files use `text-slate-800`, `text-slate-500`, `bg-white`, `bg-slate-200` etc. These break dark mode. Should use semantic tokens like `text-foreground`, `text-muted-foreground`, `bg-card`.

### Functional Disconnects

4. **CommunityHeader component is orphaned**
   `CommunityHeader.tsx` with its tab-based navigation (Posts/About/Projects/Members/Moderation) is never used. The Community page uses the Discord-style channel layout exclusively. This is dead code.

5. **Communities page uses outdated `useCommunityData` hook**
   The Explore/Manage tabs use a different data-fetching pattern (`useCommunityData`) than the rest of the app. Favorites are mock-only (in-memory `Set`), not persisted.

6. **Channel content routing: `project-tracker` channel renders ForumChannel instead of ProjectsGrid**
   The `project-tracker` channel has `type: 'forum'` and `category: 'MONITORING'`. The routing logic in `ChannelContent.tsx` checks `channel.category === 'MONITORING'` first but only matches by `channel.name` for specific names like `projects-watch`. The `project-tracker` channel (with type `forum`) falls through to the forum handler, which is correct behavior but the naming is confusing.

### UX/UI Issues

7. **ForumChannel thread view has no scroll-to-bottom on new reply**
   After posting a reply, users must manually scroll down to see it.

8. **ForumChannel: Plus button in reply input does nothing**
   Line 681-683: A `Plus` button is rendered but has no `onClick` handler — it's decorative/dead.

9. **ForumChannel: Emoji button in reply input does nothing**
   Line 692-694: The smile button in the reply composer has no handler.

10. **Reactions are "local only" in ForumChannel**
    Lines 131-135 and 154-158 explicitly disable reactions with a comment "Note: Reactions disabled until types are regenerated". The UI shows reaction buttons but they only work in-memory and reset on refresh.

11. **Right sidebar overlaps content on medium screens**
    The right sidebar uses `fixed` positioning (`fixed top-16 right-0`) which can overlap content when the viewport is between `xl` and wider sizes, or cause content to disappear behind it.

12. **CreatePostInput navigates away from community**
    Clicking "Create Post" in the feed navigates to `/create` without preserving community context. The post won't be auto-linked to the current community.

## Plan

### Phase 1: Fix Critical Bugs

**File: `src/components/community/discord/PromisesGrid.tsx`**
- Extract the promise card + verification into a standalone `PromiseCard` component that calls `useVerification` at the component level
- Fix all hardcoded `text-slate-*` / `bg-white` colors to semantic tokens

**File: `src/components/community/CommunitySidebar.tsx`**
- Extract the collapsible description logic into a proper `CollapsibleDescription` sub-component with its own `useState`

**File: `src/components/community/discord/ProjectsGrid.tsx`**
- Fix hardcoded colors to semantic tokens (`text-foreground`, `bg-card`, etc.)

### Phase 2: Fix ForumChannel (Threads) UX

**File: `src/components/community/discord/ForumChannel.tsx`**
- Add `scrollToBottom` after successful reply post (using a ref on the ScrollArea)
- Remove the non-functional Plus button from the reply input
- Connect the emoji button to the existing `QUICK_REACTIONS` picker (reuse the same Popover pattern from hover toolbar)
- Add a "reply count" badge update after posting (optimistic update on `selectedThread.reply_count`)

### Phase 3: Clean Up Disconnects

**File: `src/components/community/CreatePostInput.tsx`**
- Accept an optional `communityId` and `communityName` prop
- Navigate to `/create?community=${communityName}` to preserve context

**File: `src/components/community/discord/ChannelContent.tsx`**
- Pass `communityId` and `communityName` to `CreatePostInput` in both the CommunityUnifiedFeed and fallback feed sections

### Phase 4: Delete Dead Code

- Remove `src/components/community/CommunityHeader.tsx` (orphaned, never imported by Community.tsx)

## Files to Modify

| File | Change |
|------|--------|
| `src/components/community/discord/PromisesGrid.tsx` | Extract PromiseCard component, fix colors |
| `src/components/community/discord/ProjectsGrid.tsx` | Fix hardcoded colors |
| `src/components/community/CommunitySidebar.tsx` | Extract CollapsibleDescription |
| `src/components/community/discord/ForumChannel.tsx` | Fix reply UX, remove dead buttons, connect emoji |
| `src/components/community/CreatePostInput.tsx` | Add community context prop |
| `src/components/community/discord/ChannelContent.tsx` | Pass community context to CreatePostInput |
| `src/components/community/CommunityHeader.tsx` | Delete (dead code) |

