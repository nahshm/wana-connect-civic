

# PWA Branding, Bottom Navigation, Auto-Update & Install Prompt

## What Needs to Change

### 1. PWA Branding — Wrong Logo & Identity
- `vite.config.ts` manifest uses `/favicon.png` for icons — should use the new meerkat mascot logo
- `index.html` still references old favicon and has `apple-mobile-web-app-title` as "ama" with old theme color `#ea580c`
- Install page (`Install.tsx`) uses generic text with no logo imagery
- Need to copy uploaded logos to `public/` for PWA icon use and create properly sized icons

### 2. Bottom Navigation Bar — Does Not Exist
No mobile bottom nav exists anywhere in the codebase. Need to create a thumb-friendly bottom nav for mobile with auto-hide on scroll down, show on scroll up.

**Tabs**: Home, Communities, Create (+), Chat, Dashboard — the 5 primary actions matching the sidebar.

### 3. Auto-Update — Already Configured
`vite-plugin-pwa` has `registerType: 'autoUpdate'` which auto-updates the service worker. This is correct. No change needed.

### 4. Install Prompt — Plain & Boring
Current Install page is a plain card layout with no visual appeal. Need a branded, eye-catching design with the mascot logo, gradient background, and an auto-showing install banner/toast for first-time visitors.

---

## Implementation

### A. Copy Logos to Public
- Copy `WanaIQ_Logo_Primary.png` to `public/pwa-icon-512.png` (mascot face — used as app icon)
- Copy `WanaIQ_Logo_Sec.png` to `public/pwa-logo-wide.png` (mascot + "ama" text — used on install page)

### B. Update PWA Manifest (`vite.config.ts`)
- Update icon paths to use `pwa-icon-512.png`
- Update `theme_color` to `#c1351d` (the red from the "ama" text in the logo)
- Keep `short_name: 'ama'`

### C. Update `index.html`
- Add `<link rel="apple-touch-icon" href="/pwa-icon-512.png">`
- Update `theme-color` meta tag
- Remove duplicate `<meta name="description">` and `<meta name="author">` tags

### D. Create `MobileBottomNav.tsx`
- Fixed bottom bar, visible only on mobile (`md:hidden`)
- 5 tabs: Home, Communities, Create, Chat, Dashboard
- Active tab highlighted with primary color
- Auto-hide on scroll down, show on scroll up (track scroll direction via `useEffect` on the `SidebarInset` scroll container)
- Add `pb-16 md:pb-0` padding to `AppLayout` content area to prevent content from being hidden behind the nav

### E. Redesign `Install.tsx` — Eye-Catching Install Page
- Full-width gradient hero with mascot logo centered
- Large "Install ama" heading with animated download icon
- One-tap install button (prominent, full-width on mobile)
- Platform-specific instructions in collapsible sections below
- Benefits listed with icons

### F. Create `InstallPromptBanner.tsx` — Auto-Showing Install Banner
- Floating banner/toast that appears at the bottom of the screen for non-installed users
- Shows mascot icon + "Install ama for a better experience" + Install button + dismiss X
- Only shows once per session (uses `sessionStorage`)
- Appears after 30 seconds of browsing (not immediately — avoid annoyance)
- Dismissed permanently via `localStorage` key
- Integrated into `AppLayout.tsx`

---

## Files

| Action | File | What |
|--------|------|------|
| COPY | Uploaded logos → `public/pwa-icon-512.png`, `public/pwa-logo-wide.png` | PWA icons |
| EDIT | `vite.config.ts` | Update manifest icons, theme_color |
| EDIT | `index.html` | Apple touch icon, fix duplicate metas, update theme-color |
| CREATE | `src/components/layout/MobileBottomNav.tsx` | Bottom nav with auto-hide on scroll |
| EDIT | `src/components/layout/AppLayout.tsx` | Add MobileBottomNav + bottom padding |
| REWRITE | `src/pages/Install.tsx` | Branded, eye-catching install page |
| CREATE | `src/components/pwa/InstallPromptBanner.tsx` | Auto-showing install banner for non-installed users |
| EDIT | `src/components/layout/AppLayout.tsx` | Add InstallPromptBanner |

