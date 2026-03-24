-- Switch vectors table from 1536-dim embeddings to Jina v3's 1024-dim embeddings
-- Preserve existing rows by truncating stored vectors to the first 1024 dimensions.

DROP INDEX IF EXISTS public.vectors_embedding_idx;

ALTER TABLE public.vectors
ALTER COLUMN embedding TYPE vector(1024)
USING (
  CASE
    WHEN embedding IS NULL THEN NULL
    ELSE subvector(embedding, 1, 1024)::vector(1024)
  END
);

CREATE INDEX vectors_embedding_idx
ON public.vectors
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON COLUMN public.vectors.embedding IS 'Jina embeddings v3 vector (1024 dimensions)';