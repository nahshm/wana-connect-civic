

# Fix: Clamp Tour Spotlight & Tooltip to Viewport

## Problem
When a tour step targets a large component (e.g., full-height sidebar, main content area), the highlight cutout and tooltip extend beyond the visible viewport. Users can't reach the Next/Skip buttons without resizing their browser.

## Root Cause
- `getBoundingClientRect()` returns the element's full dimensions, which can be taller/wider than the viewport
- The tooltip position is calculated from the raw rect, so it can land off-screen
- No clamping to viewport bounds exists

## Fix (single file: `PageTour.tsx`)

### 1. Clamp the highlight rect to the visible viewport
After measuring with `getBoundingClientRect()`, intersect the rect with the viewport so the cutout never exceeds visible bounds:

```typescript
// Clamp rect to viewport
const clampedRect = {
  top: Math.max(0, rect.top),
  left: Math.max(0, rect.left),
  width: Math.min(rect.right, window.innerWidth) - Math.max(0, rect.left),
  height: Math.min(rect.bottom, window.innerHeight) - Math.max(0, rect.top),
};
```

### 2. Clamp tooltip vertical position to viewport
After calculating tooltip style, ensure `top` stays within `[16px, viewportHeight - tooltipHeight - 16px]`. Use a post-render measurement of the tooltip via `tooltipRef` to get its actual height, then adjust.

### 3. Add max-height to highlight
Cap highlight height at `window.innerHeight - 32px` as a safety net.

## Files
| File | Change |
|------|--------|
| `src/components/tour/PageTour.tsx` | Clamp target rect to viewport, clamp tooltip position |

