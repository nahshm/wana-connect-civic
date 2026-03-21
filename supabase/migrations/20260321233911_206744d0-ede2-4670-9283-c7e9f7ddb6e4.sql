
-- Add broadcast targeting and media columns to crisis_reports
ALTER TABLE public.crisis_reports
  ADD COLUMN IF NOT EXISTS target_scope TEXT NOT NULL DEFAULT 'platform_wide',
  ADD COLUMN IF NOT EXISTS target_community_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reference_links TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS broadcast_by UUID REFERENCES public.profiles(id);

-- Add constraint for valid target_scope values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crisis_reports_target_scope_check'
  ) THEN
    ALTER TABLE public.crisis_reports
      ADD CONSTRAINT crisis_reports_target_scope_check
      CHECK (target_scope IN ('platform_wide', 'geographic'));
  END IF;
END $$;

-- Create storage bucket for crisis media/documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('crisis-media', 'crisis-media', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- RLS: Admins can upload to crisis-media
CREATE POLICY "Admins can upload crisis media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'crisis-media'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- RLS: Admins can read crisis media
CREATE POLICY "Admins can read crisis media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'crisis-media'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- RLS: Authenticated users can read crisis media (for broadcast visibility)
CREATE POLICY "Authenticated users can view crisis media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'crisis-media');

-- RLS: Admins can delete crisis media
CREATE POLICY "Admins can delete crisis media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'crisis-media'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
