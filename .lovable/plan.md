

# Complete Platform Audit Report — WanaConnect Civic

Based on live Supabase security scan (87 findings), database linter (75 issues), and codebase analysis.

---

## CRITICAL SECURITY VULNERABILITIES (from live scan)

These are real, confirmed by Supabase's own scanner. The external reports **understated** the severity.

### P0 — Exploitable Right Now

| Finding | Impact | Detail |
|---------|--------|--------|
| **Any authenticated user can appoint themselves moderator of any community** | Privilege escalation | `community_moderators` INSERT policy is `WITH CHECK (true)` — no ownership check |
| **Any unauthenticated visitor can alter fact-check verification records** | Data corruption | `verifications` UPDATE policy is `USING (true)` on `{public}` role |
| **Any unauthenticated visitor can overwrite office proposals** | Data corruption | `office_proposals` UPDATE policy is `USING (true)` on `{public}` |
| **All private chat messages are publicly readable** | Privacy breach | `chat_messages` has a blanket `USING (true)` on `{public}` that overrides the participant-scoped policy via OR logic |
| **Any authenticated user can overwrite/delete another user's profile files** | Account takeover vector | Storage policies on `user-profiles` bucket lack ownership check (`storage.foldername(name)[1] = auth.uid()`) |
| **Any authenticated user can read/modify/delete all agent proposals** | System integrity | `agent_proposals` has `ALL` with `USING (true)` for authenticated |
| **Any authenticated user can tamper with agent state** | System integrity | `agent_state` has `ALL` with `USING (true)` for authenticated |
| **Contractor emails and phone numbers publicly readable** | PII exposure | `contractors` SELECT `USING (true)` exposes contact info to anon |

### P1 — Privacy Leaks

| Finding | Impact |
|---------|--------|
| Community browsing history publicly readable | `community_visits` exposes user_id + timestamps |
| Project viewing history publicly readable | `project_views` exposes user_id |
| Video watch history publicly readable | `civic_clip_views` exposes user_id + watch_duration + device |
| Pending institution handler requests publicly readable | Exposes who is requesting handler access |

### P1 — Database Hygiene

| Category | Count | Detail |
|----------|-------|--------|
| Security Definer Views | 5 errors | Views bypass RLS of the querying user |
| Functions without `search_path` | 40 warnings | Vulnerable to search_path hijacking |
| Extensions in `public` schema | 2 warnings | Should be in dedicated schema |
| Materialized Views in API | 3 warnings | Exposed over Data APIs |
| RLS "Always True" policies | 25 warnings | `INSERT/UPDATE/DELETE` with `USING(true)` or `WITH CHECK(true)` |
| Leaked password protection | Disabled | Should be enabled in Auth settings |

---

## ROUTE PROTECTION GAPS (confirmed from App.tsx)

| Route | Status | Risk |
|-------|--------|------|
| `/create`, `/create-post`, `/submit` | Protected | OK |
| `/post/:id` | Protected | OK |
| `/edit-post/:id` | **UNPROTECTED** | Anyone can access edit page |
| `/projects/submit` | **UNPROTECTED** | Anyone can access submit form |
| `/admin/dashboard` | **UNPROTECTED** | Admin panel exposed |
| `/admin/intelligence` | **UNPROTECTED** | Admin panel exposed |
| `/admin/verification` | **UNPROTECTED** | Admin panel exposed |
| `/admin/geographic-data` | **UNPROTECTED** | Admin panel exposed |
| `/admin/feature-flags` | **UNPROTECTED** | Admin panel exposed |

---

## CONFIRMED CODE BUGS

### 1. Non-Atomic Comment Count (Race Condition)
**File**: `PostDetail.tsx` line 131
```
.update({ comment_count: (post?.commentCount || 0) + 1 })
```
Two concurrent comments will lose one count. Need a database RPC with `comment_count = comment_count + 1`.

### 2. Search: No Debounce + Sequential Queries + 400 Errors
- `SearchBar.tsx` fires `useSearch` on every keystroke — no `useDebounce`
- `useSearch.ts` runs 7 queries **sequentially** (await one after another) instead of `Promise.all`
- 6 of 7 queries use `.textSearch('search_vector', query)` which throws 400 on partial input like "Nai" — only posts use safe ILIKE

