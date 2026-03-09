

# Fix: CivicChat Top Bar Hidden Behind Scroll

## Root Cause

The chat view's top bar (Back + New buttons) is **scrolled out of view**. Here's why:

1. `AppLayout` wraps CivicChat in `SidebarInset` with `overflow-auto`
2. CivicChat's welcome view is tall and scrollable -- user scrolls down, sends a question
3. View switches to `'chat'`, but `SidebarInset` **keeps its scroll position**
4. The top bar with Back/New renders at the top of the content, but the scroll is still partway down -- so the bar is hidden above the viewport
5. `flex-1` on the chat view does nothing because `SidebarInset` isn't a height-constrained flex column -- it's just `overflow-auto`

## Fix (2 changes)

### 1. AppLayout: Add civic-assistant to overflow-hidden routes
Just like `/c/` community pages get `overflow-hidden` (to contain their own scroll), add `/civic-assistant`:

```typescript
const isCommunityPage = location.pathname.startsWith('/c/');
const isCivicAssistant = location.pathname === '/civic-assistant';
// ...
className={cn(
  "flex-1 w-full min-h-0",
  (isCommunityPage || isCivicAssistant) ? "overflow-hidden" : "overflow-auto"
)}
```

This makes `SidebarInset` a height-constrained container, so CivicChat's `flex-1` actually works and the component manages its own internal scrolling.

### 2. CivicChat: Use `h-full` instead of `flex-1` for both views
Both the welcome and chat views need `h-full` to fill the constrained parent:

- Welcome view: `h-full overflow-auto` (scrolls internally)
- Chat view: `h-full flex flex-col` (already has internal scroll on `<main>`)

This ensures the top bar stays pinned at the top of the chat view and never scrolls away.

### Files Changed
- `src/components/layout/AppLayout.tsx` -- add civic-assistant to overflow-hidden routes
- `src/components/civic-assistant/CivicChat.tsx` -- switch `flex-1` to `h-full` on both views

