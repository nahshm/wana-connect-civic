-- Create storage buckets for issue and incident media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('issue-media', 'issue-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('incident-media', 'incident-media', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- issue-media policies
DO $$ BEGIN
CREATE POLICY "Anyone can view issue media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'issue-media');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Authenticated users can upload issue media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'issue-media' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can delete their own issue media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'issue-media' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- incident-media policies
DO $$ BEGIN
CREATE POLICY "Anyone can view incident media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'incident-media');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Authenticated users can upload incident media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident-media');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Anon users can upload incident media"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'incident-media' AND (storage.foldername(name))[1] = 'anon');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;