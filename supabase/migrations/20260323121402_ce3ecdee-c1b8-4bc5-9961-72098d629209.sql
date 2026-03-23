-- RLS policies for data_sources: admin CRUD
CREATE POLICY "Admins can insert data_sources" ON public.data_sources
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update data_sources" ON public.data_sources
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete data_sources" ON public.data_sources
  FOR DELETE TO authenticated USING (public.is_admin());

-- agent_runs: admin insert
CREATE POLICY "Admins can insert agent_runs" ON public.agent_runs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- agent_events: admin insert
CREATE POLICY "Admins can insert agent_events" ON public.agent_events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());