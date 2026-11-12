ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS is_special boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS reward_description text;

CREATE OR REPLACE FUNCTION public.validate_quest_window()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL AND NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'A special quest must end after it starts';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_quest_window ON public.quests;
CREATE TRIGGER trg_validate_quest_window BEFORE INSERT OR UPDATE ON public.quests FOR EACH ROW EXECUTE FUNCTION public.validate_quest_window();

ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_category_check;
ALTER TABLE public.badges ADD CONSTRAINT badges_category_check CHECK (category = ANY (ARRAY['fact_checker','community_reporter','policy_analyst','voting_champion','civic_educator','quest_milestone','civic_action_milestone']));

UPDATE public.badges SET is_active = false WHERE category NOT IN ('quest_milestone','civic_action_milestone');

INSERT INTO public.badges (name, description, icon, category, tier, requirements, points_reward, is_active)
SELECT v.name, v.description, v.icon, v.category, v.tier, v.req::jsonb, v.pts, true
FROM (VALUES
  ('Quest Starter','Completed your first quest','🎯','quest_milestone','bronze','{"action":"quest_completed","count":1}',10),
  ('Quest Regular','Completed 5 quests','🏅','quest_milestone','silver','{"action":"quest_completed","count":5}',50),
  ('Quest Legend','Completed 15 quests','🏆','quest_milestone','gold','{"action":"quest_completed","count":15}',150),
  ('First Action','Took your first civic action','✊','civic_action_milestone','bronze','{"action":"civic_action","count":1}',10),
  ('Action Taker','Took 5 civic actions','📣','civic_action_milestone','silver','{"action":"civic_action","count":5}',50),
  ('Community Champion','Took 10 civic actions','🦁','civic_action_milestone','gold','{"action":"civic_action","count":10}',150)
) AS v(name, description, icon, category, tier, req, pts)
WHERE NOT EXISTS (SELECT 1 FROM public.badges b WHERE b.name = v.name);

CREATE OR REPLACE FUNCTION public.award_milestone_badges(p_user_id uuid, p_category text, p_count integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_badges (user_id, badge_id, progress)
  SELECT p_user_id, b.id, p_count FROM badges b
  WHERE b.category = p_category AND b.is_active AND (b.requirements->>'count')::int <= p_count
  ON CONFLICT (user_id, badge_id) DO UPDATE SET progress = EXCLUDED.progress;
END $$;
REVOKE ALL ON FUNCTION public.award_milestone_badges(uuid, text, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_badge_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.action_type = 'quest_completed' THEN
    PERFORM award_milestone_badges(NEW.user_id, 'quest_milestone',
      (SELECT count(*)::int FROM user_quests WHERE user_id = NEW.user_id AND status = 'completed'));
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.check_badge_progress() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.award_civic_action_badges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM award_milestone_badges(NEW.user_id, 'civic_action_milestone',
      (SELECT count(*)::int FROM civic_actions WHERE user_id = NEW.user_id));
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.award_civic_action_badges() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS award_civic_action_badges ON public.civic_actions;
CREATE TRIGGER award_civic_action_badges AFTER INSERT ON public.civic_actions FOR EACH ROW EXECUTE FUNCTION public.award_civic_action_badges();

-- Backfill for people who already reached milestones
SELECT public.award_milestone_badges(u.user_id, 'quest_milestone', u.n)
FROM (SELECT user_id, count(*)::int n FROM user_quests WHERE status='completed' GROUP BY user_id) u
WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.user_id);
SELECT public.award_milestone_badges(c.user_id, 'civic_action_milestone', c.n)
FROM (SELECT user_id, count(*)::int n FROM civic_actions WHERE user_id IS NOT NULL GROUP BY user_id) c
WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = c.user_id);