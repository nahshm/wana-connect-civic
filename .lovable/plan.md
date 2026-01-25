
## Plan: Fix Infinite Recursion in Profiles RLS Policies

### Problem Analysis

The `profiles` table has an RLS policy that causes **infinite recursion**:

**Problematic Policy: `Only platform admins can update admin status`**
```sql
qual: ((SELECT auth.uid()) = id) OR (EXISTS (
  SELECT 1 FROM profiles profiles_1 
  WHERE profiles_1.id = (SELECT auth.uid()) 
    AND profiles_1.is_platform_admin = true
))
```

This policy queries the `profiles` table from within a policy ON the `profiles` table, creating an infinite loop when Postgres evaluates RLS.

### Root Cause

The policy checks `is_platform_admin` by querying the same table it's protecting. Every time Postgres tries to evaluate the policy, it triggers another evaluation of the same policy → infinite recursion.

---

### Solution

Replace the recursive policy with one that uses the existing `is_super_admin()` security definer function, which safely bypasses RLS to check the `user_roles` table.

---

### Database Migration

The following SQL will be executed:

```sql
-- Step 1: Drop the problematic recursive policy
DROP POLICY IF EXISTS "Only platform admins can update admin status" ON public.profiles;

-- Step 2: Recreate with safe, non-recursive logic using security definer function
CREATE POLICY "Only platform admins can update admin status"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- Users can update their own profile
  (SELECT auth.uid()) = id 
  -- OR they are a super_admin (checked via security definer function)
  OR public.is_super_admin((SELECT auth.uid()))
)
WITH CHECK (
  (SELECT auth.uid()) = id 
  OR public.is_super_admin((SELECT auth.uid()))
);
```

---

### Why This Works

1. **`is_super_admin()` is SECURITY DEFINER**: It runs with elevated privileges, bypassing RLS entirely
2. **Queries `user_roles` not `profiles`**: Breaks the recursion cycle
3. **Proper role separation**: Uses the dedicated `user_roles` table instead of the `is_platform_admin` column
4. **Optimized with SELECT wrapper**: `(SELECT auth.uid())` prevents per-row re-evaluation

---

### Files Changed

| Change | Description |
|--------|-------------|
| Database Migration | Drop and recreate the problematic policy |

---

### Verification

After the migration, the following query should return the updated policy without any self-referencing `profiles` subquery:

```sql
SELECT policyname, qual FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%admin%';
```

---

### Future Consideration

The `is_platform_admin` column on the `profiles` table is now redundant since roles are properly managed in the `user_roles` table. In a future cleanup task, this column could be deprecated and removed.
