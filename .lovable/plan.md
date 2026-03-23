

# Notification System, Chat, and PWA — Full Implementation Plan

## Current State Analysis

### Notifications — Completely Disconnected

| Layer | Status |
|-------|--------|
| **`comment_notifications` table** | Exists in DB with full RLS, triggers auto-insert on civic references — but **zero frontend reads from it** |
| **`admin_notifications` table** | Exists — never queried by frontend |
| **`send-notifications` edge function** | Inserts into a `notifications` table — but this table **does not exist** in the DB schema (the actual table is `comment_notifications`). The function is orphaned. |
| **Header bell icon** | Links to `/dashboard` — no notification dropdown, no badge, no count |
| **Settings notification prefs** | Toggles saved to `profiles.notification_settings` — but nothing checks these prefs before creating notifications |
| **Realtime** | No subscription to notification changes anywhere |

**Result**: The entire notification pipeline is dead. Triggers create `comment_notifications` rows that nobody reads. The edge function writes to a nonexistent table.

### Chat (/chat) — Dead Shell Replacing Working System

| Component | Status |
|-----------|--------|
| **`/chat` route** → `GlobalChat.tsx` | **Dead static shell** — hardcoded HTML, no Supabase queries, no state, buttons do nothing |
| **`Chat.tsx` (community)** | **Fully functional** — ChatSidebar, ChatWindow, UserSearch, Realtime subscriptions, direct/group/mod_mail tabs |
| **But** `Chat.tsx` is imported in App.tsx line 44 but **never routed** | The working chat system is orphaned |
| **`user_follows` table** | **Does not exist** — referenced in a migration view but never created. No follow/follower system. |
| **Group chat creation** | No UI to create group chats — only direct messages work |

### PWA — Not Set Up

No `vite-plugin-pwa`, no `manifest.json`, no service worker, no install prompt.

---

## Implementation Plan

### Phase 1: User Follow System (prerequisite for chat + notifications)

**Migration**: Create `user_follows` table:
```sql
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
```
With RLS: users can see their own follows, insert/delete their own follows. Add indexes on both columns.

**Trigger**: On follow → insert `comment_notifications` row for the followed user ("X started following you").

**Profile updates**: Increment/decrement `followers_count` and `following_count` on profiles via trigger.

### Phase 2: Notification Center

**Fix `send-notifications` edge function**: Change target table from `notifications` to `comment_notifications` with proper column mapping.

**New component: `NotificationDropdown.tsx`**:
- Replaces the dead bell button in Header
- Dropdown panel showing recent `comment_notifications` where `recipient_id = user.id`
- Grouped by read/unread, sorted by `created_at` desc
- Each notification shows: icon (by `notification_type`), title, message, time ago, action link
- "Mark all as read" button
- Unread count badge on the bell icon
- Realtime subscription on `comment_notifications` for new notifications (INSERT where `recipient_id = user.id`)

**Notification types supported** (from existing triggers + new):
- `civic_reference` — someone referenced a promise/project you're connected to
- `user_warning` — moderation warning
- `accountability_alert` — public alert in your county
- `new_follower` — someone followed you
- `post_comment` — comment on your post
- `post_vote` — vote on your post

**Respect user preferences**: Before inserting notifications (in triggers), check `profiles.notification_settings` JSON for the relevant key.

### Phase 3: Chat — Wire Working System to /chat Route

**Route fix**: Change `/chat` route from `GlobalChat` to `Chat` (the working component). Delete `GlobalChat.tsx`.

**Enhance Chat for follow-based contacts**:
- UserSearch: Add "Suggested" section showing users you follow (from `user_follows`) before search
- Direct chats: Show other participant's name/avatar in sidebar (currently shows "Chat" or `null`)

**Group chat creation**:
- Add "New Group" button in ChatSidebar
- Dialog: group name + search/select multiple users
- Creates `chat_rooms` with `type: 'group'`, adds all selected users as `chat_participants`

**Chat sidebar fixes**:
- For direct chats: fetch the OTHER participant's profile (currently shows "?" fallback)
- Show last message preview and timestamp per conversation
- Show unread indicator (compare `chat_participants.last_read_at` with latest message `created_at`)

**Mod Mail access**: Add "New Mod Mail" option — select a community you're a member of, enter subject, creates `mod_mail_threads` entry.

### Phase 4: PWA Setup

**Install `vite-plugin-pwa`** and configure in `vite.config.ts`:
- Manifest with app name "WanaIQ", theme colors from the project's design tokens, icons
- Service worker with `navigateFallbackDenylist: [/^\/~oauth/]`
- Offline support for static assets

**Create PWA icons**: Generate from existing branding (or placeholder civic-themed icon).

**Add mobile meta tags** to `index.html`: viewport, theme-color, apple-mobile-web-app-capable.

**Install page** at `/install`: Detects if installable, shows platform-specific instructions (iOS Share → Add to Home Screen, Android install prompt).

---

## Files

| Action | File | What |
|--------|------|------|
| MIGRATION | `user_follows` table + triggers for notification + profile counters |
| MIGRATION | Fix `send-notifications` target table reference |
| CREATE | `src/components/notifications/NotificationDropdown.tsx` — bell dropdown with realtime |
| EDIT | `src/components/layout/Header.tsx` — replace bell Link with NotificationDropdown |
| EDIT | `src/App.tsx` — change `/chat` route to use `Chat` instead of `GlobalChat` |
| DELETE | `src/pages/GlobalChat.tsx` — dead shell |
| EDIT | `src/components/chat/ChatSidebar.tsx` — show other user's name for DMs, last message, unread badge, group creation |
| EDIT | `src/components/chat/UserSearch.tsx` — add suggested contacts from follows |
| EDIT | `src/features/community/pages/Chat.tsx` — add group creation handler |
| EDIT | `supabase/functions/send-notifications/index.ts` — fix table name |
| INSTALL | `vite-plugin-pwa` |
| EDIT | `vite.config.ts` — PWA plugin config |
| EDIT | `index.html` — PWA meta tags |
| CREATE | `public/manifest.json` + icons |
| CREATE | `src/pages/Install.tsx` — PWA install page |
| EDIT | `src/App.tsx` — add `/install` route |

Total: 3 migrations, 4 new files, 8 edits, 1 delete, 1 npm install.

