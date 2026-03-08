

# Fix: Tooltip Placement Fallback When No Room

## Problem
The tooltip goes out of bounds when the target element is large and there isn't enough space on the specified placement side. The highlight/spotlight is fine — only the tooltip positioning needs a fallback.

## Solution (single file: `PageTour.tsx`)

Replace the static `placement` switch with smart fallback logic:

1. **Check available space** on the preferred side before committing to it
2. **Fall back** through a priority chain: preferred → `bottom` → `center`
3. **Visibility check**: if target element is hidden (`offsetWidth === 0`), treat as centered step

### Logic

```text
For a given placement (e.g. 'right'):
  spaceRight = viewport.width - (target.left + target.width)
  if spaceRight < tooltipWidth + 32 → try 'bottom'
  
  spaceBelow = viewport.height - (target.top + target.height)  
  if spaceBelow < tooltipHeight + 32 → fall back to 'center'
  
  'center' = fixed centered overlay (always fits)
```

Same logic applies for `left` (check space to the left) and `bottom` (check space below).

### Changes in `getTooltipStyle()`

- Compute `resolvedPlacement` by checking if preferred side has room (≥ `tooltipWidth + 32` for horizontal, ≥ `tooltipHeight + 32` for vertical)
- If not enough room, try `bottom`; if still not enough, use `center` (translate -50%/-50%)
- The highlight cutout remains unchanged — it correctly clamps to viewport already

### Hidden element detection in `measureTarget()`

- After querying the element, check `(el as HTMLElement).offsetParent === null` or `el.getBoundingClientRect().width === 0`
- If hidden, set `targetRect(null)` so the step renders as centered

## File
| File | Change |
|------|--------|
| `src/components/tour/PageTour.tsx` | Add placement fallback logic in `getTooltipStyle()`, add hidden element check in `measureTarget()` |

