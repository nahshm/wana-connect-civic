ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS post_mode text NOT NULL DEFAULT 'discussion';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS mode_data jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_posts_post_mode ON public.posts(post_mode);

CREATE OR REPLACE FUNCTION public.validate_post_mode()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.post_mode NOT IN ('discussion','issue','poll','event','guide') THEN
    RAISE EXCEPTION 'Invalid post type %', NEW.post_mode;
  END IF;
  IF NEW.post_mode = 'guide' AND (TG_OP = 'INSERT' OR OLD.post_mode IS DISTINCT FROM 'guide')
     AND (SELECT auth.uid()) IS NOT NULL
     AND NOT (public.is_admin() OR EXISTS (SELECT 1 FROM user_expertise ue WHERE ue.user_id = (SELECT auth.uid()) AND ue.is_verified = true)) THEN
    RAISE EXCEPTION 'Only admins and verified experts can publish guides';
  END IF;
  IF NEW.post_mode = 'poll' AND jsonb_array_length(coalesce(NEW.mode_data->'options','[]'::jsonb)) < 2 THEN
    RAISE EXCEPTION 'A poll needs at least two options';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_post_mode() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_validate_post_mode ON public.posts;
CREATE TRIGGER trg_validate_post_mode BEFORE INSERT OR UPDATE OF post_mode, mode_data ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.validate_post_mode();

CREATE TABLE public.post_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index integer NOT NULL CHECK (option_index >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT ON public.post_poll_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_poll_votes TO authenticated;
GRANT ALL ON public.post_poll_votes TO service_role;
ALTER TABLE public.post_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see poll votes" ON public.post_poll_votes FOR SELECT USING (true);
CREATE POLICY "Users cast their own poll vote" ON public.post_poll_votes FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users change their own poll vote" ON public.post_poll_votes FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users remove their own poll vote" ON public.post_poll_votes FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE TRIGGER update_post_poll_votes_updated_at BEFORE UPDATE ON public.post_poll_votes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Copy old polls & events into the feed (idempotent via legacy id)
INSERT INTO public.posts (title, content, author_id, community_id, post_mode, mode_data, created_at)
SELECT cp.question, '', cp.created_by, cp.community_id, 'poll',
  jsonb_build_object('options', cp.options, 'expires_at', cp.expires_at, 'legacy_poll_id', cp.id), cp.created_at
FROM public.community_polls cp
WHERE cp.created_by IS NOT NULL AND jsonb_array_length(coalesce(cp.options,'[]'::jsonb)) >= 2
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.mode_data->>'legacy_poll_id' = cp.id::text);

INSERT INTO public.post_poll_votes (post_id, user_id, option_index, created_at)
SELECT p.id, v.user_id, v.option_index, v.created_at
FROM public.community_poll_votes v
JOIN public.posts p ON p.mode_data->>'legacy_poll_id' = v.poll_id::text
WHERE EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = v.user_id)
ON CONFLICT (post_id, user_id) DO NOTHING;

INSERT INTO public.posts (title, content, author_id, community_id, post_mode, mode_data, created_at)
SELECT ce.title, coalesce(ce.description,''), ce.created_by, ce.community_id, 'event',
  jsonb_build_object('start_time', ce.start_time, 'end_time', ce.end_time, 'location_type', ce.location_type, 'location', ce.location_data, 'legacy_event_id', ce.id), ce.created_at
FROM public.community_events ce
WHERE ce.created_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.mode_data->>'legacy_event_id' = ce.id::text);

