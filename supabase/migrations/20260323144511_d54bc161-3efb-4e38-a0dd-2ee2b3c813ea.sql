-- Fix: Allow users to see participants in rooms they belong to (needed to find existing DMs)
DROP POLICY IF EXISTS "Users can view own participant records" ON chat_participants;
CREATE POLICY "Users can view room participants"
ON chat_participants FOR SELECT TO authenticated
USING (
  public.user_is_room_participant(chat_participants.room_id, (SELECT auth.uid()))
);

-- Allow users to delete rooms they created
CREATE POLICY "Users can delete own rooms"
ON chat_rooms FOR DELETE TO authenticated
USING (created_by = (SELECT auth.uid()));

-- Allow users to remove themselves from rooms (leave chat)
CREATE POLICY "Users can leave rooms"
ON chat_participants FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Trigger: notify on new chat message
CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient RECORD;
  sender_name TEXT;
BEGIN
  SELECT COALESCE(display_name, username, 'Someone') INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;

  FOR recipient IN
    SELECT cp.user_id FROM chat_participants cp
    WHERE cp.room_id = NEW.room_id AND cp.user_id != NEW.sender_id
  LOOP
    INSERT INTO comment_notifications (recipient_id, notification_type, message, action_url)
    VALUES (
      recipient.user_id,
      'chat_message',
      sender_name || ': ' || LEFT(NEW.content, 80),
      '/chat'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_chat_message_notify ON chat_messages;
CREATE TRIGGER on_chat_message_notify
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  WHEN (NEW.room_id IS NOT NULL)
  EXECUTE FUNCTION notify_chat_message();