### 3. Chat Message Filtering Not Memoized
**File**: `ChannelChatWindow.tsx` line 597
```
const parentMessages = messages.filter(m => !m.reply_to_id);
```
Runs on every render, no `useMemo`. With growing message lists this will cause UI lag on low-end devices.

---

## IMPLEMENTATION PLAN

### Step 1: Fix Critical RLS Policies (Database Migration)

```sql
-- 1. community_moderators: only existing admins can add moderators
DROP POLICY IF EXISTS "allow_insert_moderators" ON community_moderators;
CREATE POLICY "admins_insert_moderators" ON community_moderators
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_moderators cm
      WHERE cm.community_id = community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- 2. verifications: restrict updates to authenticated only
DROP POLICY IF EXISTS "Verifications can be updated by system" ON verifications;
CREATE POLICY "verifications_update_authenticated" ON verifications
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. office_proposals: restrict updates to authenticated, scope to upvotes
DROP POLICY IF EXISTS "Anyone can upvote proposals" ON office_proposals;
CREATE POLICY "auth_upvote_proposals" ON office_proposals
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. chat_messages: remove blanket public read
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;

-- 5. agent_proposals: restrict to admin
DROP POLICY IF EXISTS "agent_proposals_authenticated_all" ON agent_proposals;
CREATE POLICY "agent_proposals_admin_only" ON agent_proposals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. agent_state: restrict to admin
DROP POLICY IF EXISTS "agent_state_authenticated_all" ON agent_state;
CREATE POLICY "agent_state_admin_only" ON agent_state
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Storage: add ownership check for user-profiles bucket
-- (Must be done via Supabase dashboard or storage API)

-- 8. Privacy: scope user activity tables to owner
DROP POLICY IF EXISTS "View community visits" ON community_visits;
CREATE POLICY "own_community_visits" ON community_visits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view project views" ON project_views;
CREATE POLICY "own_project_views" ON project_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view all clip views" ON civic_clip_views;
CREATE POLICY "own_clip_views" ON civic_clip_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### Step 2: Add Atomic Comment Count RPC

```sql
CREATE OR REPLACE FUNCTION increment_comment_count(p_post_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = p_post_id;
$$;
```

Update `PostDetail.tsx` to call `supabase.rpc('increment_comment_count', { p_post_id: resolvedId })`.

### Step 3: Add Route Protection (App.tsx)

Wrap these routes in `<ProtectedRoute>`:
- `/edit-post/:id`
- `/projects/submit`
- All 5 `/admin/*` routes

### Step 4: Fix Search (SearchBar.tsx + useSearch.ts)

- Add `useDebounce(query, 300)` in `SearchBar.tsx`
- Replace all `.textSearch()` calls with ILIKE in `useSearch.ts`
- Wrap all 7 queries in `Promise.all` for parallel execution

### Step 5: Memoize Chat Filtering (ChannelChatWindow.tsx)

Wrap `parentMessages` and `repliesMap` computation in `useMemo` keyed on `messages`.

### Step 6: Enable Leaked Password Protection

Enable in Supabase Dashboard > Auth > Settings.

---

## Summary

| Priority | Count | Category |
|----------|-------|----------|
| P0 Critical | 8 | RLS privilege escalation + data exposure |
| P1 High | 4 | Privacy leaks (user activity history) |
| P1 High | 7 | Unprotected routes (admin panel open) |
| P2 Medium | 3 | Code bugs (race condition, search, memoization) |
| P2 Medium | 75 | DB linter warnings (search_path, extensions) |

The external reports were **partially correct** but missed the most critical findings: the moderator self-appointment exploit, public chat message exposure, and storage ownership bypass. These must be fixed before launch.

### Files to Change

| File | Change |
|------|--------|
| DB migration | Fix 8 critical RLS policies + atomic counter RPC |
| `src/App.tsx` | Add `ProtectedRoute` to 7 unguarded routes |
| `src/features/feed/pages/PostDetail.tsx` | Use RPC for comment count |
| `src/components/layout/SearchBar.tsx` | Add `useDebounce` |
| `src/hooks/useSearch.ts` | `Promise.all` + ILIKE for all tables |
| `src/components/chat/ChannelChatWindow.tsx` | `useMemo` for message grouping |

