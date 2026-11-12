ALTER TABLE public.baraza_spaces
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS provider text;
CREATE INDEX IF NOT EXISTS baraza_spaces_channel_idx ON public.baraza_spaces(channel_id, scheduled_start DESC);
CREATE OR REPLACE FUNCTION public.validate_baraza_space() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.external_url IS NOT NULL AND NEW.external_url !~* '^https://' THEN
    RAISE EXCEPTION 'Live room link must start with https://';
  END IF;
  IF NEW.provider IS NOT NULL AND NEW.provider NOT IN ('zoom','x_spaces','google_meet','other') THEN
    RAISE EXCEPTION 'Unknown provider';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_baraza_space_trg ON public.baraza_spaces;
CREATE TRIGGER validate_baraza_space_trg BEFORE INSERT OR UPDATE ON public.baraza_spaces FOR EACH ROW EXECUTE FUNCTION public.validate_baraza_space();
GRANT SELECT ON public.baraza_spaces TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.baraza_spaces TO authenticated;
GRANT ALL ON public.baraza_spaces TO service_role;