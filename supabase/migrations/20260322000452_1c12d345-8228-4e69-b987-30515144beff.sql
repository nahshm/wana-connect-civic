ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_posts_author_pinned ON public.posts (author_id, is_pinned) WHERE is_pinned = true;