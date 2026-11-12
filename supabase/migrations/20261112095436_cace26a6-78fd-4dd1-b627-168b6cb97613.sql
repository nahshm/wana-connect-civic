-- Notifications: only server-side triggers/functions create them
DROP POLICY IF EXISTS "System can create notifications" ON public.comment_notifications;

-- Chat participants: add yourself, or add others to a room you created
DROP POLICY IF EXISTS "Users can add participants" ON public.chat_participants;
CREATE POLICY "Users can add participants" ON public.chat_participants FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND r.created_by = (SELECT auth.uid())));

-- Communities
DROP POLICY IF EXISTS "Authenticated users can update communities" ON public.communities;
DROP POLICY IF EXISTS "Auth users can create communities" ON public.communities;
CREATE POLICY "Auth users can create communities" ON public.communities FOR INSERT TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Communities publicly readable" ON public.communities;
CREATE POLICY "Communities publicly readable" ON public.communities FOR SELECT
USING (visibility_type IS DISTINCT FROM 'private' OR created_by = (SELECT auth.uid()) OR public.is_admin()
  OR EXISTS (SELECT 1 FROM public.community_members m WHERE m.community_id = communities.id AND m.user_id = (SELECT auth.uid())));

-- Vectors: admins only
DROP POLICY IF EXISTS "Authenticated users can read vectors" ON public.vectors;
CREATE POLICY "Admins can read vectors" ON public.vectors FOR SELECT TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role) OR public.has_role((SELECT auth.uid()), 'super_admin'::app_role));

-- Votes / submissions / analytics / bookmarks: signed-in users only
DROP POLICY IF EXISTS "Users can view votes" ON public.challenge_votes;
CREATE POLICY "Users can view votes" ON public.challenge_votes FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS "Users can view votes" ON public.community_poll_votes;
CREATE POLICY "Users can view votes" ON public.community_poll_votes FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS "Users can view verification votes" ON public.verification_votes;
CREATE POLICY "Users can view verification votes" ON public.verification_votes FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS "Submissions are viewable by everyone" ON public.challenge_submissions;
CREATE POLICY "Submissions are viewable by signed-in users" ON public.challenge_submissions FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS "View channel analytics" ON public.channel_analytics;
CREATE POLICY "View channel analytics" ON public.channel_analytics FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS "View community bookmarks" ON public.community_bookmarks;
CREATE POLICY "View community bookmarks" ON public.community_bookmarks FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

-- Rate limits: managed only by security-definer functions
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;

-- Scorecards & impact scores: writes only server-side
DROP POLICY IF EXISTS "System can manage scorecards" ON public.official_scorecards;
DROP POLICY IF EXISTS "Public can view scorecards" ON public.official_scorecards;
CREATE POLICY "Signed-in users can view scorecards" ON public.official_scorecards FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
DROP POLICY IF EXISTS "System can update impact scores" ON public.civic_impact_scores;
DROP POLICY IF EXISTS "Public can view impact scores" ON public.civic_impact_scores;
CREATE POLICY "Signed-in users can view impact scores" ON public.civic_impact_scores FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);

-- Office proposals
DROP POLICY IF EXISTS "auth_upvote_proposals" ON public.office_proposals;
DROP POLICY IF EXISTS "Anyone can view proposals" ON public.office_proposals;
DROP POLICY IF EXISTS "Public read proposals" ON public.office_proposals;
CREATE POLICY "Signed-in users can view proposals" ON public.office_proposals FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Office holders can respond to proposals" ON public.office_proposals FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.office_holders h WHERE h.position_id = office_proposals.position_id AND h.user_id = (SELECT auth.uid()) AND h.is_active AND h.verification_status = 'verified'))
WITH CHECK (EXISTS (SELECT 1 FROM public.office_holders h WHERE h.position_id = office_proposals.position_id AND h.user_id = (SELECT auth.uid()) AND h.is_active AND h.verification_status = 'verified'));

CREATE OR REPLACE FUNCTION public.upvote_office_proposal(p_proposal_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  UPDATE public.office_proposals SET upvotes = COALESCE(upvotes,0) + 1 WHERE id = p_proposal_id;
END; $$;
REVOKE ALL ON FUNCTION public.upvote_office_proposal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upvote_office_proposal(uuid) TO authenticated;

-- Private buckets: signed-in users only, uploader or admin for sensitive ones
DROP POLICY IF EXISTS "Anyone can view incident media" ON storage.objects;
CREATE POLICY "Owners and admins view incident media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'incident-media' AND (owner_id = (SELECT auth.uid())::text OR public.is_admin()));
DROP POLICY IF EXISTS "Anyone can view chat media" ON storage.objects;
CREATE POLICY "Owners and room members view chat media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media' AND (owner_id = (SELECT auth.uid())::text OR EXISTS (
  SELECT 1 FROM public.chat_participants cp WHERE cp.user_id = (SELECT auth.uid()) AND cp.room_id::text = (storage.foldername(name))[1])));
DROP POLICY IF EXISTS "Anyone can view issue media" ON storage.objects;
CREATE POLICY "Owners and admins view issue media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'issue-media' AND (owner_id = (SELECT auth.uid())::text OR public.is_admin()));
DROP POLICY IF EXISTS "Anyone can view project media" ON storage.objects;
CREATE POLICY "Owners and admins view project media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-media' AND (owner_id = (SELECT auth.uid())::text OR public.is_admin()));
DROP POLICY IF EXISTS "Anyone can view project documents" ON storage.objects;
CREATE POLICY "Owners and admins view project documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-documents' AND (owner_id = (SELECT auth.uid())::text OR public.is_admin()));