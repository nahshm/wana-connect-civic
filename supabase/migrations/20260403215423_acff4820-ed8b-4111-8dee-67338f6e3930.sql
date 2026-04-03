
-- =============================================
-- P0: Fix Critical RLS Policies
-- =============================================

-- 1. community_moderators: only existing admins can add moderators
DROP POLICY IF EXISTS "allow_insert_moderators" ON community_moderators;
DROP POLICY IF EXISTS "Authenticated users can join as moderators" ON community_moderators;
CREATE POLICY "admins_insert_moderators" ON community_moderators
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_moderators cm
      WHERE cm.community_id = community_moderators.community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- 2. verifications: restrict updates to authenticated only
DROP POLICY IF EXISTS "Verifications can be updated by system" ON verifications;
CREATE POLICY "verifications_update_authenticated" ON verifications
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. office_proposals: restrict updates to authenticated only
DROP POLICY IF EXISTS "Anyone can upvote proposals" ON office_proposals;
CREATE POLICY "auth_upvote_proposals" ON office_proposals
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. chat_messages: remove blanket public read (participant-scoped policy remains)
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;

-- 5. agent_proposals: restrict to admin only
DROP POLICY IF EXISTS "agent_proposals_authenticated_all" ON agent_proposals;
DROP POLICY IF EXISTS "Authenticated users can manage agent proposals" ON agent_proposals;
CREATE POLICY "agent_proposals_admin_only" ON agent_proposals
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. agent_state: restrict to admin only
DROP POLICY IF EXISTS "agent_state_authenticated_all" ON agent_state;
DROP POLICY IF EXISTS "Authenticated users can manage agent state" ON agent_state;
CREATE POLICY "agent_state_admin_only" ON agent_state
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- P1: Fix Privacy Leaks — scope to owner
-- =============================================

-- community_visits
DROP POLICY IF EXISTS "View community visits" ON community_visits;
DROP POLICY IF EXISTS "Anyone can view community visits" ON community_visits;
CREATE POLICY "own_community_visits" ON community_visits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- project_views
DROP POLICY IF EXISTS "Anyone can view project views" ON project_views;
CREATE POLICY "own_project_views" ON project_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- civic_clip_views
DROP POLICY IF EXISTS "Users can view all clip views" ON civic_clip_views;
CREATE POLICY "own_clip_views" ON civic_clip_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- P2: Atomic Comment Count RPC
-- =============================================

CREATE OR REPLACE FUNCTION increment_comment_count(p_post_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = p_post_id;
$$;
