# Project rules

- All video playback goes through `src/components/video/VideoPlayer.tsx`; overlays (seek bar, settings) are separate components layered on top, so playback behaviour stays in one place.
- Playback speed and captions preferences live in `src/hooks/usePlaybackPrefs.ts` and persist to localStorage, so the choice follows the viewer across clips.
- The native app lives in `/mobile` (Expo + Expo Router) with its own package.json and toolchain, so web builds and lint never compile React Native code.
- `/mobile` may import only pure TypeScript from the web `src/` via the `@shared/*` alias (Metro `watchFolders`); web UI components are never imported natively, since they depend on the DOM.
- Mobile colours come from `mobile/src/theme/colors.ts`, which feeds both Tailwind config and inline styles, so the palette has one source of truth.
- Non-moderation AI edge functions call `aiFeatureGate(key)` from `supabase/functions/_shared/aiGate.ts` first, so admins can switch each AI feature on/off via `feature_flags` (category `ai`) without redeploying; moderation (civic-steward, content-moderation, civic-guardian) is never gated.
- Baraza live rooms are external meeting links stored on `baraza_spaces` (channel_id, external_url, provider) and rendered by `src/components/community/baraza/BarazaRoomLauncher.tsx`; no in-house WebRTC until user density justifies it.
- Client UI checks AI switches with `useAiFeatureEnabled(key)` (same semantics as `aiFeatureGate`: missing flag = on, error = off), so gated AI screens show a resting state instead of erroring.
- Citizen reporting has one entry route `/report?type=issue|incident` (`ReportProblem.tsx`) that hosts the issue and incident forms; old report URLs redirect there so links never break.
- Office pages: `/office/:country/:level/:jurisdiction/:role` (OfficeHubPage) is the single office hub; `/g/:holderId` redirects there via `OfficeHolderRedirect`, so office features are built once.
- Office/institution banners upload via `src/lib/governance/uploadBanner.ts` and save through `set_office_banner` / `set_institution_banner` RPCs, which check holder/handler rights server-side.
- Promises live only in `office_promises` (statuses pending/in_progress/completed/failed, normalised by trigger); receipts (`promise_verifications`, `promise_updates`) reference it, so new promise features never touch `development_promises`/`campaign_promises`.
- Feed posts carry `posts.post_mode` + `mode_data` (validated by `validate_post_mode` trigger; Guide = admins/verified experts); poll votes live in `post_poll_votes`; `get_unified_feed(..., p_mode)` filters all/issues/discussions/clips and emits clips as type `clip`, so new post kinds extend modes instead of new tables.
- Gamification: time-limited 'challenges' are quests with `is_special` + `starts_at`/`ends_at` (shown via `isQuestOpen`); badges are awarded only by `award_milestone_badges` for quest_milestone/civic_action_milestone categories, so no other code inserts into `user_badges`.
