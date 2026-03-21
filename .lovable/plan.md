

# Report an Issue & Report an Incident: UI/UX + End-to-End Fix

## Problems Identified

### 1. Content Cutoff / Fixed Container (UI Bug)
Both pages use `min-h-[calc(100vh-4rem)] flex flex-col justify-center` which tries to vertically center the card within the viewport. But they're rendered inside `AppLayout` which uses `h-screen overflow-hidden` → `SidebarInset overflow-auto`. The `min-h-[calc(100vh-4rem)]` calculation is wrong because it assumes the page owns the full viewport, but the actual scrollable area is smaller (minus header + sidebar). Combined with `justify-center`, when content exceeds the visible area, the top gets pushed above the scroll boundary and becomes unreachable.

**Fix**: Remove `min-h-[calc(100vh-4rem)]`, `flex`, and `justify-center`. Use simple `py-8` padding. Content will flow naturally and scroll within the `SidebarInset`.

### 2. Dead Code
`src/pages/Dashboard/ReportIssue.tsx` (265 lines) is never used — routes point to `src/features/accountability/pages/ReportIssue.tsx`. Delete it.

### 3. ReportIncident uses `supabase as any` unnecessarily
The `incidents` table IS in the generated types. The `as any` cast bypasses type safety for no reason.

### 4. ReportIssue uses `supabase as any` too
Same issue — `civic_actions` is fully typed.

### 5. Storage bucket existence not verified
- ReportIssue uploads to `issue-media`
- ReportIncident uploads to `incident-media`
These buckets may not exist, causing silent upload failures.

### 6. No input validation/sanitization
Neither form validates input length or sanitizes content before DB insertion. Title and description can be empty strings of whitespace (only `.trim()` check in incident, none in issue).

---

## Plan

### A. Fix Layout (Both Pages)
Replace the outer `div` class on both pages:
- **Before**: `container mx-auto p-4 sm:p-8 max-w-3xl min-h-[calc(100vh-4rem)] flex flex-col justify-center`
- **After**: `container mx-auto px-4 sm:px-8 py-6 sm:py-10 max-w-3xl`

This lets content scroll naturally within the sidebar layout.

### B. Remove `as any` Casts
- ReportIncident: remove `const db = supabase as any`, use `supabase` directly (types exist)
- ReportIssue: remove `const db = supabase as any`, use `supabase` directly

### C. Delete Dead Code
Delete `src/pages/Dashboard/ReportIssue.tsx` — completely unused.

### D. Storage Bucket Migration
Create migration to ensure `issue-media` and `incident-media` storage buckets exist with appropriate RLS policies.

### E. Input Validation
Add `maxLength` attributes on text inputs and proper `.trim()` checks before submission on ReportIssue (currently missing).

## Files
| Action | File |
|--------|------|
| EDIT | `src/features/accountability/pages/ReportIssue.tsx` — fix layout, remove `as any`, add validation |
| EDIT | `src/features/accountability/pages/ReportIncident.tsx` — fix layout, remove `as any` |
| DELETE | `src/pages/Dashboard/ReportIssue.tsx` — dead code |
| CREATE | Migration — ensure storage buckets exist |

