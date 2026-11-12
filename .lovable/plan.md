# Feature triage execution plan

Built from your 14 decisions. Each phase ships on its own, so you can test it before the next one starts. No data is deleted until the matching UI has moved over and you approve the drop.

## Phase 1 — Quick wins (UI only, no data changes)
- Baraza: video channels show an "Open a live room" card where hosts paste a Zoom, X Spaces or Meet link; members see a Join button.
- Civic Assistant: friendly "Ama is resting" card when the AI switch is off.
- Hide forum channels, education and skills endorsement entry points.
- Remove the remaining "Coming soon" banner-upload toasts by wiring real image uploads on Office and Institution pages.

## Phase 2 — One "Report a Problem" flow
- Merge Report Issue and Report Incident into one page: category, location, photos/clip, an anonymous switch and severity (routine to emergency).
- Emergency reports go to the admin crisis pipeline, so broadcasts keep working.
- Old links redirect to the new page.

## Phase 3 — Unified Office Hub
- Merge the Office page and Office Hub into one page with tabs: Overview, Promises, Projects (with contractors and citizen progress photos), Questions, Budget.
- Old office links redirect.

## Phase 4 — Unified promises
- One promises list per office holder, with a kept/in progress/broken meter and citizen receipts.
- Copy over any rows from the three old promise lists (they are empty today).

## Phase 5 — Multi-mode feed
- Composer modes: Discussion, Issue/Receipt, Poll, Event, Guide (admins/experts only).
- Feed tabs: All, Civic Issues, Discussions, Clips; clips appear in the main feed.
- Existing poll and event data moves into posts.

## Phase 6 — Gamification alignment
- Challenge ideas become special quests.
- Badges are awarded automatically on quest and civic-action milestones only.

## Phase 7 — Clean-up (needs your sign-off)
- Drop the unused lists: forums, challenges, education, skills endorsements, crisis/anonymous reports, and the old promise lists.

## Unchanged
- Communities keep their 7–10 channels. Moderation stays on.

## Technical details
- Incidents gain `is_anonymous` and `severity`; anonymous reports hide `reporter_id` from the public through a view or RLS.
- New `promises` table (GRANTs + RLS: public read, holder/admin write) plus a backfill from `campaign_/development_/office_promises`.
- `posts` gains `post_mode` and a JSON `mode_data` for poll/event; `get_unified_feed` emits clips and accepts a mode filter.
- Baraza links are stored on `baraza_spaces` (external_url, provider); no WebRTC.
- Routes: `/report` replaces `/report-issue` and `/report-incident`; `/office/:id` replaces both office routes. All moves come with redirects.
- Destructive drops happen only in Phase 7, as a separate migration.
