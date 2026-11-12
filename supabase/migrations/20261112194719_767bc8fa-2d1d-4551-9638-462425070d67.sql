CREATE OR REPLACE FUNCTION public.set_office_banner(p_position_id uuid, p_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_url IS NOT NULL AND p_url !~ '^https://' THEN RAISE EXCEPTION 'Invalid banner URL'; END IF;
  IF NOT (public.is_admin() OR EXISTS (
    SELECT 1 FROM office_holders oh WHERE oh.position_id = p_position_id
      AND oh.user_id = (SELECT auth.uid()) AND oh.is_active = true AND oh.verification_status = 'verified'))
  THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE government_positions SET banner_url = p_url WHERE id = p_position_id;
END $$;

CREATE OR REPLACE FUNCTION public.set_institution_banner(p_institution_id uuid, p_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_url IS NOT NULL AND p_url !~ '^https://' THEN RAISE EXCEPTION 'Invalid banner URL'; END IF;
  IF NOT (public.is_admin() OR EXISTS (
    SELECT 1 FROM institution_handlers h WHERE h.institution_id = p_institution_id
      AND h.user_id = (SELECT auth.uid()) AND h.status = 'active'))
  THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE government_institutions SET banner_url = p_url WHERE id = p_institution_id;
END $$;

REVOKE ALL ON FUNCTION public.set_office_banner(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_institution_banner(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_office_banner(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_institution_banner(uuid, text) TO authenticated;