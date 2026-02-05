

## Plan: Implement GitHub Issues - Sprint 1 (P0 Critical)

Based on the comprehensive issue templates you've shared, I recommend tackling these in a specific order that maximizes impact while respecting dependencies.

---

### Recommended Implementation Order

| Priority | Issue | Dependencies | Effort |
|----------|-------|--------------|--------|
| 1st | **Console Cleanup (Partial)** | None | 4 hours |
| 2nd | **TypeScript Interfaces** | None | 4 hours |
| 3rd | **ESLint Auto-fixes** | Interfaces ready | 2 hours |
| 4th | **Sentry Integration** | External setup | 6 hours |
| 5th | **View Tracking** | DB migration | 4 hours |

---

### Phase 1: Console Statement Cleanup (No Dependencies)

**Scope**: Remove ~88 debug `console.log` statements, guard ~25 `console.warn` statements

**Files to modify**:

| File | Action | Lines |
|------|--------|-------|
| `src/pages/Profile.tsx` | Delete debug logs | 312-315 |
| `src/CreatePostForm.tsx` | Delete debug logs | 76, 81 |
| `src/contexts/AuthContext.tsx` | Guard with DEV check | 82, 88 |
| `src/schemas/post.ts` | Guard with DEV check | 62 |

**Already Properly Guarded (No Changes)**:
- `src/lib/vitals.ts` - ✅ Uses `import.meta.env.DEV`
- `src/lib/api-tracking.ts` - ✅ Uses `import.meta.env.DEV`

**Note**: `console.error` statements (~105) will remain until Sentry is integrated (requires external account setup).

---

### Phase 2: Create TypeScript Interfaces

**New file**: `src/types/feed.ts`

```typescript
// Feed-specific types for feedIntegration.ts
export interface FeedPost {
  id: string;
  type: 'post';
  data: Post;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  xp_reward: number;
  available_in_community?: string;
  userProgress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
  };
}

export interface AccountabilityUpdate {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  community?: string;
  created_at: string;
  updated_at?: string;
}
```

**Then update**: `src/utils/feedIntegration.ts` to import and use these types instead of `any[]`

---

### Phase 3: Error Boundaries Ready for Sentry

Prepare error boundaries with placeholder for Sentry integration:

**Files to update**:
- `src/components/ui/error-boundary.tsx`
- `src/components/community/CommunityErrorBoundary.tsx`
- `src/components/onboarding/OnboardingErrorBoundary.tsx`

**Pattern**:
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  // TODO: Replace with Sentry.captureException when integrated
  if (import.meta.env.DEV) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  // Future: Sentry.captureException(error, { extra: errorInfo });
}
```

---

### External Actions Required (Outside Lovable)

These items require manual setup before I can complete implementation:

| Action | Purpose | Link |
|--------|---------|------|
| Create Sentry account | Error monitoring | https://sentry.io/signup/ |
| Get Sentry DSN | Configure integration | Dashboard → Settings → Client Keys |
| Run `git filter-repo` | Remove .env from history | See SECURITY.md |

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/types/feed.ts` | Feed-related TypeScript interfaces |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Remove debug console.log (lines 312-315) |
| `src/CreatePostForm.tsx` | Remove debug console.log (lines 76, 81) |
| `src/contexts/AuthContext.tsx` | Guard console.error/warn with DEV check |
| `src/schemas/post.ts` | Guard console.warn with DEV check |
| `src/utils/feedIntegration.ts` | Replace `any[]` with proper types |
| `src/components/ui/error-boundary.tsx` | Guard console.error, add Sentry TODO |
| `src/components/community/CommunityErrorBoundary.tsx` | Guard console.error, add Sentry TODO |
| `src/components/onboarding/OnboardingErrorBoundary.tsx` | Guard console.error, add Sentry TODO |

---

### Success Metrics After This Sprint

| Metric | Before | After |
|--------|--------|-------|
| Debug console.log | ~88 | 0 |
| Unguarded console.warn | ~25 | 0 |
| `any` types in feedIntegration | 10 | 0 |
| Error boundaries Sentry-ready | 0 | 3 |

---

### What This Plan Does NOT Include (Deferred)

- **Sentry full integration** - Requires external account setup
- **All 300+ `any` type fixes** - Only tackling highest-impact file first
- **View tracking feature** - Requires database migration approval
- **ESLint zero-errors** - Many depend on type fixes across entire codebase

