

# Tour Upgrade: Spotlight-Based Walkthrough Anchored to UI Elements

## Approach

Replace the current centered Dialog modal with a **spotlight tour** that highlights actual UI elements. Each step will:

1. Add a `data-tour` attribute to the target DOM element
2. Render a **full-screen backdrop overlay with a cutout** around the highlighted element
3. Position a **tooltip card** adjacent to the highlighted element (auto-positioned: right, bottom, or left depending on space)

No external libraries — pure React + CSS with `getBoundingClientRect()`.

## How It Works

- A portal-rendered overlay covers the entire screen with a semi-transparent backdrop
- A CSS `clip-path` or box-shadow technique creates a "hole" around the target element using its bounding rect
- A floating tooltip card (with title, description, step dots, Next/Back/Skip) is absolutely positioned near the cutout
- `ResizeObserver` + scroll listener keeps positions updated
- Step 0 (Welcome) has no target — shows as a centered card (like current behavior)

## Steps & Target Selectors

| Step | Target `data-tour` | Placement | Element |
|------|-------------------|-----------|---------|
| 0 - Welcome | *none (centered)* | center | — |
| 1 - Level Selector | `tour-level-selector` | right | `<LevelSelector>` wrapper div |
| 2 - Channel List | `tour-channel-list` | right | `<ChannelList>` wrapper |
| 3 - Main Content | `tour-main-content` | left | `<ScrollArea>` main content |
| 4 - Community Sidebar | `tour-sidebar` | left | Right sidebar `<aside>` |
| 5 - Channel Management (admin) | `tour-add-channel` | right | The "+" button in ChannelList |
| 6 - Community Settings (admin) | `tour-settings` | bottom | Settings trigger area |
| 7 - Moderation (admin) | *none (centered)* | center | — |

## Files to Change

| File | Change |
|------|--------|
| `src/components/community/PlatformTour.tsx` | **Rewrite** — spotlight overlay + positioned tooltip instead of Dialog |
| `src/features/community/pages/Community.tsx` | Add `data-tour` attributes to the 5 target wrapper elements |
| `src/components/community/discord/LevelSelector.tsx` | Wrap root in div with `data-tour="tour-level-selector"` |
| `src/components/community/discord/ChannelList.tsx` | Add `data-tour="tour-channel-list"` to root + `data-tour="tour-add-channel"` to the "+" button |

## Key Technical Details

- **Cutout technique**: `box-shadow: 0 0 0 9999px rgba(0,0,0,0.6)` on an absolutely positioned transparent div matching the target's rect — simplest approach, no clip-path math
- **Tooltip positioning**: Calculate based on target rect — prefer right side, fall back to bottom/left if near viewport edge
- **Smooth transitions**: `transition: all 300ms ease` on the highlight box when stepping between targets
- **Scroll into view**: `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` before highlighting if target is off-screen
- **Z-index**: Overlay at `z-50`, tooltip at `z-[51]`

