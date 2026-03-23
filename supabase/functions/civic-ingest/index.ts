import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IngestRequest {
  storage_path?: string;
  content?: string;
  url?: string;
  title: string;
  source_type: string;
  metadata?: Record<string, unknown>;
}

function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  const cleanText = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  while (start < cleanText.length) {
    let end = start + chunkSize;
    if (end < cleanText.length) {
      const paragraphBreak = cleanText.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + chunkSize / 2) {
        end = paragraphBreak;
      } else {
        const sentenceBreak = cleanText.lastIndexOf(". ", end);
        if (sentenceBreak > start + chunkSize / 2) {
          end = sentenceBreak + 1;
        }
      }
    }
    const chunk = cleanText.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start = end - overlap;
    if (start < 0) start = 0;
    if (start >= cleanText.length) break;
  }
  return chunks;
}

async function fetchUrlContent(url: string): Promise<string> {
  // Use Jina AI reader for clean text extraction (handles PDFs, web pages, etc.)
  const jinaUrl = `https://r.jina.ai/${url}`;
  console.log(`[civic-ingest] Fetching via Jina reader: ${jinaUrl}`);
  
  const response = await fetch(jinaUrl, {
    headers: {
      "Accept": "text/plain",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Jina reader failed (${response.status}): ${errText.slice(0, 200)}`);
  }

  const text = await response.text();
  if (!text || text.trim().length < 50) {
    throw new Error("Jina reader returned insufficient content");
  }

  console.log(`[civic-ingest] Jina extracted ${text.length} chars`);
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAIKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAIKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: hasAdminRole } = await serviceClient.rpc("has_role", {
      _user_id: user.id, _role: "admin",
    });
    const { data: hasSuperAdminRole } = await serviceClient.rpc("has_role", {
      _user_id: user.id, _role: "super_admin",
    });

    if (!hasAdminRole && !hasSuperAdminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: IngestRequest = await req.json();
    const { storage_path, content, url, title, source_type, metadata = {} } = body;

    if (!title || !source_type) {
      return new Response(
        JSON.stringify({ error: "title and source_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!storage_path && !content && !url) {
      return new Response(
        JSON.stringify({ error: "Either storage_path, content, or url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let textContent = content || "";

    // URL-based ingestion via Jina reader
    if (url && !content) {
      try {
        textContent = await fetchUrlContent(url);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch URL";
        return new Response(
          JSON.stringify({ error: msg }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Storage-based ingestion
    if (storage_path && !content && !url) {
      console.log(`[civic-ingest] Downloading from storage: ${storage_path}`);
      const { data: fileData, error: downloadError } = await serviceClient.storage
        .from("documents").download(storage_path);

      if (downloadError || !fileData) {
        return new Response(
          JSON.stringify({ error: `Failed to download file: ${downloadError?.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fileName = storage_path.toLowerCase();
      if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
        textContent = await fileData.text();
      } else if (fileName.endsWith(".pdf")) {
        return new Response(
          JSON.stringify({ error: "For PDFs, use the 'url' parameter with a public URL. Jina AI will extract the text automatically." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        try {
          textContent = await fileData.text();
        } catch {
          return new Response(
            JSON.stringify({ error: "Unsupported file format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!textContent.trim()) {
      return new Response(
        JSON.stringify({ error: "No text content to process" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chunk and embed
    console.log(`[civic-ingest] Chunking ${textContent.length} chars...`);
    const chunks = chunkText(textContent);
    console.log(`[civic-ingest] Created ${chunks.length} chunks`);

    const results = { total_chunks: chunks.length, inserted: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: { Authorization: `Bearer ${openAIKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "text-embedding-ada-002", input: chunk }),
        });

        if (!embeddingResponse.ok) {
          const errText = await embeddingResponse.text();
          throw new Error(`Embedding API error: ${errText}`);
        }

        const { data: embeddings } = await embeddingResponse.json();
        const embedding = embeddings[0].embedding;

        const { error: insertError } = await serviceClient.from("vectors").insert({
          content: chunk, embedding, source_type,
          title: `${title} (Part ${i + 1}/${chunks.length})`,
          metadata: {
            ...metadata, source: title, chunk_index: i, total_chunks: chunks.length,
            ingested_by: user.id, ingested_at: new Date().toISOString(),
            ...(url ? { source_url: url } : {}),
          },
        });

        if (insertError) throw new Error(`Insert error: ${insertError.message}`);
        results.inserted++;
        console.log(`[civic-ingest] Inserted chunk ${i + 1}/${chunks.length}`);

        if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        results.failed++;
        results.errors.push(`Chunk ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
        console.error(`[civic-ingest] Chunk ${i + 1} failed:`, e);
      }
    }

    // Emit ingest_complete event
    try {
      await serviceClient.from("agent_events").insert({
        event_type: "ingest_complete",
        source_agent: "civic-ingest",
        payload: { title, source_type, chunks: results.total_chunks, inserted: results.inserted, failed: results.failed, ...(url ? { url } : {}) },
        status: results.failed === 0 ? "success" : "partial",
      });
    } catch (e) {
      console.error("[civic-ingest] Failed to emit event:", e);
    }

    console.log(`[civic-ingest] Complete: ${results.inserted}/${results.total_chunks} chunks inserted`);

    return new Response(JSON.stringify({
      success: results.failed === 0,
      message: `Ingested ${results.inserted} of ${results.total_chunks} chunks`,
      ...results,
    }), {
      status: results.failed === 0 ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[civic-ingest] Error:", message);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
