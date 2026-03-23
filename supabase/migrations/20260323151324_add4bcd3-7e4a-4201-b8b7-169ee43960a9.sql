CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient RECORD;
  sender_name TEXT;
  room_name TEXT;
BEGIN
  SELECT COALESCE(display_name, username, 'Someone')
  INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  SELECT name
  INTO room_name
  FROM public.chat_rooms
  WHERE id = NEW.room_id;

  FOR recipient IN
    SELECT cp.user_id
    FROM public.chat_participants cp
    WHERE cp.room_id = NEW.room_id
      AND cp.user_id != NEW.sender_id
  LOOP
    INSERT INTO public.comment_notifications (
      recipient_id,
      notification_type,
      title,
      message,
      action_url,
      metadata,
      is_read
    )
    VALUES (
      recipient.user_id,
      'chat_message',
      COALESCE(room_name, sender_name, 'New message'),
      sender_name || ': ' || LEFT(NEW.content, 80),
      '/chat',
      jsonb_build_object(
        'room_id', NEW.room_id,
        'sender_id', NEW.sender_id,
        'sender_name', sender_name
      ),
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_chat_message_notify ON public.chat_messages;
CREATE TRIGGER on_chat_message_notify
AFTER INSERT ON public.chat_messages
FOR EACH ROW
WHEN (NEW.room_id IS NOT NULL)
EXECUTE FUNCTION public.notify_chat_message();