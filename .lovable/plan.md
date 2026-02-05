

# Issue #1: Fix ESLint Errors and Warnings

## Overview

**Current State**: 363 ESLint errors, 51 warnings (414 total problems)  
**Target**: 0 errors, <10 warnings  
**Primary Issue**: `@typescript-eslint/no-explicit-any` violations (300+)  
**Estimated Effort**: 3-4 days

---

## Analysis Summary

| File Category | Files Affected | `any` Instances | Priority |
|--------------|----------------|-----------------|----------|
| Search/Data Fetching | 5 | ~50 | P0 |
| Hooks | 15 | ~80 | P0 |
| Pages | 10 | ~60 | P1 |
| Components | 40+ | ~200 | P1 |
| Test Files | 10+ | ~50 | P2 (can keep `any`) |

---

## Phase 1: Create Missing TypeScript Interfaces (Day 1)

### 1.1 Create `src/types/search.ts`

New interfaces for search results:

```typescript
export interface SearchPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  community?: {
    id: string;
    name: string;
    display_name: string;
  };
}

export interface SearchComment {
  id: string;
  content: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar?: string;
  };
  post?: {
    id: string;
    title: string;
    community?: { name: string };
  };
}

export interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar?: string;
  bio?: string;
  karma?: number;
  is_verified?: boolean;
  role?: string;
}

export interface SearchCommunity {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  member_count: number;
  category?: string;
}

export interface SearchOfficial {
  id: string;
  name: string;
  position: string;
  level: string;
  constituency?: string;
  county?: string;
  party?: string;
  photo_url?: string;
}

export interface SearchPromise {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress_percentage: number;
  official_id: string;
}

export interface SearchProject {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress_percentage: number;
  county?: string;
  constituency?: string;
}

export interface SearchResults {
  posts: SearchPost[];
  comments: SearchComment[];
  users: SearchUser[];
  communities: SearchCommunity[];
  officials: SearchOfficial[];
  promises: SearchPromise[];
  projects: SearchProject[];
}
```

### 1.2 Create `src/types/gamification-extended.ts`

Extensions for Supabase-returned quest data:

```typescript
export interface QuestFromDB {
  id: string;
  title: string;
  description: string;
  category: 'reporting' | 'attendance' | 'engagement' | 'content' | 'learning';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  xp_reward: number;
  is_active: boolean;
  available_in_community?: string;
  created_at: string;
}

export interface UserQuestFromDB {
  id: string;
  user_id: string;
  quest_id: string;
  status: 'active' | 'pending_verification' | 'completed' | 'rejected';
  progress: number;
  started_at: string;
  completed_at?: string;
  quest?: QuestFromDB;
}
```

### 1.3 Create `src/utils/caseConversion.ts`

Properly typed utility functions:

```typescript
type CamelCaseKey<S extends string> = S extends `${infer P}_${infer Q}`
  ? `${Lowercase<P>}${Capitalize<CamelCaseKey<Q>>}`
  : S;

type CamelCaseObject<T> = T extends Array<infer U>
  ? Array<CamelCaseObject<U>>
  : T extends object
  ? { [K in keyof T as CamelCaseKey<string & K>]: CamelCaseObject<T[K]> }
  : T;

export function toCamelCase<T extends Record<string, unknown>>(
  obj: T
): CamelCaseObject<T> {
  // Implementation
}
```

---

## Phase 2: Fix High-Impact Files (Days 2-3)

### 2.1 Fix `src/hooks/useSearch.ts`

**Current**: `SearchResults` uses `any[]` for all fields  
**Fix**: Import and use new typed interfaces

```typescript
// Before
export interface SearchResults {
  posts: any[]
  comments: any[]
  // ...
}

// After
import { SearchPost, SearchComment, SearchUser, ... } from '@/types/search';

export interface SearchResults {
  posts: SearchPost[];
  comments: SearchComment[];
  users: SearchUser[];
  communities: SearchCommunity[];
  officials: SearchOfficial[];
  promises: SearchPromise[];
  projects: SearchProject[];
}
```

### 2.2 Fix `src/pages/SearchResults.tsx`

**Current**: 20+ `any` type annotations in map callbacks  
**Fix**: Remove explicit `any` - TypeScript will infer from `SearchResults`

```typescript
// Before
data.posts.map((post: any) => ...)

// After  
data.posts.map((post) => ...)  // TypeScript infers SearchPost
```

Also fix:
- Line 22: `type: activeTab as any` → Create proper union type
- Line 35: `arr: any` → Use proper reduce typing
- Line 62: `v as any` → Use proper enum/union

### 2.3 Fix `src/pages/Quests.tsx`

**Current**: Uses `as any` type assertions for Supabase queries  
**Fix**: Update Supabase types or use proper casting

```typescript
// Before
.from('quests' as any)
setQuests((data as any[]) || []);

// After
.from('quests')  // If table exists in DB types
// OR
const { data } = await supabase
  .from('quests')
  .select('*') as { data: QuestFromDB[] | null };
```

### 2.4 Fix `src/pages/Profile.tsx`

**Current**: `toCamelCase(obj: any): any`  
**Fix**: Import properly typed utility

```typescript
// Before
function toCamelCase(obj: any): any { ... }

// After
import { toCamelCase } from '@/utils/caseConversion';
```

### 2.5 Fix `src/hooks/useGeographicCommunities.ts`

Same `toCamelCase` fix - import shared utility instead of inline definition.

### 2.6 Fix Component Error Handlers

Pattern fix for all `catch (error: any)` blocks:

```typescript
// Before
} catch (error: any) {
  toast({ description: error.message });
}

// After
} catch (error) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  toast({ description: message });
}
```

