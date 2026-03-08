

# Fix: Gate Tour Behind Auth + Keep AuthModal Working for Guests

## Two Changes

### 1. Gate Platform Tour behind authentication
The `PlatformTour` component currently triggers based only on `localStorage`. Guests (no `user`) should never see the tour since they can't interact with most features.

**File: `src/components/community/PlatformTour.tsx`**
- Add a `userId` prop (optional string)
- In the `useEffect` that decides whether to open, add an early return if `!userId`
- This ensures only logged-in users see the tour

**File: `src/features/community/pages/Community.tsx`**
- Pass `userId={user?.id}` to `<PlatformTour>`

### 2. AuthModal is already correct — no changes needed
The existing `AuthModal` component already:
- Supports login and signup modes
- Includes OAuth (Google, Apple, GitHub), magic link, and email/password
- Is triggered via `useAuthModal().open('login')` throughout the codebase (PostCard votes, saves, community joins, post creation, etc.)
- Is rendered globally in `App.tsx`

The current auth flow for guests is already working correctly — when unauthenticated users try to vote, save, join, or create content, the auth modal opens. No replacement is needed; the AuthModal IS the correct/original auth component.

### Summary of code changes
| File | Change |
|------|--------|
| `src/components/community/PlatformTour.tsx` | Add `userId` prop, skip tour if falsy |
| `src/features/community/pages/Community.tsx` | Pass `userId={user?.id}` to PlatformTour |

