-- Keep the one forum thread by copying it into the community feed as a discussion post
INSERT INTO public.posts (title, content, author_id, community_id, created_at, post_mode, mode_data)
SELECT t.title, t.content, t.author_id, ch.community_id, t.created_at, 'discussion',
       jsonb_build_object('legacy_forum_thread_id', t.id)
FROM public.forum_threads t
LEFT JOIN public.channels ch ON ch.id = t.channel_id
WHERE NOT EXISTS (SELECT 1 FROM public.posts p WHERE p.mode_data->>'legacy_forum_thread_id' = t.id::text);

ALTER TABLE public.crisis_reports DROP COLUMN IF EXISTS anonymous_report_id;

DROP TABLE IF EXISTS public.forum_reply_reactions;
DROP TABLE IF EXISTS public.forum_thread_reactions;
DROP TABLE IF EXISTS public.forum_replies;
DROP TABLE IF EXISTS public.forum_threads;
DROP TABLE IF EXISTS public.skill_endorsements;
DROP TABLE IF EXISTS public.user_skills;
DROP TABLE IF EXISTS public.skills;
DROP TABLE IF EXISTS public.education_content;
DROP TABLE IF EXISTS public.anonymous_reports;

UPDATE public.quests SET is_active = false
WHERE id IN ('1741b69c-2add-4213-9eff-cb0bc2835446','e1b9b45d-adb2-4a35-8876-1118c5a25e43');