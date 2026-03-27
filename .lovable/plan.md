

## Fix: Dark Mode Styling for Post Action Bar

### Problem
The `bg-gray-100` class applied to all action bar elements is a fixed light gray that doesn't adapt to dark mode, making buttons appear as bright white rectangles on a dark background.

### Solution
Replace `bg-gray-100` with `bg-muted/30 dark:bg-muted/40` (or similar theme-aware classes) that respect both light and dark modes. This restores the original muted background behavior while keeping the simplified transition styles.

### Changes

**File: `src/components/posts/PostCard.tsx`** — 5 edits:

| Line | Element | Current | New |
|------|---------|---------|-----|
| 893 | Vote pill | `bg-gray-100` | `bg-gray-100 dark:bg-white/10` |
| 925 | Comments pill | `bg-gray-100` | `bg-gray-100 dark:bg-white/10` |
| 931 | Share pill | `bg-gray-100` | `bg-gray-100 dark:bg-white/10` |
| 938 | Save pill | `bg-gray-100` | `bg-gray-100 dark:bg-white/10` |
| 950 | More options | `bg-gray-100` | `bg-gray-100 dark:bg-white/10` |

This keeps the light gray in light mode and uses a subtle white transparency in dark mode that blends naturally with the dark theme.

