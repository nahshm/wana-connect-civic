

# Fix: Feed Scrollbar Visible & Right Sidebar Scroll Behavior

## Problems

1. **Feed sections show native scrollbar**: The `overflow-auto` divs wrapping feed, grids, events, and polls in `ChannelContent.tsx` and `Community.tsx` show the browser's native scrollbar. The right sidebar uses `ScrollArea` (Radix) which renders a styled, auto-hiding scrollbar. These should be consistent.

2. **`h-screen` still present on Community.tsx line 264**: The previously approved fix to change `h-screen` to `h-full` was never applied. This causes the entire community layout to be 100vh, overlapping the platform header and contributing to incorrect scroll behavior.

## Solution

### 1. `src/features/community/pages/Community.tsx`
- **Line 264**: Change `h-screen` → `h-full` (the approved-but-unapplied fix)
- **Lines 342, 352**: Replace `<div className="flex-1 overflow-auto h-full">` wrappers for virtual-events and virtual-polls with `<ScrollArea className="flex-1">` for styled scrollbar

### 2. `src/components/community/discord/ChannelContent.tsx`
- Replace all `<div className="flex-1 overflow-auto h-full">` wrappers with `<ScrollArea className="flex-1">` for consistent styled scrollbar behavior across:
  - Leaders grid, Projects grid, Promises grid
  - Feed channel, Legacy fallback feed, Video placeholder
  - Community message (line 154)

### 3. `src/index.css`
- Add a global utility class `.scrollbar-hide` for the few places using it without definition:
```css
@layer utilities {
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
}
```

## Files to Modify

| File | Change |
|------|--------|
| `src/features/community/pages/Community.tsx` | `h-screen` → `h-full`; replace `overflow-auto` divs with `ScrollArea` |
| `src/components/community/discord/ChannelContent.tsx` | Replace all `overflow-auto` divs with `ScrollArea` |
| `src/index.css` | Add `.scrollbar-hide` utility class |

