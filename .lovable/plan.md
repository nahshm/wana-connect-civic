# Full shadcn Preset Upgrade

Upgrade the WanaIQ frontend to Tailwind CSS v4 and apply the complete shadcn preset `b77BNryJOK`, including its components, OKLCH theme, radius, and fonts. Preserve app-specific behavior, then repair and verify the migration end-to-end.

## Confirmed decisions

- Use Tailwind CSS v4 with native OKLCH tokens.
- Run `npx shadcn@latest apply --preset b77BNryJOK` rather than manually approximating the preset.
- Replace upstream shadcn components with the preset versions, then restore required WanaIQ extensions.
- Make red the sitewide primary color.
- Centralize future visual changes in one theme stylesheet and one font configuration module.
- Delete `_preset-backup/` only after the upgraded app passes verification.

## Current state confirmed from the project

- The project currently uses Tailwind CSS 3.4 with the Tailwind PostCSS plugin and an HSL-based `tailwind.config.ts` theme.
- The preset tokens supplied use Tailwind v4-compatible OKLCH values.
- The current button has custom `blue` and `join` variants that must survive the overwrite.
- The current sidebar contains app-specific behavior, including safe fallback context, mobile handling, collapse state, keyboard control, and layout sizing; these behaviors must be reconciled rather than blindly discarded.
- Vite also runs PWA, Lovable MCP, React SWC, and component-tagger plugins; the migration must preserve them.

## Implementation plan

### 1. Baseline and preset inspection

- Capture the current dependency/config state and screenshots of representative public and authenticated pages.
- Run the preset command in a temporary isolated Vite project first to inspect the exact generated component sources, dependencies, font choices, `components.json`, and CSS output.
- Diff every generated upstream component against `src/components/ui/` and classify each file as upstream, customized upstream, or WanaIQ-only.
- Inventory Tailwind v3-only syntax across TSX and CSS, including config-based colors, plugins, `theme(...)`, legacy arbitrary-variable syntax, deprecated utilities, and custom `@apply` usage.

### 2. Upgrade the styling toolchain

- Upgrade Tailwind and its PostCSS/Vite integration to v4-compatible packages using Bun so `package.json` and `bun.lock` remain synchronized.
- Update PostCSS and Vite without disturbing the existing React, PWA, MCP, or Lovable plugins.
- Use the official Tailwind upgrade tool where safe, then review every generated change instead of accepting it blindly.
- Convert configuration-defined tokens, fonts, radii, keyframes, typography support, and semantic colors to Tailwind v4 CSS-first configuration.

### 3. Apply the full preset

- Run `npx shadcn@latest apply --preset b77BNryJOK` against the migrated project.
- Accept the preset’s component style, dependencies, fonts, radius, chart palette, sidebar palette, and the supplied light/dark OKLCH variables.
- Keep the preset output as the authoritative upstream baseline; do not convert the supplied OKLCH values back to HSL.
- Resolve CLI/config failures as migration work rather than falling back silently to a partial theme port.

### 4. Create simple theme swap points

- Move the preset’s semantic light/dark variables into `src/styles/theme.css`.
- Add `src/styles/fonts.ts` as the single source of font-family names and loading metadata, while keeping CSS variables as the runtime styling contract.
- Keep `src/index.css` focused on Tailwind imports, semantic token mapping, base rules, and shared utilities.
- Preserve WanaIQ civic accent tokens and custom animations in a clearly separated compatibility section.
- Document the three common changes: primary color, font family, and button appearance.

### 5. Reconcile overwritten components

- Use preset defaults for all true shadcn components.
- Restore the `blue` and `join` button variants, but express their colors through semantic tokens rather than fixed color classes so future theme changes remain easy.
- Reapply required sidebar behavior to the new preset sidebar API: mobile drawer, mini-collapse, external trigger, cookie state, keyboard shortcut, and the existing safe usage contract.
- Preserve WanaIQ-only UI files such as verified badges, receipts, lightboxes, and error boundaries; migrate only their incompatible Tailwind syntax.
- Update component consumers where the latest preset changed props, exports, or markup contracts.

### 6. Repair Tailwind v4 migration fallout

- Fix invalid utilities, removed opacity helpers, changed ring/shadow behavior, arbitrary CSS-variable syntax, and any incompatible `@apply` rules.
- Update editor and feature CSS to use semantic tokens and maintain light/dark contrast.
- Keep the existing theme toggle and update the PWA browser color to match the preset’s active light/dark surfaces.
- Do not change product logic, database behavior, MCP tools, routes, or security policies.

### 7. Iterative validation until clean

Repeat diagnosis and repair until all relevant checks pass; do not impose an arbitrary three-attempt cutoff.

1. Run the project’s build and TypeScript checks.
2. Run targeted tests for changed shared UI behavior.
3. Inspect browser console and failed network requests.
4. Verify Home/feed, post details, communities, projects, officials, search, onboarding, authentication, settings, dashboard, chat, dialogs, dropdowns, forms, and the OAuth consent screen.
5. Test desktop and mobile layouts, sidebar expanded/collapsed states, light/dark modes, keyboard focus, loading skeletons, and long text.
6. Compare against baseline screenshots and repair visual or interaction regressions.
7. Re-run the checks after every repair batch until the build, type checks, tests, console, and visual smoke tests are clean.

Authenticated browser verification will use the available Supabase session when supported. If this external Supabase project cannot provide an automated session, authenticated pages will be source/test verified and the limitation will be reported precisely.

### 8. Cleanup and handoff

- Remove obsolete Tailwind v3 packages/configuration and unused preset dependencies only after verification.
- Delete `_preset-backup/` only after the final clean build and visual checks.
- Add concise theming documentation explaining where to change fonts, button variants, primary color, radius, and light/dark values.
- Record the new visual system in project memory so later work does not restore the previous blue-undertone theme accidentally.

## Acceptance criteria

- The project runs on Tailwind CSS v4.
- Preset `b77BNryJOK` is applied through the shadcn CLI, not approximated.
- The supplied OKLCH light/dark tokens and red primary are active.
- Preset fonts and component styling are active.
- Existing WanaIQ flows and custom component behavior still work.
- Theme color, fonts, and button variants can each be changed from a clear central location.
- Build, type checks, targeted tests, console checks, and responsive visual smoke tests pass.
- No PWA, MCP, authentication, routing, or Supabase behavior is intentionally altered.