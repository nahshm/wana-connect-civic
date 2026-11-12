DROP POLICY IF EXISTS "Owners and room members view chat media" ON storage.objects;
CREATE POLICY "Owners and message viewers view chat media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media' AND (
  owner_id = (SELECT auth.uid())::text
  OR EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.media_urls @> ARRAY[storage.objects.name])
));
CREATE INDEX IF NOT EXISTS chat_messages_media_urls_gin ON public.chat_messages USING gin (media_urls);