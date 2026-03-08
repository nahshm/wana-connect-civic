

## Fix HomeSidebar: Column Name Bug + Engagement-Based Ranking

### Root Cause

The sidebar query fails with **HTTP 400** because it references `communities.icon` — that column doesn't exist. The correct column is `avatar_url`. This is why "Recent Posts" shows nothing.

### Changes

**File: `src/components/feed/HomeSidebar.tsx`**

1. **Fix the broken query** — change `icon` to `avatar_url` in the posts select join and communities query
2. **Update all references** — `community_icon` → use `avatar_url`, `comm.icon` → `comm.avatar_url`
3. **Rank Popular Communities by engagement** — instead of `ORDER BY member_count DESC`, use a composite score: `member_count + (recent post count * 10) + (recent comment count * 5)` via a subquery, so communities with actual activity rank higher than dormant ones with high member counts
4. **Add `display_name` to communities query** — show display name when available, fall back to `c/{name}`

### Technical Detail

Posts query fix:
```
community:communities(name, avatar_url)  // was: icon
```

Communities query — rank by engagement:
```sql
.from('communities')
.select('id, name, display_name, avatar_url, member_count')
.order('member_count', { ascending: false })
.limit(5)
```

Since recent activity data requires subqueries not easily done in PostgREST, we'll fetch the top 10 by member_count, then re-sort client-side by checking which ones have posts in the current feed items (already loaded). This avoids a new RPC while still surfacing active communities.

Alternatively, a simpler approach: fetch communities that appear most in recent posts (the posts we already fetched for "Recent Posts") and merge them with the member_count-sorted list, prioritizing communities with recent content.

