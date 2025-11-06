# Implementation Plan: User Profile Page Redesign and Feature Additions

## Objective
Redesign the user profile page (src/pages/Profile.tsx) to match the provided Reddit profile screenshots with full functionality, including additional tabs, right sidebar with user stats, achievements, settings, social links, share and update buttons, and theme-aware styling.

## Information Gathered
- Current profile page has basic layout with header, tabs (overview, posts, comments, saved), and edit form.
- Reddit screenshots show additional tabs (History, Hidden, Upvoted, Downvoted).
- Right sidebar with detailed user stats, achievements, settings, social links.
- Share and update buttons in sidebar.
- Dark theme styling based on user choice (light/dark/system).
- Full functionality required for all tabs and sidebar features.

## Detailed Plan

### 1. Layout Redesign
- Split page into main content area and right sidebar.
- Main content area: profile header, tabs, tab content.
- Right sidebar: user stats, achievements, settings, social links, share/update buttons.

### 2. Tabs Implementation
- Add tabs: Overview, Posts, Comments, Saved, History, Hidden, Upvoted, Downvoted.
- Implement content fetching and display for each tab.
- Use Tabs component with controlled active tab state.

### 3. Profile Header
- Display avatar with update button.
- Display username, user handle.
- Display karma, followers, contributions, Reddit age, active in, gold earned.
- Edit profile button for own profile.

### 4. Right Sidebar
- User stats section with followers, karma, contributions, Reddit age, active in, gold earned.
- Achievements section with icons and count, view all button.
- Settings section with update buttons for Profile, Curate profile, Avatar, Mod Tools.
- Social links section with add social link button.
- Share button for profile.

### 5. Tab Content
- Overview: activity summary, recent activity.
- Posts: list of user posts with PostCard component.
- Comments: list of user comments with CommentSection or custom cards.
- Saved: list of saved posts/comments (to be implemented).
- History, Hidden, Upvoted, Downvoted: placeholders or implement as per data availability.

### 6. Functionality
- Fetch data for all tabs from Supabase.
- Implement update functionality for profile, avatar, settings.
- Implement share functionality.
- Implement mod tools access if user is moderator.
- Handle loading and error states.

### 7. Theme Support
- Use existing theme context or hooks to apply light/dark/system theme.
- Style components to adapt to theme.
- Ensure accessibility and responsiveness.

### 8. Testing
- Test all tabs for correct data loading and display.
- Test update and share buttons.
- Test theme switching.
- Test responsiveness and accessibility.

## Dependent Files to Edit
- src/pages/Profile.tsx (main implementation)
- src/components/ui/* (may need new components or updates)
- src/contexts/ThemeContext.tsx or equivalent (for theme support)
- src/types/index.ts (update interfaces if needed)

## Follow-up Steps
- Confirm plan with user.
- Implement redesign and features in logical steps.
- Test thoroughly after implementation.
- Iterate based on feedback.
