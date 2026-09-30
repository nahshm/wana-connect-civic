# WanaIQ Mobile (Expo)

Native iOS + Android app for WanaIQ, living alongside the web app in the same repository.

## Getting started

```bash
cd mobile
npm install
npx expo start
```

Press `i` for the iOS simulator, `a` for Android, or scan the QR code with Expo Go.
Native modules (camera, secure store, video) need a development build:

```bash
npx expo prebuild
npx expo run:ios      # or: npx expo run:android
```

## Store builds

```bash
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

## What's shared with the web app

Metro watches the repo's `src/` folder, so anything pure TypeScript can be imported:

```ts
import type { Database } from '@shared/integrations/supabase/types';
import type { FeedItem } from '@shared/types/feed';
```

- `@/*` → `mobile/src/*`
- `@shared/*` → repo `src/*` (types, schemas, constants, pure helpers only — never web UI)

Both apps talk to the same Supabase project, the same RLS policies and the same edge functions.

## Theming

`src/theme/colors.ts` is the single source of truth. It feeds both Tailwind classes
(via `tailwind.config.js`) and inline styles. Change a colour there once.

## Layout

```
mobile/
  app/                 Expo Router routes (file-based)
    _layout.tsx        Root stack, providers, dark status bar
    (tabs)/            Feed · Clips · Communities · Governance · Profile
    sign-in.tsx        Email auth modal
  src/
    components/        Shared UI primitives
    contexts/          Auth session provider
    lib/supabase.ts    Supabase client with chunked SecureStore sessions
    theme/colors.ts    Palette
```

## Roadmap

See `../docs/MOBILE_ROADMAP.md`.
