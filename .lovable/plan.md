

# Fix: Community Layout Overflowing Platform Header

## Root Cause

`SidebarInset` (from shadcn/ui sidebar) has a default class of `min-h-svh` (100svh minimum height). This prevents the flex layout from constraining the component's height to the space below the header. Combined with `overflow-auto` on `AppLayout`, the entire community page (channel sidebar, level selector, content) grows to full viewport height and scrolls as one block — overlapping the platform header.

```text
AppLayout root:       min-h-screen flex-col
  Header:             ~56px
  flex-1 overflow-hidden:
    SidebarInset:     min-h-svh ← BUG: forces 100vh minimum
      main h-full:
        Community h-full: resolves to 100vh, not remaining space
```

## Fix

### File: `src/components/layout/AppLayout.tsx`

Two changes to the `SidebarInset`:
1. Add `min-h-0` to override the default `min-h-svh` — allows flex to constrain height to the remaining space after the header
2. Change `overflow-auto` to `overflow-hidden` — prevents the SidebarInset from scrolling as a whole; each page (community, feed, etc.) manages its own scroll internally

```tsx
<SidebarInset className="flex-1 w-full min-h-0 overflow-hidden">
  <main className="h-full">
    {children}
  </main>
</SidebarInset>
```

### File: Other pages that rely on SidebarInset scrolling

Since we're changing `overflow-auto` to `overflow-hidden`, any page that currently relies on the parent scrolling will need its own scroll wrapper. Need to check the main page routes (feed, profile, post detail, etc.) to ensure they have their own scroll containers. If they don't, we wrap their content in a `ScrollArea` or `overflow-auto` div at the page level.

Let me verify — the community page already handles its own scroll (each section has `ScrollArea`). Other pages likely render long content that previously scrolled via `SidebarInset overflow-auto`. For those, we add `overflow-auto` at the `<main>` level only for non-community routes, OR simpler: keep `overflow-auto` on `main` and add `overflow-hidden` on community page's container (which we already have with `h-full overflow-hidden`).

**Revised approach**: Keep `overflow-auto` on SidebarInset but add `min-h-0` to fix the height constraint. The community page already has `overflow-hidden` on its root div, so it won't scroll with the parent. Other pages that need scrolling will continue to work.

### Final changes:

**`src/components/layout/AppLayout.tsx`** (line 19):
```tsx
<SidebarInset className="flex-1 w-full min-h-0 overflow-auto">
```

Adding `min-h-0` overrides the built-in `min-h-svh`, allowing `flex-1` to properly constrain the height. The community page's `h-full overflow-hidden` will then correctly resolve to the remaining viewport space after the header. Other pages keep scrolling normally via `overflow-auto`.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/AppLayout.tsx` | Add `min-h-0` to `SidebarInset` className |

Single-line fix. This resolves the header overlap, the whole-page scrolling, and ensures each community section scrolls independently.

