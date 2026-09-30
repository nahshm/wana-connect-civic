# Project rules

- All video playback goes through `src/components/video/VideoPlayer.tsx`; overlays (seek bar, settings) are separate components layered on top, so playback behaviour stays in one place.
- Playback speed and captions preferences live in `src/hooks/usePlaybackPrefs.ts` and persist to localStorage, so the choice follows the viewer across clips.
