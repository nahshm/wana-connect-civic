-- Add moderation_status to posts and channel_messages

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'unmoderated';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_timestamp TIMESTAMPTZ;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'unmoderated';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS moderation_timestamp TIMESTAMPTZ;
