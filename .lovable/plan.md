

# User Content Ownership & Dashboard Deduplication

## Problems Found

### A. Dashboard Tab Duplication

Three tabs show nearly identical data from `civic_actions`:

| Tab | What it shows | Source |
|-----|---------------|--------|
| **Overview** | Stats (total/open/resolved issues) + "Recent Activity" list of last 5 civic_actions | `civic_actions` where `user_id = me` |
| **Actions** | Full filterable list of civic_actions with status, progress, filters | `civic_actions` where `user_id = me` |
| **Issues** | Same civic_actions list, simpler card style, no filters | `civic_actions` where `user_id = me` |

**Result**: "Actions" and "Issues" are the same thing displayed twice. "Overview" also duplicates the recent actions list.

### B. Missing User Content Control

| Content Type | View Own | Edit | Delete | Pin/Feature |
|-------------|----------|------|--------|-------------|
| **Posts** | In feed only (no dashboard tab) | ✅ via dropdown | ✅ via dropdown | No |
| **Comments** | No dashboard view | No edit | ✅ delete only | No |
| **Issues (civic_actions)** | ✅ Actions tab | No edit | No delete | No |
| **Incidents** | No view at all | No edit | No delete | No |
| **Projects** | ✅ Projects tab | No edit | No delete | No |

Users cannot:
- See all their posts in one place in the dashboard
- Edit their own comments
- Edit or delete their own reported issues
- View, edit, or delete their own reported incidents
- Pin their own posts to their profile

### C. Comment Edit Missing
Comments only have delete — no edit button. Users should be able to edit within a time window (e.g., 15 minutes).

---

## Plan

### 1. Consolidate Dashboard Tabs (7 → 5)

**Remove "Issues" tab** — it's a duplicate of "Actions". Merge into Actions.

**Redesign "Overview"** to be a true summary hub:
- Keep stat cards (issues reported, open, resolved, support given, impact score, representatives)
- Replace "Recent Activity" list (duplicate of Actions) with a multi-source activity feed showing: recent posts, recent comments, recent issues, recent incidents — all in one timeline
- Add quick links to "My Posts", "My Incidents" sections

**Rename remaining tabs**:
```
Overview | Actions | Projects | Community | My Content | Quests | Mod
```

**New "My Content" tab** replaces the removed "Issues" tab:
- Sub-sections: My Posts, My Comments, My Incidents
- Each with edit/delete controls
- Posts: list with edit/delete/pin actions
- Comments: list with edit/delete, link to parent post
- Incidents: list with edit/delete, status badge

### 2. Add Edit/Delete to Issues (Actions tab)

In `ActionDetailSheet` and `MyActions`:
- Add "Edit" button → opens inline edit for title, description, category, urgency
- Add "Delete" button with confirmation → soft-delete or hard-delete depending on status (only if status is still "submitted", not after acknowledgement)
- Only the issue author can edit/delete

### 3. Add Comment Edit

In `CommentItem`:
- Add "Edit" button next to delete (only for comment owner, within 15-minute window)
- Click toggles inline edit mode — replaces content with textarea pre-filled with current text
- Save calls `supabase.from('comments').update({ content, updated_at })` 
- Show "(edited)" indicator next to timestamp when `updated_at > created_at`
- Wire through `onEditComment` callback from `CommentSection` → `PostDetail`

### 4. Add "My Incidents" to Dashboard

New component `MyIncidentsSection` in the "My Content" tab:
- Query `incidents` where `reporter_id = user.id` (for authenticated) or by `contact_email` match
- Show case_number, title, severity, status, created_at
- Edit button: can update title, description, severity (only if status is still "open")
- Delete button: with confirmation, hard-delete only for "open" status items

### 5. Add "My Posts" to Dashboard

New component `MyPostsSection` in the "My Content" tab:
- Query `posts` where `author_id = user.id`, ordered by created_at desc
- Each row shows title, community, vote count, comment count, created_at
- Actions: Edit (navigate to `/edit-post/:id`), Delete (with confirmation), Pin to Profile toggle

### 6. Post "Pin to Profile" Feature

- Add `is_pinned` boolean column to `posts` table (default false)
- User can pin up to 3 posts to their profile
- Pinned posts appear at top of their profile page
- Toggle via "My Posts" section in dashboard

### 7. Comment "Edited" Indicator

- `comments` table already has `updated_at` — use `updated_at > created_at + 1 second` as "edited" check
- Display "(edited)" text next to the timestamp in CommentItem

---

## Files to Change

| Action | File | What |
|--------|------|------|
| EDIT | `CivicDashboard.tsx` | Remove "Issues" tab, add "My Content" tab |
| EDIT | `DashboardOverview.tsx` | Replace duplicate actions list with multi-source activity timeline |
| CREATE | `MyContentTab.tsx` | New component: My Posts, My Comments, My Incidents sub-sections with CRUD |
| EDIT | `CommentSection.tsx` / `CommentItem` | Add edit button, inline edit mode, "(edited)" indicator |
| EDIT | `PostDetail.tsx` | Wire `onEditComment` handler |
| EDIT | `ActionDetailSheet.tsx` | Add edit/delete buttons for issue author |
| EDIT | `MyActions.tsx` | Add delete button per action |
| DELETE | `PersonalActionTabs.tsx` → `MyIssuesTab` | Remove (merged into Actions) |
| MIGRATION | `posts` table | Add `is_pinned` boolean column |