**Files to fix**:
- `src/components/community/discord/CreateChannelDialog.tsx`
- `src/hooks/useVideoUpload.ts`
- `src/components/community/events/CreateEventDialog.tsx`
- `src/components/community/polls/CreatePollDialog.tsx`
- `src/pages/Quests.tsx`
- `src/components/projects/ProjectVerificationButton.tsx`

---

## Phase 3: Fix Remaining Files (Day 3-4)

### 3.1 Gamification Components

**Files**:
- `src/components/gamification/GamificationWidgets.tsx` (line 70)
- `src/components/gamification/BadgeShowcase.tsx` (line 65)

**Fix**: Type the reduce callbacks properly

```typescript
// Before
const total = (data as any[])?.reduce((sum: number, action: any) => ...)

// After
interface GamificationAction {
  action_value: number;
}
const total = (data as GamificationAction[])?.reduce((sum, action) => 
  sum + (action.action_value || 0), 0) || 0;
```

### 3.2 Feature/Profile Hooks

**File**: `src/features/profile/hooks/useUserActivity.ts`

**Fix**: Type the activity transformation

```typescript
// Before
badges.forEach((ub: any) => activities.push({...}))

// After
interface UserBadge {
  id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}
badges.forEach((ub: UserBadge) => activities.push({...}))
```

### 3.3 Governance Components

**File**: `src/features/governance/components/ElectionTracker.tsx`

**Fix**: Use existing `Official` type or create specific interface

### 3.4 Component Callbacks

**File**: `src/components/community/steps/Step2_NameDescription.tsx`

```typescript
// Before
onChange: (data: any) => void;

// After
onChange: (data: { name: string; description: string; tags?: string[] }) => void;
```

### 3.5 Feed/Post Components

**File**: `src/features/feed/pages/CreatePost.tsx`

```typescript
// Before
const handleCreatePost = async (postData: any) => {

// After
interface CreatePostData {
  title: string;
  content: string;
  community_id?: string;
  tags?: string[];
  media?: File[];
}
const handleCreatePost = async (postData: CreatePostData) => {
```

---

## Phase 4: Test Files (Optional - Lower Priority)

Test files can retain `any` types as they're not production code. However, for completeness:

**File**: `src/test-utils/mocks/supabase.ts`

```typescript
// Acceptable to keep any in test mocks
let authStateCallback: ((event: string, session: Session | null) => void) | null = null;
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/search.ts` | Search result interfaces |
| `src/types/gamification-extended.ts` | Extended quest/badge types |
| `src/utils/caseConversion.ts` | Typed case conversion utility |

## Files to Modify

| File | Changes | `any` Fixes |
|------|---------|-------------|
| `src/hooks/useSearch.ts` | Use typed SearchResults | 7 |
| `src/pages/SearchResults.tsx` | Remove explicit any in maps | 20+ |
| `src/pages/Quests.tsx` | Type Supabase queries | 5 |
| `src/pages/Profile.tsx` | Import shared toCamelCase | 3 |
| `src/hooks/useGeographicCommunities.ts` | Import shared toCamelCase | 3 |
| `src/components/gamification/GamificationWidgets.tsx` | Type reduce callback | 2 |
| `src/components/gamification/BadgeShowcase.tsx` | Type reduce callback | 2 |
| `src/features/profile/hooks/useUserActivity.ts` | Type activity data | 3 |
| `src/features/governance/components/ElectionTracker.tsx` | Use Official type | 1 |
| `src/components/community/steps/Step2_NameDescription.tsx` | Type onChange | 1 |
| `src/features/feed/pages/CreatePost.tsx` | Type postData | 1 |
| `src/components/community/discord/CreateChannelDialog.tsx` | Type error handler | 2 |
| `src/hooks/useVideoUpload.ts` | Type error handler | 1 |
| `src/components/community/events/CreateEventDialog.tsx` | Type error handler | 1 |
| `src/components/community/polls/CreatePollDialog.tsx` | Type error handler | 1 |
| `src/components/projects/ProjectVerificationButton.tsx` | Type error handler | 1 |

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| ESLint Errors | 363 | 0-10 |
| ESLint Warnings | 51 | <10 |
| `any` Types | 300+ | <50 |
| Type Coverage | ~70% | >95% |

---

## Technical Notes

### Why not just disable the rule?

The `@typescript-eslint/no-explicit-any` rule is already partially disabled in `eslint.config.js`:
- `@typescript-eslint/no-unused-vars: "off"`
- `@typescript-eslint/no-unused-expressions: "off"`

However, keeping `no-explicit-any` enabled catches real type safety issues. The goal is proper typing, not rule suppression.

### Supabase Type Generation

Some `as any` assertions exist because the Supabase-generated types don't include all tables (like `quests`). Options:
1. Regenerate types with `npx supabase gen types typescript`
2. Create manual type definitions (recommended for this sprint)
3. Use type assertions with proper interfaces

### Error Handler Pattern

The `catch (error: any)` pattern is common but unsafe. The proper pattern:

```typescript
catch (error) {
  // Type guard for Error objects
  if (error instanceof Error) {
    toast({ description: error.message });
    // Future: Sentry.captureException(error);
  } else {
    toast({ description: 'An unexpected error occurred' });
    // Future: Sentry.captureMessage('Unknown error type', { extra: { error } });
  }
}
```

---

## Implementation Order

1. **Create type files first** - Foundation for all fixes
2. **Fix useSearch.ts** - Cascades to SearchResults.tsx
3. **Fix utility functions** - Cascades to Profile.tsx and hooks
4. **Fix error handlers** - Pattern-based, can be done in parallel
5. **Fix remaining components** - Lower priority, incremental

