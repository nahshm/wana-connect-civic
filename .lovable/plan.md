

# Fresh Redesign: CivicChat Layout

## Root Cause (Why Previous Fixes Failed)

`SidebarInset` renders a `<main>` with base class `min-h-svh`. Even though we add `min-h-0` and `overflow-hidden`, the flex height chain from `AppLayout` down to CivicChat is fragile. `h-full` on CivicChat resolves to nothing useful because the actual computed height of SidebarInset doesn't constrain properly across all sidebar states (expanded/collapsed/mobile).

The Back and New buttons render at the top of the chat div, but the container doesn't enforce a viewport-height boundary, so the content pushes them off-screen with no way to scroll back.

## Solution: Absolute Positioning

`SidebarInset` already has `relative` in its base class. Instead of relying on `h-full` height chain, the chat view will use `absolute inset-0` to fill the exact bounds of SidebarInset. This is bulletproof regardless of parent height computation.

## Implementation

### CivicChat.tsx - Full Rewrite

**Welcome view**: `absolute inset-0 overflow-auto` -- scrollable content anchored to SidebarInset bounds. Contains hero, search input, recent sessions, trending questions.

**Chat view**: `absolute inset-0 flex flex-col overflow-hidden` -- fixed three-section layout:
- **Top bar** (`flex-shrink-0`): ← Back button (left), Language toggle + New button (right). Always visible.
- **Messages area** (`flex-1 overflow-y-auto`): Scrollable message list with user/assistant bubbles.
- **Input bar** (`flex-shrink-0`): Follow-up input pinned to bottom.

**Other changes**:
- Move `LanguageToggle` outside the component function to prevent unmount/remount on every render.
- Remove the `isCivicAssistant` special-case from `AppLayout.tsx` since absolute positioning makes it unnecessary (though keeping it is harmless).

### AppLayout.tsx - No Changes Needed

The `overflow-hidden` + `isCivicAssistant` check can stay or be removed -- absolute positioning inside the `relative` SidebarInset works either way.

### Files Changed
- `src/components/civic-assistant/CivicChat.tsx` -- full rewrite with absolute positioning

