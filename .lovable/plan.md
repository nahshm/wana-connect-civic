
Goal: restore the community page to a true 3-panel layout where each panel is fixed in height and scrolls independently (community selector rail, channel list, center content), matching the right sidebar behavior.

What I found
- `AppLayout` still allows parent scrolling (`SidebarInset ... overflow-auto`), so the whole community surface can move as one container.
- Community left rail wrapper uses `z-40` at all breakpoints, which can stack over the global header (`Header` is `z-10`) when parent scroll happens.
- The center column and row containers are missing key flex constraints (`min-h-0`), so child `ScrollArea` sections can escape and force parent overflow.
- `LevelSelector` has no internal `ScrollArea`, so it is not independently scrollable like the other panels.

Implementation plan

1) Lock parent scroll for community routes only
- File: `src/components/layout/AppLayout.tsx`
- Add route awareness (`useLocation`) and switch `SidebarInset` overflow:
  - Community routes (`/c/...`): `overflow-hidden`
  - Other routes: keep `overflow-auto`
- Keep `min-h-0` on `SidebarInset` (already added).

2) Enforce proper flex height constraints in community shell
- File: `src/features/community/pages/Community.tsx`
- Add `min-h-0` to the main row and center column wrappers so inner `ScrollArea` can own scrolling:
  - outer row (`flex h-full ...`) → include `min-h-0`
  - center content (`flex-1 flex flex-col ...`) → include `min-h-0`
  - left nav container → include `min-h-0`
- Adjust left-nav stacking:
  - mobile drawer remains high z-index
  - desktop uses low/normal z-index so it cannot overlay the platform header.

3) Make community selector rail independently scrollable
- File: `src/components/community/discord/LevelSelector.tsx`
- Convert rail to:
  - fixed-height flex column (`h-full min-h-0`)
  - internal `ScrollArea` around level items
- Keep avatar buttons/tooltip behavior unchanged.

4) Preserve channel-list independence
- File: `src/components/community/discord/ChannelList.tsx`
- Validate existing structure (header + `ScrollArea flex-1`) and only add `min-h-0` at container level if needed to prevent inherited overflow.
- No behavior change to category collapse or active channel state.

5) Keep center channel content independent
- File: `src/components/community/discord/ChannelContent.tsx` (validation pass)
- Confirm current `ScrollArea` wrappers remain for feed/grids/fallback and chat/forum continue with their own internal scroll.
- Add only constraint classes if any branch is missing flex containment (no logic changes).

Acceptance criteria
- Global platform header never gets covered by community rail/channel panel while scrolling.
- Community selector rail scrolls independently when levels exceed viewport.
- Channel list scrolls independently with its header fixed.
- Center feed/chat/forum scrolls independently without moving left panels.
- Right sidebar behavior remains unchanged.
