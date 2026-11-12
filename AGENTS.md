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
