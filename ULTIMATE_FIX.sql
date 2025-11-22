-- ULTIMATE RECURSION FIX - Fix ALL related tables
-- This checks profiles, community_moderators, and communities tables

-- 1. Fix PROFILES table (likely source of recursion)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Simple, non-recursive policies for profiles
CREATE POLICY "Profiles are publicly readable"
ON profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2. Re-confirm community_moderators policies are clean
DROP POLICY IF EXISTS "Public read access to moderators" ON community_moderators;
DROP POLICY IF EXISTS "Authenticated can insert moderators" ON community_moderators;
DROP POLICY IF EXISTS "Users can update own moderator record" ON community_moderators;
DROP POLICY IF EXISTS "Users can delete own moderator record" ON community_moderators;

CREATE POLICY "Moderators publicly viewable"
ON community_moderators FOR SELECT
TO public
USING (true);

CREATE POLICY "Auth users can add moderators"
ON community_moderators FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users update own mod record"
ON community_moderators FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users delete own mod record"
ON community_moderators FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 3. Check communities table policies
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON communities;
DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
DROP POLICY IF EXISTS "Community creators can update their communities" ON communities;

CREATE POLICY "Communities publicly readable"
ON communities FOR SELECT
TO public
USING (true);

CREATE POLICY "Auth users can create communities"
ON communities FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Creators can update communities"
ON communities FOR UPDATE
TO authenticated
USING (created_by = auth.uid());
