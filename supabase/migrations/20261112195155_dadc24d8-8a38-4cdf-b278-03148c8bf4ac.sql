ALTER TABLE public.promise_verifications DROP CONSTRAINT IF EXISTS promise_verifications_promise_id_fkey;
ALTER TABLE public.promise_verifications ADD CONSTRAINT promise_verifications_promise_id_fkey FOREIGN KEY (promise_id) REFERENCES public.office_promises(id) ON DELETE CASCADE;
ALTER TABLE public.promise_updates DROP CONSTRAINT IF EXISTS promise_updates_promise_id_fkey;
ALTER TABLE public.promise_updates ADD CONSTRAINT promise_updates_promise_id_fkey FOREIGN KEY (promise_id) REFERENCES public.office_promises(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.normalize_office_promise_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.status := CASE lower(coalesce(NEW.status, 'pending'))
    WHEN 'not_started' THEN 'pending'
    WHEN 'ongoing' THEN 'in_progress'
    WHEN 'partially_fulfilled' THEN 'in_progress'
    WHEN 'fulfilled' THEN 'completed'
    WHEN 'kept' THEN 'completed'
    WHEN 'broken' THEN 'failed'
    WHEN 'abandoned' THEN 'failed'
    WHEN 'cancelled' THEN 'failed'
    ELSE lower(NEW.status) END;
  IF NEW.status NOT IN ('pending','in_progress','completed','failed') THEN
    RAISE EXCEPTION 'Invalid promise status %', NEW.status;
  END IF;
  NEW.progress := greatest(0, least(100, coalesce(NEW.progress, 0)));
  IF NEW.status = 'completed' THEN NEW.progress := 100; NEW.completed_at := coalesce(NEW.completed_at, now()); END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_normalize_office_promise_status ON public.office_promises;
CREATE TRIGGER trg_normalize_office_promise_status BEFORE INSERT OR UPDATE ON public.office_promises
FOR EACH ROW EXECUTE FUNCTION public.normalize_office_promise_status();

DROP POLICY IF EXISTS "Admins can manage promises" ON public.office_promises;
CREATE POLICY "Admins can manage promises" ON public.office_promises FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.office_promises TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_promises TO authenticated;
GRANT ALL ON public.office_promises TO service_role;