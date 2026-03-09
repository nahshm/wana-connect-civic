

# Fix CivicChat: Button Visibility + Reddit Answers-Inspired Redesign

## Problems Identified

1. **Welcome screen has no New/Clear buttons** -- they only exist in the chat view (messages > 0), so users never see them on first load.
2. **Chat view header competes with AppLayout Header** -- CivicChat renders inside `AppLayout` (which has its own `<Header />` + sidebar), but CivicChat adds its own sticky header. The `h-[calc(100vh-4rem)]` tries to account for this but the inner header can get clipped.
3. **No session history management** -- users can't see or delete previous chat sessions, only clear the current one.

## Design Direction (from reference screenshots)

The Reddit Answers pattern the user shared shows:
- **Welcome screen**: centered search box, "Recent" queries as deletable chips, "Recommended" question cards
- **Answer view**: back arrow (←) + "New question" button in top bar, answer content with sources, sticky follow-up input at bottom
- Clean, content-focused layout -- no competing headers

## Implementation Plan

### 1. Redesign Welcome Screen
- Add a top-right "New question" button (like Reddit Answers)
- Show **Recent sessions** as horizontal chips with × delete buttons (stored in localStorage)
- Keep recommended questions grid below
- Move language toggle inline (not fixed position -- it overlaps AppLayout elements)

### 2. Redesign Chat/Answer View
- Replace the full sticky header with a minimal top bar: **← Back** (returns to welcome) + **"New question"** button (top-right)
- Remove the competing header bar with WanaIQ branding (AppLayout already provides nav)
- Keep language toggle as a small inline pill in the top bar
- Keep the bottom input for follow-ups, styled like Reddit's "Ask a followup"

### 3. Session Management
- Store recent sessions in localStorage: `{ id, firstQuery, timestamp }[]` (max 10)
- Recent chips on welcome screen with × to delete individual sessions
- "New question" creates a fresh session and navigates to welcome
- "← Back" from answer view returns to welcome (keeps session alive for later)

### 4. Layout Fix
- Remove `h-[calc(100vh-4rem)]` -- let the component flow naturally inside `SidebarInset` which already manages overflow
- Use `min-h-0 flex-1 flex flex-col` pattern to fill available space without fighting the parent layout
- Remove `sticky top-0` header (replaced with simple flex row)

### Files Changed
- `src/components/civic-assistant/CivicChat.tsx` -- full redesign of both views

