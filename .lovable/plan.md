

# Fix: Build Error + Dashboard Responsive Layout

## 1. Fix Build Error (OfficialScorecard.tsx)

The file has imports at lines 1-12, then a block comment from line 16 to line 234 wrapping the entire component body. The `*/` on line 234 causes a TS parse error.

**Fix**: Remove the barrel export instead of uncommenting broken code. Delete the `OfficialScorecard` export from `src/features/profile/components/scorecard/index.ts` since nothing consumes it. This is the safest fix — no dead export, no build error, code preserved for future use.

## 2. Dashboard Responsive Improvements

The current `CivicDashboard` uses `grid-cols-1 lg:grid-cols-[260px_1fr_280px]`. This means:
- Below `lg` (1024px): all 3 columns stack vertically in a single column
- There's no intermediate breakpoint — it jumps from 3-col to 1-col with no 2-col stage
- The sidebar (AppSidebar) stays visible at `md` while the dashboard tries to fit 3 columns, causing compression

**Changes to `CivicDashboard.tsx`**:
- Add `xl` breakpoint for the full 3-column layout (sidebar + center + right)
- At `lg`, use 2-column layout (center + right), hide left CitizenIdentity panel (it duplicates sidebar info)
- At `md` and below, single column with reordered sections
- Make the 7-tab grid responsive: use horizontal scroll on small screens instead of cramming 7 tabs

## 3. Sidebar Collapses First

The AppSidebar uses `collapsible="icon"` — on desktop it shrinks to icons. On mobile (`<768px`) it becomes a sheet. The gap is **768px–1024px** where the sidebar is fully expanded AND the dashboard is single-column.

**Changes to `AppSidebar.tsx`**:
- Set default sidebar state to collapsed at `md` breakpoint so the sidebar auto-collapses to icon-only mode when viewport is between 768–1280px, giving the dashboard more room

**Changes to `AppLayout.tsx`**:
- No structural changes needed — the sidebar collapse handles the space issue

## Summary of file changes

| File | Change |
|------|--------|
| `scorecard/index.ts` | Remove `OfficialScorecard` export |
| `CivicDashboard.tsx` | Responsive grid: `xl:3-col`, `lg:2-col`, `<lg:1-col`; scrollable tabs on mobile |
| `AppSidebar.tsx` | Default to collapsed state at medium viewports |