-- Feed: add mode filter and clips
DROP FUNCTION IF EXISTS public.get_unified_feed(uuid, integer, integer, text, uuid, boolean);
CREATE FUNCTION public.get_unified_feed(p_user_id uuid DEFAULT NULL, p_limit_count integer DEFAULT 10, p_offset_count integer DEFAULT 0, p_sort_by text DEFAULT 'newest', p_community_id uuid DEFAULT NULL, p_verified_only boolean DEFAULT false, p_mode text DEFAULT 'all')
RETURNS TABLE(id uuid, type text, data jsonb, created_at timestamptz, user_id uuid, username text, avatar_url text)
LANGUAGE plpgsql STABLE SET search_path = public AS $function$
BEGIN
  RETURN QUERY
  WITH combined_feed AS (
    SELECT p.id,
      CASE WHEN cc.id IS NOT NULL THEN 'clip' ELSE 'post' END::text AS type,
      p.author_id AS user_id, prof.username, prof.avatar_url, p.created_at,
      (jsonb_build_object(
        'id', p.id, 'title', p.title, 'content', p.content, 'content_type', p.content_type,
        'post_mode', p.post_mode, 'mode_data', p.mode_data,
        'community_id', p.community_id, 'community_name', c.name, 'community_display_name', c.display_name, 'community_icon', c.avatar_url,
        'upvotes', p.upvotes, 'downvotes', p.downvotes, 'comment_count', p.comment_count,
        'author_id', p.author_id, 'author_is_verified', prof.is_verified, 'author_official_position', prof.official_position,
        'created_at', p.created_at, 'tags', p.tags, 'content_sensitivity', p.content_sensitivity, 'is_ngo_verified', p.is_ngo_verified,
        'link_url', p.link_url, 'link_title', p.link_title, 'link_description', p.link_description, 'link_image', p.link_image,
        'media', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', pm.id, 'file_path', pm.file_path, 'file_type', pm.file_type)), '[]'::jsonb) FROM post_media pm WHERE pm.post_id = p.id)
      ) || CASE WHEN cc.id IS NOT NULL THEN jsonb_build_object(
        'clip_id', cc.id, 'description', p.content, 'video_url', cc.video_url, 'thumbnail_url', cc.thumbnail_url,
        'aspect_ratio', cc.aspect_ratio, 'duration', cc.duration, 'views_count', cc.views_count, 'author_name', coalesce(prof.display_name, prof.username)
      ) ELSE '{}'::jsonb END) AS data,
      (COALESCE(p.upvotes,0) - COALESCE(p.downvotes,0))::numeric AS score,
      ((GREATEST(COALESCE(p.upvotes,0) - COALESCE(p.downvotes,0), 0) + 1) * EXP(-0.003 * EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600))::numeric AS hot_score,
      COALESCE(p.comment_count,0)::numeric AS activity_count,
      CASE WHEN cc.id IS NOT NULL THEN 'clips' WHEN p.post_mode = 'issue' THEN 'issues' ELSE 'discussions' END AS bucket
    FROM posts p
    LEFT JOIN LATERAL (SELECT x.* FROM civic_clips x WHERE x.post_id = p.id AND coalesce(x.processing_status,'completed') <> 'failed' ORDER BY x.created_at LIMIT 1) cc ON true
    LEFT JOIN profiles prof ON prof.id = p.author_id
    LEFT JOIN communities c ON c.id = p.community_id
    WHERE p.is_hidden IS NOT TRUE
      AND (p_community_id IS NULL OR p.community_id = p_community_id)
      AND (p_verified_only IS FALSE OR prof.is_verified IS TRUE)
    UNION ALL
    SELECT pr.id, 'project'::text, pr.created_by, prof.username, prof.avatar_url, pr.created_at,
      jsonb_build_object('id', pr.id, 'name', pr.title, 'description', pr.description, 'status', pr.status, 'location', pr.location,
        'county', pr.county, 'constituency', pr.constituency, 'ward', pr.ward, 'budget', pr.budget_allocated,
        'completion_percentage', pr.progress_percentage, 'submitted_by', pr.created_by, 'created_at', pr.created_at, 'media_urls', pr.media_urls),
      0::numeric, 0::numeric, 0::numeric, 'issues'
    FROM government_projects pr LEFT JOIN profiles prof ON pr.created_by = prof.id
    WHERE p_community_id IS NULL AND p_verified_only IS FALSE
    UNION ALL
    SELECT fa.id, fa.activity_type, fa.user_id, prof.username, prof.avatar_url, fa.created_at,
      jsonb_build_object('id', fa.id, 'activity_type', fa.activity_type, 'target_id', fa.target_id, 'target_type', fa.target_type,
        'metadata', fa.metadata, 'user_id', fa.user_id, 'created_at', fa.created_at),
      0::numeric, 0::numeric, 0::numeric, 'activity'
    FROM feed_activities fa LEFT JOIN profiles prof ON fa.user_id = prof.id
    WHERE fa.is_public = true AND p_community_id IS NULL AND p_verified_only IS FALSE
  )
  SELECT cf.id, cf.type, cf.data, cf.created_at, cf.user_id, cf.username, cf.avatar_url
  FROM combined_feed cf
  WHERE coalesce(p_mode,'all') = 'all' OR cf.bucket = p_mode
  ORDER BY
    CASE WHEN p_sort_by IN ('newest','new') THEN cf.created_at END DESC,
    CASE WHEN p_sort_by = 'top' THEN cf.score END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'hot' THEN cf.hot_score END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'rising' THEN cf.activity_count END DESC NULLS LAST,
    cf.created_at DESC
  LIMIT p_limit_count OFFSET p_offset_count;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_unified_feed(uuid, integer, integer, text, uuid, boolean, text) TO anon, authenticated, service_role;