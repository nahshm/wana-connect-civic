

## Unified Feed / National Feed - Complete Redesign

### Current Issues Identified

1. **Right sidebar is broken**: `ScrollArea` with `h-[calc(100vh-4rem)]` does not scroll properly because the parent flex container and `SidebarInset` have conflicting overflow rules. The sidebar also lacks the Reddit-style "RECENT POSTS" layout with thumbnails shown in the reference screenshots.

2. **Layout proportions are off**: The feed column uses `max-w-2xl` (672px) but there's excessive whitespace because the sidebar is only 300px and the remaining space is unaccounted for. The Reddit reference shows the feed taking up most of the center with the sidebar snug against it.

3. **HomeSidebar content doesn't match reference**: The reference shows "RECENT POSTS" with community avatar, post title, thumbnail image on the right, upvote/comment counts, and a "Clear" button. Current sidebar has "Trending Today" with numbered list (no thumbnails) and "Popular Communities" with a "View" button instead of "Join".

4. **Feed items have `space-y-3` gap** creating visual separation that doesn't match the Reddit reference, which uses seamless `border-b` dividers with no card gaps.

5. **The `handleInteraction` callback is a no-op** — does nothing, yet is passed everywhere.

### Plan

#### 1. Fix Home.tsx Layout

- Remove `space-y-3` from feed list, use `divide-y divide-border/50` for seamless post separation (matching Reddit reference and existing PostCard `border-b` style)
- Change right sidebar from `w-[300px]` to `w-[312px]` with proper sticky positioning inside the scrolling `SidebarInset` (not fixed height with `ScrollArea`)
- The key fix: the right sidebar should be `sticky top-0 self-start` inside the naturally scrolling `SidebarInset`, not a separate scroll container. This way both the feed and sidebar scroll together, but the sidebar sticks when it reaches the top — exactly like Reddit.
- Remove the `ScrollArea` wrapper. Let the sidebar content be naturally positioned.

#### 2. Redesign HomeSidebar to Match Reddit Reference

Rewrite `HomeSidebar.tsx` to have:

**"RECENT POSTS" section** (matching the reference exactly):
- Header: "RECENT POSTS" uppercase label + "Clear" button (right-aligned, blue text)
- Each item: community avatar (small circle) + `c/name • time ago` on first line, post title (bold, 2-line clamp) on second line, thumbnail image (64x64 rounded) on the right side
- Below title: `X upvotes · Y comments` in muted text
- Separator between items
- Fetch from `posts` table ordered by `created_at DESC` (recent, not trending)

**"POPULAR COMMUNITIES" section**:
- Keep existing but change "View" button to "Join" with proper join logic (check membership)

**Footer links**: Keep as-is but update copyright year.

#### 3. Fix Right Sidebar Scroll Behavior

The `SidebarInset` already has `overflow-auto` for non-community pages. The right sidebar should use `sticky top-0` positioning so it stays visible while the user scrolls the feed — this is exactly how Reddit's right sidebar works. No `ScrollArea` needed.

When sidebar content is taller than viewport, it should scroll with the page until its bottom is visible, then stick. This is achieved with `sticky top-0 h-fit max-h-screen overflow-y-auto`.

#### 4. Minor Cleanup

- Remove the no-op `handleInteraction` — pass actual handlers or undefined
- Fix `mt-2` on feed container (unnecessary gap after sort bar)

### Files to Modify

| File | Change |
|------|--------|
| `src/features/feed/pages/Home.tsx` | Fix layout: sticky sidebar, remove ScrollArea, seamless dividers |
| `src/components/feed/HomeSidebar.tsx` | Full rewrite: Reddit-style "Recent Posts" with thumbnails + "Popular Communities" with Join |

### Technical Details

**Sidebar positioning approach:**
```
<aside className="hidden lg:block w-[312px] flex-shrink-0">
  <div className="sticky top-0 h-screen overflow-y-auto p-4 space-y-4">
    <HomeSidebar />
  </div>
</aside>
```

**Recent Posts query:**
```sql
SELECT id, title, created_at, upvotes, comment_count,
       community:communities(name, icon),
       media:post_media(file_path, file_type)
FROM posts
ORDER BY created_at DESC
LIMIT 6
```

**Thumbnail rendering**: Use first `post_media` image if available, or `link_image` as fallback. Show 64x64 rounded square on the right side of each item.

