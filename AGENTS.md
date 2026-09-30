# Project rules

- All video playback goes through `src/components/video/VideoPlayer.tsx`; overlays (seek bar, settings) are separate components layered on top, so playback behaviour stays in one place.
- Playback speed and captions preferences live in `src/hooks/usePlaybackPrefs.ts` and persist to localStorage, so the choice follows the viewer across clips.
- The native app lives in `/mobile` (Expo + Expo Router) with its own package.json and toolchain, so web builds and lint never compile React Native code.
- `/mobile` may import only pure TypeScript from the web `src/` via the `@shared/*` alias (Metro `watchFolders`); web UI components are never imported natively, since they depend on the DOM.
- Mobile colours come from `mobile/src/theme/colors.ts`, which feeds both Tailwind config and inline styles, so the palette has one source of truth.
