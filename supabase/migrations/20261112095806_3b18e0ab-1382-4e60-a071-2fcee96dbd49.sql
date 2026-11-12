DROP POLICY IF EXISTS "Users can add participants" ON public.chat_participants;
CREATE POLICY "Room creators can add participants" ON public.chat_participants FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND r.created_by = (SELECT auth.uid())));