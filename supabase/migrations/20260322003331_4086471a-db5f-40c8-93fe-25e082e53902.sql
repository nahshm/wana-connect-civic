-- Allow users to delete their own unverified government projects
CREATE POLICY "Users can delete own unverified projects"
ON public.government_projects FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  AND is_verified = false
);