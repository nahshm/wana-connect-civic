

# Audit Verification: 14 Bug Fixes

## Verification Results

### ✅ CONFIRMED FIXED (10 of 14)

| # | Bug | Evidence |
|---|-----|----------|
| 1 | **AppSidebar "My Profile"** linked to dead `/profile` route | Line 154: `to={profile?.username ? '/resume/${profile.username}' : '/dashboard'}` — correctly uses `/resume/` with fallback |
| 2 | **DashboardOverview community coverage** counted all civic_actions globally | Lines 87-91: `.ilike('location_text', '%${profile.county}%')` filter applied — scoped to user's county |
| 3 | **Header Bell** was dead button | Lines 102-106: Now `<Link to="/dashboard">` — wired correctly |
| 4 | **Header console.log** in search handlers | Lines 76-78, 163-165: Both search handlers navigate via `navigate('/search?q=...')` — no console.log present |
| 5 | **QuickActionBar "Alerts"** self-linked to `/dashboard` | Line 19: Now `{ label: 'Incident', icon: Bell, to: '/report-incident' }` — fixed |
| 7 | **DashboardOverview useEffect** had no cleanup | Lines 130-171: `let ignore = false` pattern with `return () => { ignore = true }` — properly implemented |
| 8 | **Header getProfilePrefix** used `any` | Lines 20-30: `ProfileData` interface defined and used — typed correctly |
| 9 | **DashboardOverview** `filter((a: any) => ...)` | Lines 149-153: `ActionRow` type + `OPEN_STATUSES` constant — typed |
| 13 | **PostDetail** join mapper types | Lines 24-26: `PostMediaRow`, `AwardAssignment`, `CommentMediaRow` interfaces defined — no `as any` on initial transform |
| 15 | **Home.tsx** `catch(err: any)` | Lines 106-113: `catch (err: unknown)` with `const pgError = err as { code?: string }` — typed |

### ⚠️ PARTIALLY FIXED (3 of 14)

| # | Bug | Issue |
|---|-----|-------|
| 6 | **PostDetail document.title** not restored on unmount | Lines 150-158: ✅ Fixed — saves `previousTitle` and restores in cleanup. **However**, `previousTitle` captures the title at mount time, which could be stale if another effect changes it. This is a minor edge case, not a real bug. |
| 10-12 | **MyContentTab** `as any` removals | Lines 112-113 still use `(post as { communities?: ... })` casts — these are *type narrowing* casts, not blind `any`. The Supabase `.select()` return type doesn't strongly type join results, so these casts are the correct pattern. **Not bugs.** |
| 14 | **PostDetail handleEditComment** spread `as any` | Lines 580-603: No `as any` present — the spread `{ ...c, content: newContent, updatedAt: new Date() }` satisfies `Comment` type. ✅ Fixed. |

### ❌ NOT FIXED / NEW ISSUES FOUND (1 remaining + 2 new)

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| NEW-1 | **CommentSection line 204** uses `(comment as any).updatedAt` | 🟠 Low | The `Comment` type already has `updatedAt?: Date` — this `as any` cast is unnecessary and was supposed to be removed per the audit. Should be `comment.updatedAt && ...` |
| NEW-2 | **CommentSection line 142** `isEdited` is broken | 🟡 Medium | `const isEdited = comment.createdAt && (new Date(comment.createdAt).getTime() + 1000) < Date.now()` — this is a placeholder that marks ALL comments older than 1 second as "edited". It's never actually used (line 204 handles the real check), but it's confusing dead code. |
| NEW-3 | **PostDetail second transform (line 405, 427)** still uses `as any` | 🟠 Low | After adding a comment, the re-fetch transform uses `(assignment: any)` and `(m: any)` — the first transform was fixed but the duplicate wasn't |

## Summary

The audit report is **mostly accurate**. 10 of 14 bugs are confirmed fixed correctly. The 4 remaining items are low-severity type-safety cleanup issues that don't affect runtime behavior.

### Implementation Plan (3 small fixes)

| File | Fix |
|------|-----|
| `src/components/posts/CommentSection.tsx` line 142 | Remove unused `isEdited` const (dead code) |
| `src/components/posts/CommentSection.tsx` line 204 | Change `(comment as any).updatedAt` → `comment.updatedAt` |
| `src/features/feed/pages/PostDetail.tsx` lines 405, 427 | Replace `(assignment: any)` → `(assignment: AwardAssignment)` and `(m: any)` → `(m: CommentMediaRow)` |

3 lines changed across 2 files. No functional impact — purely type safety cleanup.

