

# Fix: Independent Panel Scrolling — Root Cause Found

## The Real Problem

The height chain is broken at the **top level**, not inside the community page. Two ancestors force minimum viewport height, which means `flex-1` children can grow beyond the viewport instead of being constrained:

```text
SidebarProvider div:  min-h-svh  ← forces 100vh MINIMUM, allows growth
  AppLayout div:      min-h-screen  ← also forces 100vh MINIMUM
    Header:           ~56px
    div flex-1:       overflow-hidden  ← WANTS to constrain, but parent grows
      SidebarInset:   min-h-0 (overrides min-h-svh) ✓
        main h-full:  Community page
```

Because the root containers use **minimum** height (not fixed height), `overflow-hidden` on the content wrapper cannot actually clip or constrain. The content just pushes the parent taller, causing the whole page to scroll as one block.

## Fix

### 1. `src/App.tsx` — Kill SidebarProvider's min-h-svh
Add className to override the built-in `min-h-svh` on the SidebarProvider wrapper:
```tsx
<SidebarProvider defaultOpen={...} className="!min-h-0">
```

### 2. `src/components/layout/AppLayout.tsx` — Lock root to viewport height
Change from `min-h-screen` (growable) to `h-screen` (fixed) and add `overflow-hidden`:
```tsx
<div className="h-screen flex flex-col w-full bg-background overflow-hidden">
```
Also remove the nested `<main className="h-full">` wrapper since `SidebarInset` already renders as `<main>` — the duplicate nesting can confuse height resolution:
```tsx
<SidebarInset className={cn(
  "flex-1 w-full min-h-0",
  isCommunityPage ? "overflow-hidden" : "overflow-auto"
)}>
  {children}
</SidebarInset>
```

### Result
With a fixed viewport-height root, every `flex-1` and `h-full` downstream resolves to actual pixel values. Each `ScrollArea` in the community page (level selector, channel list, channel content, right sidebar) will independently scroll within its constrained panel.

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `className="!min-h-0"` to `SidebarProvider` |
| `src/components/layout/AppLayout.tsx` | `min-h-screen` → `h-screen overflow-hidden`; remove nested `<main>` |

