
## Plan: Profile Recovery System for Missing Profiles

### Problem Analysis

The user `ba07274d-aa96-4fc1-bc4e-5e5c9b379259` exists in `auth.users` but has **no corresponding profile** in the `profiles` table. This causes:

1. **Console Error**: "Profile not found for user: ba07274d-aa96-4fc1-bc4e-5e5c9b379259"
2. **Infinite Loading**: The `useOnboarding` hook sets `loading: true` when profile is null, causing `OnboardingGuard` to show endless spinner
3. **No Recovery Path**: Users have no way to fix this state - they're stuck

**Root Cause**: The `handle_new_user()` trigger exists but may have failed silently during signup, or the profile was accidentally deleted.

---

### Solution Overview

Create a **ProfileRecovery system** that:
1. Detects missing profiles for authenticated users
2. Shows a friendly recovery UI instead of infinite loading
3. Allows users to recreate their profile and proceed to onboarding

---

### Phase 1: Create Profile Recovery Component

**Create `src/components/auth/ProfileRecovery.tsx`**

A dedicated component shown when a user is authenticated but has no profile:

```text
┌────────────────────────────────────────────┐
│                                            │
│         🔧 Profile Setup Required          │
│                                            │
│  We couldn't find your profile. This can  │
│  happen if something went wrong during    │
│  signup.                                   │
│                                            │
│  [ Create My Profile ]  [ Sign Out ]       │
│                                            │
│  ───────────────────────────────────────   │
│  Technical details (for support)           │
│  User ID: ba07274d-...                     │
└────────────────────────────────────────────┘
```

Features:
- Friendly messaging explaining the situation
- "Create My Profile" button that creates a minimal profile row
- "Sign Out" option if user wants to try a different account
- Technical details (collapsible) for support

---

### Phase 2: Update AuthContext to Track Profile State

**Modify `src/contexts/AuthContext.tsx`**

Add a new state to distinguish between:
- `profileLoading: true` - Still fetching profile
- `profileMissing: true` - Fetch complete, no profile found
- `profile: Profile` - Profile exists and loaded

Changes:
```typescript
interface AuthContextType {
  // ... existing fields
  profileMissing: boolean;  // NEW: true if user exists but profile doesn't
  createMissingProfile: () => Promise<{ error: any }>;  // NEW: recovery function
}
```

Update `fetchProfile()`:
```typescript
const fetchProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfileMissing(true);  // NEW
      return;
    }

    if (!data) {
      console.warn('Profile not found for user:', userId);
      setProfileMissing(true);  // NEW: Mark as missing instead of just returning
      return;
    }

    setProfileMissing(false);  // NEW
    // ... rest of profile mapping
  } catch (error) {
    setProfileMissing(true);  // NEW
  }
};
```

Add `createMissingProfile()` function:
```typescript
const createMissingProfile = async () => {
  if (!user) return { error: { message: 'No user found' } };
  
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
    display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (!error) {
    await fetchProfile(user.id);  // Refetch to update state
  }
  
  return { error };
};
```

---

### Phase 3: Update OnboardingGuard to Handle Missing Profiles

**Modify `src/components/routing/OnboardingGuard.tsx`**

Add a check for missing profiles and show `ProfileRecovery` component:

```typescript
import { ProfileRecovery } from '@/components/auth/ProfileRecovery';

export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const { user, profile, profileMissing, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboarding();
  
  // ... existing code

  // NEW: Show recovery UI if profile is missing
  if (!authLoading && user && profileMissing) {
    return <ProfileRecovery />;
  }

  // ... rest of existing code
};
```

---

### Phase 4: Update useOnboarding Hook

**Modify `src/hooks/useOnboarding.ts`**

Handle the `profileMissing` state to prevent infinite loading:

```typescript
export const useOnboarding = () => {
  const { user, profile, profileMissing, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    // NEW: If profile is missing, don't keep loading forever
    if (profileMissing) {
      setNeedsOnboarding(true);  // Will need onboarding after profile is created
      setLoading(false);
      return;
    }

    if (profile) {
      setNeedsOnboarding(!profile.onboardingCompleted);
      setLoading(false);
    } else {
      // Profile still loading
      setLoading(true);
    }
  }, [user, profile, profileMissing, authLoading]);

  return { needsOnboarding, loading };
};
```

---

### Phase 5: Add Error Boundary for Profile Pages

**Modify `src/features/profile/pages/ProfileV2.tsx`**

Enhance the existing error handling to provide recovery options:

The file already has an `ErrorBoundary` wrapper and handles missing profiles with a "User not found" message. We'll enhance it to:
- Detect if the missing profile is the current user's own profile
- Show recovery option if so

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/auth/ProfileRecovery.tsx` | Recovery UI for missing profiles |

### Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | Add `profileMissing` state, `createMissingProfile()` function |
| `src/components/routing/OnboardingGuard.tsx` | Show `ProfileRecovery` when profile missing |
| `src/hooks/useOnboarding.ts` | Handle `profileMissing` state |

---

### Technical Details

**Why the trigger failed:**
The `on_auth_user_created` trigger exists and is enabled (`tgenabled: O`), but may have failed due to:
- Unique constraint violation (duplicate username)
- Database timeout during signup
- Network issue between auth and database

**Recovery logic:**
1. User logs in → AuthContext fetches profile
2. Profile not found → Set `profileMissing: true`
3. OnboardingGuard detects `profileMissing` → Show `ProfileRecovery`
4. User clicks "Create Profile" → Insert minimal profile row
5. Profile created → Redirect to onboarding flow
6. User completes onboarding → Normal app access

**Edge cases handled:**
- User trying to visit protected routes with missing profile
- Multiple recovery attempts (uses `ON CONFLICT DO NOTHING`)
- Username collision (generates unique fallback)
