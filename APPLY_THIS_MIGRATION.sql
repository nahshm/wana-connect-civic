-- APPLY THIS SQL IN SUPABASE DASHBOARD SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/zcnjpczplkbdmmovlrtv/sql/new

-- Fix Storage RLS policies for community-assets bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own community assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own community assets" ON storage.objects;

CREATE POLICY "Community assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-assets');

CREATE POLICY "Authenticated users can upload community assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-assets');

CREATE POLICY "Users can update their own community assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-assets' AND
  (storage.foldername(name))[1] = 'communities'
);

CREATE POLICY "Users can delete their own community assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-assets' AND
  (storage.foldername(name))[1] = 'communities'
);

-- Fix infinite recursion in community_moderators RLS policies
DROP POLICY IF EXISTS "Moderators are viewable by everyone" ON community_moderators;
DROP POLICY IF EXISTS "Users can become moderators if invited" ON community_moderators;
DROP POLICY IF EXISTS "Moderators can update their own record" ON community_moderators;
DROP POLICY IF EXISTS "Admins can manage moderators" ON community_moderators;

CREATE POLICY "Moderators are viewable by everyone"
ON community_moderators FOR SELECT
USING (true);

CREATE POLICY "Users can become moderators if invited"
ON community_moderators FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Moderators can update their own record"
ON community_moderators FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage moderators"
ON community_moderators FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM community_moderators cm
    WHERE cm.community_id = community_moderators.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
    LIMIT 1
  )
);

COMMENT ON POLICY "Moderators are viewable by everyone" ON community_moderators IS 
'Simple SELECT policy without recursion - everyone can view moderators';

COMMENT ON POLICY "Admins can manage moderators" ON community_moderators IS 
'Uses LIMIT 1 to prevent infinite recursion in policy checks';
