

# Dashboard Intelligence Redesign: Overview Stats + Mod Tab

## Analysis

### "Community (7d)" — Current Logic
Counts all `civic_actions` in the user's county over the last 7 days using a text match (`ilike location_text`). Shows a raw number with the county name underneath.

**Problem**: A bare number ("12") with no context is meaningless. The user doesn't know if 12 is good or bad, can't click it to see those issues, and the label "Community (7d)" is cryptic. It doesn't drive any action.

**Better approach**: Replace with **"Community Pulse"** — show the count AND make it clickable to navigate to the Community tab filtered to the user's county. Add a trend indicator (up/down vs. previous 7 days). Show a one-line insight like "5 new issues in Nairobi County this week".

### "Representatives" — Current Logic
Counts officials in the `officials` table matching the user's `county_id`. Shows a number + "Contact" button linking to `/officials`.

**Problem**: The count alone is low-value. Knowing "you have 8 representatives" doesn't help unless you can see WHO they are and if any have pending promises or projects. The "Contact" button is useful but the card takes up the same space as the 4 personal stats while providing much less value.

**Better approach**: Replace with a **"Your Representatives"** compact card that shows the count, the names of the top 2-3 officials (governor, senator, MP — by position), and a "View All" link. This makes it immediately useful — the user sees their actual leaders at a glance.

### Mod Tab — Current State
The ModToolsTab is a shell with two problems:
1. **`content_flags` query is hardcoded to return `[]`** — the comment says "table does not exist yet" but `content_flags` DOES exist in the DB schema with full RLS policies
2. **No actual moderation actions** — mods can only see community names and a permanently-empty reports list
3. **No tools** — can't remove posts, ban users, pin announcements, or manage community settings
4. **Ugly design** — plain cards with emoji icons, no visual hierarchy

---

## Plan

### 1. Redesign Overview Stats (DashboardOverview.tsx)

**Replace "Community (7d)"** with a smarter "Community Pulse" card:
- Show count of civic_actions in user's county (last 7 days) — keep the query
- Add previous-week comparison: fetch count for days 7-14 ago, show ↑/↓ trend arrow with delta
- Make the card clickable → switches to Community tab
- Show county name + "X new this week" as subtitle

**Replace "Representatives" card** with "Your Representatives" card:
- Query top 3 officials by position (governor, senator, MP) from `officials` table joined with `office_holders` for names
- Show their names + positions in a compact list
- Keep "View All" link to `/officials`
- If no county set, show "Set your location" CTA linking to `/settings`

**Add "No Location" prompt**: If `profile.county` is null, replace both community stats with a single prompt card: "Set your county to see local activity and representatives" → link to settings/onboarding.

### 2. Full Mod Tab Redesign (PersonalActionTabs.tsx → ModToolsTab)

**Fix the content_flags query** — the table exists. Remove the `return []` stub and wire the real query:
```
supabase.from('content_flags')
  .select('*, posts(title, author_id), project_comments(content)')
  .in('community_id', communityIds) // Note: content_flags doesn't have community_id
```

Actually, `content_flags` has `post_id` and `comment_id` but no `community_id`. Need to join through `posts.community_id` to filter by the mod's communities.

**Redesign into 3 sections**:

**Section A — Overview Bar** (horizontal stats strip):
- Communities moderated (count)
- Pending reports (count from content_flags where status = 'pending')
- Actions taken this week (count from moderation_log)

**Section B — Moderation Queue** (the main content):
- Query `content_flags` joined with `posts` (for community_id filtering + content preview) and `project_comments` (for comment content)
- Filter: flags where the post's `community_id` is in the mod's community list
- Each flag card shows:
  - Content type badge (Post / Comment)
  - Content preview (post title or comment excerpt, max 100 chars)
  - Flag reason
  - Reporter info (anonymized)
  - Time since flagged
  - Action buttons: Approve (dismiss flag), Remove Content, Warn Author
- Actions call `supabase.from('content_flags').update({ status, reviewed_by, reviewed_at })` and insert into `moderation_log`

**Section C — Community Management** (compact):
- List of mod's communities with member count
- Quick links: "View Community", "Community Settings"
- Each community shows recent activity count

### 3. Moderation Action Handlers

When a mod takes action on a flag:
- **Approve** (dismiss): Update `content_flags.status = 'approved'`, set `reviewed_by` and `reviewed_at`
- **Remove Content**: Update flag status to `'removed'`, soft-delete the post/comment (update `posts.status = 'removed'` or similar), log to `moderation_log`
- **Warn Author**: Update flag status to `'warn_author'`, log to `moderation_log`

All actions invalidate the pending flags query.

### 4. Empty States

- **Not a mod**: "You're not moderating any communities yet. Active community members can be invited as moderators by community admins." — with link to explore communities
- **No pending flags**: Success state with checkmark and "All clear — no reports need attention"
- **No location set**: For Overview stats, show location setup prompt instead of "—" values

---

## Files

| Action | File | What |
|--------|------|------|
| EDIT | `DashboardOverview.tsx` | Replace Community(7d) with trend-aware pulse card, replace Representatives with named officials card, add no-location prompt |
| REWRITE | `PersonalActionTabs.tsx` (ModToolsTab section) | Full redesign: overview stats bar, real content_flags query with post join, moderation actions (approve/remove/warn), moderation_log integration |

Total: 2 files edited. No migrations needed — all tables exist.

