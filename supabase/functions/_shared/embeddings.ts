/**
 * _shared/embeddings.ts
 * Shared embedding utilities for civic-ingest and civic-processor.
 * Centralises OpenAI embedding calls so model changes are one-line fixes.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

const EMBEDDING_MODEL = "text-embedding-ada-002";
const RATE_LIMIT_MS = 100; // pause between API calls

/**
 * Generate an embedding vector for a single text string.
 * Requires OPENAI_API_KEY in the environment.
 */
export async function embedText(text: string): Promise<number[]> {
  const openAIKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.data[0].embedding;
}

/**
 * Embed multiple chunks and insert them into the `vectors` table.
 * Returns counts of inserted vs failed chunks.
 *
 * Each chunk should have:
 *   - content: the text to embed and store
 *   - title: display title for the vector row
 *   - metadata: additional metadata to attach
 */
export async function embedAndInsert(
  client: AnyClient,
  chunks: { content: string; title: string; metadata: Record<string, unknown> }[],
): Promise<{ inserted: number; failed: number; errors: string[] }> {
  const results = { inserted: 0, failed: 0, errors: [] as string[] };

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const embedding = await embedText(chunk.content);

      const { error: insertError } = await client.from("vectors").insert({
        content: chunk.content,
        embedding,
        source_type: (chunk.metadata.source_type as string) ?? "document",
        title: chunk.title,
        metadata: chunk.metadata,
      });

      if (insertError) throw new Error(`Insert error: ${insertError.message}`);
      results.inserted++;

      // Rate limit between calls
      if (i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
      }
    } catch (e) {
      results.failed++;
      results.errors.push(
        `Chunk ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
      console.error(`[embeddings] Chunk ${i + 1} failed:`, e);
    }
  }

  return results;
}
