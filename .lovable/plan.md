

# Fix: Community Layout Overlapping Platform Header

## Problem
`Community.tsx` uses `h-screen` (100vh) on its outer container. But it renders inside `AppLayout`, which has a `Header` at the top. So the community page is 100vh tall starting below the header, meaning it overflows by exactly the header height. The channel sidebar (with `z-40`) and level selector render on top of the platform header.

## Root Cause

```text
AppLayout (min-h-screen, flex-col)
  ├── Header (~64px)
  └── flex-1 overflow-hidden
       └── SidebarInset (flex-1, overflow-auto)
            └── main (h-full)
                 └── Community (h-screen ← THIS IS THE BUG)
                      └── flex h-full (also 100vh, overflows)
```

`h-screen` = 100vh regardless of parent. It should be `h-full` to fill the remaining space after the header.

## Fix

**File: `src/features/community/pages/Community.tsx`** (line 264)

Change the outer container from `h-screen` to `h-full`:
```
Before: <div className="h-screen bg-background overflow-hidden">
After:  <div className="h-full bg-background overflow-hidden">
```

This single change makes the community page fill only the space available below the header, preventing the channel sidebar and level selector from overlapping the platform header. All internal `h-full` references will then correctly cascade from the parent's constrained height.

