

# Fix: Tour Spotlight Overflow on Large/Hidden Elements

## Problem
Three issues cause the tour to be unusable on Dashboard, Office Hub, and Institution pages:

1. **Hidden elements**: Targets like `tour-citizen-identity` (`hidden lg:block`) and `tour-quest-widget` (`hidden xl:block`) are invisible on smaller viewports — the tour tries to highlight nothing
2. **Tall sidebars**: Elements like `tour-office-profile` and `tour-institution-profile` span near-full viewport height, making the spotlight cutout cover almost the entire screen with no room for the tooltip
3. **Tooltip inaccessible**: When the highlight is too large, the tooltip gets pushed off-screen or buried behind the overlay

## Solution (single file: `PageTour.tsx`)

### 1. Detect hidden/invisible targets → fall back to centered mode
After querying the target element, check if it's actually visible (`offsetParent !== null`, `offsetWidth > 0`). If not, treat the step as a centered (no-target) step so the tooltip shows in the middle of the screen.

### 2. Cap highlight dimensions
Limit the spotlight cutout to a maximum height of ~400px and max width of ~500px. If the element is larger, center the cutout window on the element's visible center. This prevents the spotlight from consuming the full viewport.

### 3. Smarter tooltip placement fallback
When the chosen placement side doesn't have enough room (e.g., `right` placement but element fills most of the width), automatically fall back to `bottom` or `center`.

## Changes

| File | Change |
|------|--------|
| `src/components/tour/PageTour.tsx` | Add visibility check, cap highlight rect dimensions, add placement fallback logic |

No changes to tour step definitions — they remain as-is. The component becomes resilient to any target size or visibility state.

