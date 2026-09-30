# WanaIQ Native Mobile Roadmap

Target: full feature parity with the web app, built with Expo (React Native) in `/mobile`.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Expo SDK 53, Expo Router (file-based routing, deep links, typed routes) |
| Styling | NativeWind v4, palette from `mobile/src/theme/colors.ts` |
| Backend | Existing Supabase project (same schema, RLS, edge functions) |
| Session storage | `expo-secure-store` with chunked tokens |
| Video | `expo-video` (hardware decoding, native fullscreen) |
| Capture | `expo-camera`, `expo-image-picker` |
| Lists | `@shopify/flash-list` |
| Location | `expo-location` for county / constituency / ward matching |
| Push | `expo-notifications` via EAS (APNs + FCM) |
| Builds | EAS Build, profiles in `mobile/eas.json` |

## Phase 1 — Foundation (done)

- Expo Router app shell, dark theme, tab navigation
- Supabase client with secure session persistence
- Auth provider, email sign-in / sign-up
- Shared types bridge to the web `src/` folder via Metro `watchFolders`
- EAS build profiles, native permission strings

## Phase 2 — Feed & Civic Clips

- FlashList unified feed with optimistic up/down votes and hot/new/top sorting
- Full-screen vertical Clips player: `expo-video`, snap paging, scrub bar,
  playback speed and caption preferences (mirroring `usePlaybackPrefs`)
- Native clip recording, on-device compression, upload to Supabase Storage

## Phase 3 — Communities & Baraza

- Geographic hierarchy browser (county → constituency → ward) and interest communities
- Realtime channel chat with keyboard-aware input and media attachments
- Baraza live spaces: listener/speaker UI, hand-raise queue, live polls

## Phase 4 — Governance & Accountability

- Officials directory, office holders, verification badges
- Promise tracker, project tracker, Bill Breaker summaries
- Civic receipts viewer with trust scoring and source links

## Phase 5 — Notifications, offline & release

- Push notifications wired to the crisis/broadcast pipeline
- Offline draft queue for incident reports and clips (`expo-sqlite`), auto-sync on reconnect
- TestFlight and Google Play internal testing builds

## Ground rules

- Mobile never reaches around RLS; it uses the same policies as the web app.
- Only pure TypeScript (types, schemas, constants, helpers) is shared from `src/`;
  web UI components are never imported into the native app.
- Colour, spacing and font changes go through `mobile/src/theme/colors.ts`.
