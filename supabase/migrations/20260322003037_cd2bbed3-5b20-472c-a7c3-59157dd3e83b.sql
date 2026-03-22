-- Allow users to delete their own civic actions (only submitted status)
CREATE POLICY "Users can delete own submitted civic_actions"
ON public.civic_actions FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  AND status = 'submitted'
);

-- Allow users to delete their own open incidents
CREATE POLICY "Users can delete own open incidents"
ON public.incidents FOR DELETE TO authenticated
USING (
  reporter_id = auth.uid()
  AND status = 'open'
);