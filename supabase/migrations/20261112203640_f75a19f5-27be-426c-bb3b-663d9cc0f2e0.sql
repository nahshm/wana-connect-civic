-- Office summary: rebuild on the single promises list
DROP MATERIALIZED VIEW IF EXISTS public.office_dashboard_snapshot;
CREATE MATERIALIZED VIEW public.office_dashboard_snapshot AS
SELECT gp.id AS position_id, gp.position_code, gp.jurisdiction_name, gp.governance_level,
  count(DISTINCT op.id) AS promises_total,
  count(DISTINCT op.id) FILTER (WHERE op.status = 'completed') AS promises_completed,
  count(DISTINCT oq.id) AS questions_total,
  count(DISTINCT oq.id) FILTER (WHERE oq.answer IS NOT NULL) AS questions_answered,
  count(DISTINCT proj.id) AS projects_total,
  count(DISTINCT al.id) FILTER (WHERE al.created_at > now() - interval '30 days') AS activity_last_30d,
  now() AS refreshed_at
FROM government_positions gp
LEFT JOIN office_promises op ON op.office_holder_id IN (SELECT id FROM office_holders WHERE position_id = gp.id AND is_active = true)
LEFT JOIN office_questions oq ON oq.office_holder_id IN (SELECT id FROM office_holders WHERE position_id = gp.id AND is_active = true)
LEFT JOIN government_projects proj ON proj.county::text = gp.jurisdiction_name::text OR proj.constituency::text = gp.jurisdiction_name::text OR proj.ward::text = gp.jurisdiction_name::text
LEFT JOIN office_activity_log al ON al.office_holder_id IN (SELECT id FROM office_holders WHERE position_id = gp.id AND is_active = true)
GROUP BY gp.id, gp.position_code, gp.jurisdiction_name, gp.governance_level;
CREATE UNIQUE INDEX idx_office_dashboard_snapshot_position_id ON public.office_dashboard_snapshot (position_id);
REVOKE ALL ON public.office_dashboard_snapshot FROM anon, authenticated;
GRANT SELECT ON public.office_dashboard_snapshot TO service_role;

-- Comment references now point at office promises
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_referenced_promise_id_fkey;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid='public.comments'::regclass AND confrelid='public.development_promises'::regclass LOOP
    EXECUTE format('ALTER TABLE public.comments DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE public.comments ADD CONSTRAINT comments_referenced_promise_id_fkey FOREIGN KEY (referenced_promise_id) REFERENCES public.office_promises(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.create_comment_references()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  DELETE FROM public.comment_references WHERE comment_id = NEW.id;
  IF NEW.referenced_promise_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT NEW.id, 'promise', NEW.referenced_promise_id, op.title, '/promises/' || NEW.referenced_promise_id
    FROM public.office_promises op WHERE op.id = NEW.referenced_promise_id;
  END IF;
  IF NEW.referenced_project_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT NEW.id, 'project', NEW.referenced_project_id, gp.title, '/projects/' || NEW.referenced_project_id
    FROM public.government_projects gp WHERE gp.id = NEW.referenced_project_id;
  END IF;
  IF NEW.is_official_response = true AND NEW.official_verification_id IS NOT NULL THEN
    INSERT INTO public.comment_references (comment_id, reference_type, reference_id, reference_title, reference_url)
    SELECT NEW.id, 'official', NEW.official_verification_id, o.name || ' (' || o.position || ')', '/officials/' || NEW.official_verification_id
    FROM public.officials o WHERE o.id = NEW.official_verification_id;
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.create_civic_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  INSERT INTO public.comment_notifications (comment_id, recipient_id, notification_type, title, message, action_url)
  SELECT NEW.id, p.author_id, 'post_comment', 'New comment on your post', substring(NEW.content, 1, 100) || '...', '/posts/' || NEW.post_id || '#comment-' || NEW.id
  FROM public.posts p WHERE p.id = NEW.post_id AND p.author_id != NEW.author_id;

  INSERT INTO public.comment_notifications (comment_id, recipient_id, notification_type, title, message, action_url)
  SELECT NEW.id, pf.user_id, 'followed_post_update', 'New comment on a post you follow', substring(NEW.content, 1, 100) || '...', '/posts/' || NEW.post_id || '#comment-' || NEW.id
  FROM public.post_follows pf JOIN public.posts p ON p.id = pf.post_id
  WHERE pf.post_id = NEW.post_id AND pf.user_id != NEW.author_id AND pf.user_id != p.author_id;

  IF NEW.referenced_promise_id IS NOT NULL THEN
    INSERT INTO public.comment_notifications (comment_id, recipient_id, notification_type, title, message, action_url)
    SELECT NEW.id, oh.user_id, 'promise_mentioned', 'Your promise was mentioned in a comment',
      'A comment referenced your promise: ' || substring(NEW.content, 1, 100) || '...', '/posts/' || NEW.post_id || '#comment-' || NEW.id
    FROM public.office_promises op JOIN public.office_holders oh ON oh.id = op.office_holder_id
    WHERE op.id = NEW.referenced_promise_id AND oh.user_id IS NOT NULL AND oh.user_id != NEW.author_id;
  END IF;

  IF NEW.referenced_project_id IS NOT NULL THEN
    INSERT INTO public.comment_notifications (comment_id, recipient_id, notification_type, title, message, action_url)
    SELECT NEW.id, gp.created_by, 'project_mentioned', 'Your project was mentioned in a comment',
      'A comment referenced your government project: ' || substring(NEW.content, 1, 100) || '...', '/projects/' || NEW.referenced_project_id
    FROM public.government_projects gp WHERE gp.id = NEW.referenced_project_id AND gp.created_by != NEW.author_id;
  END IF;
  RETURN NEW;
END; $function$;

-- Drop retired tables
DROP TABLE IF EXISTS public.challenge_votes;
DROP TABLE IF EXISTS public.challenge_submissions;
DROP TABLE IF EXISTS public.challenges;
DROP FUNCTION IF EXISTS public.update_challenge_votes() CASCADE;
DROP TABLE IF EXISTS public.community_poll_votes;
DROP TABLE IF EXISTS public.community_polls;
DROP TABLE IF EXISTS public.community_events;
DROP TABLE IF EXISTS public.development_promises;
DROP TABLE IF EXISTS public.campaign_promises;
DROP FUNCTION IF EXISTS public.development_promises_search_vector_update() CASCADE;