

# Agentic AI Redesign: Civic Brain + Civic Router

## Current State & Problems Found

1. **civic-brain is broken** -- Requires `OPENAI_API_KEY` for embeddings but it's NOT in secrets (only `GROQ_API_KEY` and `LOVABLE_API_KEY` exist). Vector search silently fails, making RAG useless.
2. **Only 3 vectors in DB** (all `kenya_constitution`). The knowledge base is empty.
3. **No PDF ingestion pipeline** -- zero infrastructure for uploading/parsing/embedding documents.
4. **CivicChat.tsx follow-up is dead code** -- the Send button has no `onClick` handler wired up.
5. **History schema mismatch** -- CivicChat expects `query`/`answer` fields but DB stores `role`/`content` pairs.
6. **Both functions use Groq directly** instead of Lovable AI Gateway (which is available and preferred).
7. **No streaming** -- responses arrive all at once, poor UX for long answers.

## Architecture Plan

```text
┌─────────────────────────────────────────────────┐
│  FRONTEND                                        │
│  ┌──────────────┐    ┌─────────────────────┐    │
│  │ CivicChat    │    │ ReportIssue         │    │
│  │ (streaming)  │    │ (step wizard)       │    │
│  └──────┬───────┘    └──────────┬──────────┘    │
│         │ SSE stream            │ invoke         │
└─────────┼───────────────────────┼────────────────┘
          ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│  civic-brain     │   │  civic-router    │
│  (Lovable AI)    │   │  (Lovable AI)    │
│  + vector search │   │  + institutions  │
│  + chat history  │   │  + formal letter │
│  + streaming SSE │   │                  │
└────────┬─────────┘   └──────────────────┘
         │
         ▼
┌──────────────────┐   ┌──────────────────┐
│  vectors table   │◄──│  civic-ingest    │
│  (pgvector)      │   │  (PDF → chunks   │
│  + FTS fallback  │   │   → embeddings)  │
└──────────────────┘   └──────────────────┘
```

## Implementation Steps

### Step 1: Add OPENAI_API_KEY Secret
- Required for embedding generation (ada-002 for vector search)
- Lovable AI Gateway only supports chat completions, not embeddings
- Will ask user to provide this before proceeding

### Step 2: Rewrite `civic-brain` Edge Function
- **LLM**: Switch from Groq to Lovable AI Gateway (`google/gemini-3-flash-preview`)
- **Embeddings**: Keep OpenAI ada-002 (requires OPENAI_API_KEY)
- **Fallback**: Add full-text search on `vectors.content` when embedding API fails
- **Streaming**: Return SSE stream for token-by-token rendering
- **History**: Fix to properly store/retrieve as user/assistant message pairs
- Remove Groq SDK dependency; use fetch to Lovable AI Gateway
- Keep `_shared/userContext.ts` and `_shared/promptBuilder.ts` (they're solid)

### Step 3: Rewrite `civic-router` Edge Function
- **LLM**: Switch from Groq to Lovable AI Gateway (`google/gemini-3-flash-preview`)
- Keep the 2-step flow (routing classification + letter generation) but use a single smarter call with tool calling for structured routing output
- Keep institution DB lookup logic (168 active institutions)
- Remove Groq dependency

### Step 4: New `civic-ingest` Edge Function
- **Purpose**: Admin-only PDF upload → parse → chunk → embed → store in vectors
- Accept PDF file via multipart upload (from Supabase Storage URL or direct upload)
- Extract text using `pdf-parse` (Deno-compatible)
- Chunk text into ~500-token segments with overlap
- Generate embeddings via OpenAI ada-002
- Store chunks in `vectors` table with proper `source_type`, `title`, `metadata`
- Auth: require admin/super_admin role

### Step 5: Database Additions
- Add GIN index on `vectors.content` for full-text search fallback
- Create `match_documents_fts` RPC for keyword-based fallback search
- No schema changes to existing tables needed

### Step 6: Redesign `CivicChat.tsx` Frontend
- Convert from single Q&A view to **proper conversational chat** with message bubbles
- **Streaming**: Parse SSE from civic-brain, render tokens as they arrive
- **Fix follow-up**: Wire the Send button to actually submit follow-up queries
- **Fix history**: Map `role`/`content` pairs correctly from DB
- Markdown rendering with `react-markdown` (already imported)
- Dark mode support (currently hardcoded white)
- Keep language toggle (EN/SW), personalization banner, recommended questions

### Step 7: Update `aiClient.ts` Service
- Add streaming method for civic-brain: `ragStream(query, sessionId, language, onDelta, onDone)`
- Keep non-streaming `routing()` method (router doesn't need streaming)
- Fix `getHistory()` to return properly typed message pairs
- Remove dead `RAGResult` fields that don't match actual response

### Step 8: Clean Up
- Remove `Groq` import from `deno.json` (no longer needed)
- Remove `groq-sdk` usage from both functions
- Update `config.toml` to include `civic-ingest` function
- Verify no dead code remains

## Technical Details

**Lovable AI Gateway calls** (replacing Groq):
```typescript
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [...],
    stream: true, // for civic-brain
  }),
});
```

**Full-text search fallback** (when embeddings unavailable):
```sql
CREATE OR REPLACE FUNCTION match_documents_fts(search_query text, match_count int DEFAULT 5)
RETURNS TABLE(id uuid, content text, metadata jsonb, similarity float)
AS $$
  SELECT id, content, metadata, 
    ts_rank(to_tsvector('english', content), plainto_tsquery('english', search_query))::float
  FROM vectors
  WHERE to_tsvector('english', content) @@ plainto_tsquery('english', search_query)
  ORDER BY ts_rank(...) DESC
  LIMIT match_count;
$$ LANGUAGE sql;
```

## Sequence of Work
1. Ask user for OPENAI_API_KEY secret
2. Database migration (FTS index + fallback RPC)
3. Rewrite civic-brain (streaming + Lovable AI)
4. Rewrite civic-router (Lovable AI)
5. Create civic-ingest (PDF pipeline)
6. Rewrite CivicChat.tsx (conversational + streaming)
7. Update aiClient.ts service layer
8. Clean up dead code + deploy + test

