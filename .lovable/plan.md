

# Admin/Mod Banner & Avatar Reminder + Platform Navigation Tutorial

## Feature 1: Admin/Mod Setup Reminder

**What**: When an admin or moderator visits a community that's missing a custom avatar or banner, show a dismissible prompt nudging them to upload one. Includes an "Update Later" option that suppresses the reminder for 7 days (stored in `localStorage`).

**Where**: New component `CommunitySetupReminder.tsx` rendered inside `Community.tsx` (the main community page), shown only when:
- `isAdmin || isModerator` is true
- `community.avatarUrl` or `community.bannerUrl` is missing/null
- User hasn't dismissed it within the last 7 days (check `localStorage` key: `community-setup-dismissed-{communityId}`)

**UI**: A subtle banner at the top of the main content area with:
- Icon + message: "Your community is missing a custom avatar/banner. Make it stand out!"
- Two buttons: **"Update Now"** (opens `CommunitySettingsDialog` to the Appearance tab) and **"Later"** (dismisses for 7 days)

## Feature 2: Platform Navigation Tutorial

**What**: A step-by-step guided tour overlay for new users and admins explaining key UI areas. Two variants:
1. **New User Tour** — triggered on first visit after onboarding (stored in `localStorage`: `platform-tour-completed`)
2. **Admin Tour** — triggered on first visit to a community where user is admin/mod (stored: `admin-tour-completed-{communityId}`)

**Component**: `PlatformTour.tsx` — a multi-step modal walkthrough (not a tooltip-based tour, to keep it simple and dependency-free).

**Steps for New Users** (~5 steps):
1. Welcome — overview of the platform layout
2. Level Selector — explains county/constituency/ward navigation
3. Channel List — how channels organize content (posts, chat, announcements)
4. Main Content Area — where posts and discussions appear
5. Right Sidebar — community info, rules, moderators

**Additional Steps for Admins** (~3 more):
6. Channel Management — how to create/manage channels
7. Community Settings — where to update avatar, banner, description
8. Moderation Tools — accessing the moderation tab

**UI**: Full-screen dialog with illustration/icon, title, description, step dots, and Next/Back/Skip buttons. Clean card-based design matching the existing dialog style.

**Integration**:
- In `Community.tsx`: render `PlatformTour` after community loads
- Check `localStorage` to decide whether to show it
- Admin tour checks `isAdmin || isModerator` flag

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/community/CommunitySetupReminder.tsx` | **New** — dismissible banner for missing avatar/banner |
| `src/components/community/PlatformTour.tsx` | **New** — multi-step guided tour modal |
| `src/features/community/pages/Community.tsx` | Add both components, pass permissions and community data |

