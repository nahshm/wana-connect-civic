

# Fix: Avatar & Username/Display Name in Channel Chat

## Root Cause

Two related issues found:

### 1. Duplicate `useAuth` hook — dead code risk
There are **two files** at `src/hooks/useAuth`:
- `useAuth.ts` — re-exports from `@/contexts/AuthContext` (correct, has `profile`)
- `useAuth.tsx` — a **completely separate, duplicate AuthProvider** with no `profile` field (dead code)

Vite resolves `@/hooks/useAuth` to `.ts` first, so the import currently works. But `useAuth.tsx` is dead code that should be deleted per the clean-code mandate.

### 2. Optimistic message uses wrong data source for username/avatar
In `ChannelChatWindow.tsx` line 355-360, the optimistic message sender info is built from:
```ts
username: user.email?.split('@')[0] || 'You',
display_name: user.user_metadata?.display_name,
avatar_url: user.user_metadata?.avatar_url,
```
This pulls from **Supabase auth metadata** (which is often stale or empty) instead of the **`profile` object** from AuthContext, which has the actual DB values (`profile.username`, `profile.display_name`, `profile.avatar_url`).

Result: optimistic messages show wrong username (email prefix) and missing avatar until the realtime event replaces them with DB data.

## Plan

### 1. Delete `src/hooks/useAuth.tsx` (dead duplicate)
Remove the duplicate AuthProvider. The `.ts` re-export stays and all 11 files importing from `@/hooks/useAuth` continue working via the re-export to `@/contexts/AuthContext`.

### 2. Fix optimistic message sender in `ChannelChatWindow.tsx`
- Destructure `profile` from `useAuth()` alongside `user`
- Use `profile.username`, `profile.display_name`, `profile.avatar_url` for the optimistic message sender object (lines 355-360)

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | **Delete** — dead duplicate code |
| `src/components/chat/ChannelChatWindow.tsx` | Destructure `profile`, use it for optimistic sender data |

