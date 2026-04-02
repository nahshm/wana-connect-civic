

# Fix: Infinite Scroll Blocked for Real Users

## Root Cause

`isLikelyBot()` in `src/lib/botDetection.ts` (line 52) returns `true` when `navigator.plugins.length === 0`. This is true for:

- **PWA / standalone mode** — no plugins exposed
- **Mobile browsers** (iOS Safari, Android Chrome) — plugins array is empty
- **Modern desktop Chrome** — `navigator.plugins` is deprecated and may return empty
- **Lovable preview iframe** — same issue

Since `SecureFeed` calls `isLikelyBot()` on every intersection event (line 33), **real users are silently blocked from loading more posts**. The first page loads (10 items), but scrolling to the bottom never triggers `fetchNextPage`.

## Fix

Update `isLikelyBot()` to remove the `navigator.plugins` check. Only keep signals that reliably indicate automation:

```typescript
export function isLikelyBot(): boolean {
  return navigator.webdriver === true ||
    /HeadlessChrome|PhantomJS/.test(navigator.userAgent);
}
```

Also update `detectBot()` to downgrade the plugins signal — don't count it toward the `signals.length >= 2` bot threshold on mobile/PWA. Replace the plugins check (line 22) with a conditional that only flags it on desktop Chrome where the chrome object exists:

```typescript
// Only flag missing plugins on desktop Chrome where they're expected
const isDesktopChrome = /Chrome/.test(navigator.userAgent) 
  && !/Mobile/.test(navigator.userAgent)
  && typeof (window as any).chrome !== 'undefined';
if (isDesktopChrome && navigator.plugins.length === 0) signals.push('no-plugins');
```

## Files Changed

| File | Change |
|------|--------|
| `src/lib/botDetection.ts` | Remove `navigator.plugins.length === 0` from `isLikelyBot()`; scope plugins check in `detectBot()` to desktop Chrome only |

One file, two function edits. No logic changes elsewhere — `SecureFeed` and all consumers remain unchanged.

