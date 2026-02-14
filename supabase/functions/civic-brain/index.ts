
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Groq from "https://esm.sh/groq-sdk@0.3.0";
import { getUserContext } from "../_shared/userContext.ts";
import { buildPersonalizedPrompt } from "../_shared/promptBuilder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RAGRequest {
  query: string;
  user_id?: string; // Optional in body, we get it from token
  session_id: string;
  language?: 'en' | 'sw';
  include_history?: boolean;
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

    const { query, session_id, language = "en", include_history = true }: RAGRequest = await req.json();

    if (!query || !session_id) {
       return new Response(JSON.stringify({ error: "query and session_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Client for Auth validation
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get User ID from Token
    const { data: claims, error: authError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    // Service Client for DB Ops (Context, RAG, History)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: GATHER USER CONTEXT
    console.log(`Gathering user context for ${userId}...`);
    const userContext = await getUserContext(serviceClient, userId);
    console.log(`Context loaded for ${userContext.name} (${userContext.role}) from ${userContext.location.county}`);

    // STEP 2: GET GROQ API KEY from environment (not database)
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    // STEP 3: GENERATE QUERY EMBEDDING FOR RAG
    // Using OpenAI for now as per instructions, fallback to null if no key? 
    // Assuming OPENAI_API_KEY is set in secrets.
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
       console.error("OPENAI_API_KEY not set. Skipping vector search.");
       // fallback or throw? code continues assuming embeddings. 
       // We can mock it or throw. Let's throw for visibility if missing.
       // Or better, skip embedding and matches if key missing.
    }

    let localizedMatches: any[] = [];
    
    if (openAIKey) {
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: query
        })
        });

        if (embeddingResponse.ok) {
            const { data: embeddings } = await embeddingResponse.json();
            
            // STEP 4: VECTOR SEARCH WITH LOCATION BIAS
            const { data: matches } = await serviceClient.rpc('match_documents', {
                query_embedding: embeddings[0].embedding,
                match_threshold: 0.7,
                match_count: 5
            });

            if (matches) {
                 // Filter/boost results for user's county
                localizedMatches = matches.map((match: any) => {
                    // Boost similarity if document mentions user's county
                    if (match.metadata.location?.includes(userContext.location.county)) {
                        match.similarity = Math.min(match.similarity * 1.15, 1.0); // 15% boost
                    }
                    return match;
                }).sort((a: any, b: any) => b.similarity - a.similarity);
            }
        }
    }

    // STEP 5: BUILD CONTEXT FROM DOCUMENTS
    const ragContext = localizedMatches
      .map((m, i) => `[Source ${i + 1}] ${m.metadata.source}\n${m.content}`)
      .join('\n\n---\n\n');

    // STEP 6: OPTIONAL - GET CONVERSATION HISTORY
    let conversationHistory = '';
    if (include_history) {
      const { data: history } = await serviceClient
        .from('rag_chat_history')
        .select('role, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: false }) // Get latest first
        .limit(6); 

      if (history && history.length > 0) {
        conversationHistory = history.reverse() // Order chronologically
          .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
          .join('\n');
      }
    }

    // STEP 7: BUILD PERSONALIZED SYSTEM PROMPT
    const basePrompt = `
You are the Civic Brain for WanaIQ, Kenya's civic engagement platform.

CRITICAL RULES:
1. Answer ONLY using the provided RAG sources - do not use external knowledge
2. If sources don't contain the answer, say "I don't have information about that in my knowledge base"
3. ALWAYS cite sources using [Source X] notation
4. Keep answers concise (2-3 paragraphs maximum)
5. Provide actionable next steps
6. Be objective and nonpartisan
`.trim();

    const personalizedPrompt = buildPersonalizedPrompt(userContext, basePrompt);

    // STEP 8: CONSTRUCT FINAL USER MESSAGE
    const userMessage = `
${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n\n` : ''}
Verified Information Sources:
${ragContext}

Current Question: ${query}
`.trim();

    // STEP 9: CALL GROQ LLM
    console.log('Calling Groq with personalized prompt...');
    const completion = await groq.chat.completions.create({
      model: 'llama-3-8b-8192',
      messages: [
        { role: 'system', content: personalizedPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.4,
      max_tokens: 800
    });

    const answer = completion.choices[0].message.content || '';

    // STEP 10: FORMAT SOURCES
    const sources = localizedMatches.map((m, i) => ({
      document_id: m.id,
      title: m.metadata.source,
      article: m.metadata.article_number,
      url: m.metadata.url,
      similarity: m.similarity,
      is_local: m.metadata.location?.includes(userContext.location.county) || false
    }));

     // STEP 11: SAVE TO HISTORY
    await serviceClient.from('rag_chat_history').insert([
      {
        user_id: userId,
        session_id,
        role: 'user',
        content: query
      },
      {
        user_id: userId,
        session_id,
        role: 'assistant',
        content: answer,
        sources
      }
    ]);

    // STEP 12: UPDATE USER ACTIVITY (fire and forget)
    serviceClient
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId)
      .then(() => console.log('Updated last_active_at'));

    return new Response(JSON.stringify({
      answer,
      sources,
      confidence: calculateConfidence(localizedMatches),
      language,
      personalization: {
        tailored_to: userContext.name,
        location: userContext.location.county,
        role: userContext.role
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('Civic Brain Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateConfidence(matches: any[]): number {
  if (!matches || matches.length === 0) return 0;
  const avgSimilarity = matches.slice(0, 3).reduce((sum: number, m: any) => sum + m.similarity, 0) / 3;
  return Math.round(avgSimilarity * 100) / 100;
}
