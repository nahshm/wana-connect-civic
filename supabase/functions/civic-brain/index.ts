import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

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

    const { query, session_id, language = "en" } = await req.json();

    if (!query || !session_id) {
      return new Response(JSON.stringify({ error: "query and session_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof query !== "string" || query.length > 2000) {
      return new Response(JSON.stringify({ error: "Query must be under 2000 chars" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startTime = Date.now();
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Save user message to chat history
    await serviceClient.from("rag_chat_history").insert({
      session_id,
      user_id: userId,
      role: "user",
      content: query,
    });

    // Fetch recent chat context for this session
    const { data: chatHistory } = await serviceClient
      .from("rag_chat_history")
      .select("role, content")
      .eq("session_id", session_id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const contextMessages = (chatHistory || []).reverse().map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }));

    // For now, use direct knowledge without vector search (vectors table may be empty)
    const systemPrompt = `You are a civic knowledge assistant for Kenya called WanaIQ Brain. 
You help citizens understand:
- Kenya's constitution and devolved government structure
- County functions vs national government functions
- How to engage with elected officials
- Budget processes and public participation
- Citizens' rights and civic duties

${language === "sw" ? "Respond in Swahili." : "Respond in English."}

Be concise, accurate, and cite the Constitution of Kenya 2010 where applicable.
If you're not sure about something, say so rather than making up information.

Format your response as valid JSON:
{
  "answer": "Your response here",
  "sources": ["Constitution of Kenya 2010, Article X", "County Governments Act 2012"],
  "confidence": 0.0 to 1.0
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...contextMessages.slice(-6),
      { role: "user", content: query },
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text();
      throw new Error(`Groq API error [${groqResponse.status}]: ${errBody}`);
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content || "{}";
    const result = JSON.parse(rawContent);

    const processingTime = Date.now() - startTime;

    // Save assistant response to chat history
    await serviceClient.from("rag_chat_history").insert({
      session_id,
      user_id: userId,
      role: "assistant",
      content: result.answer || rawContent,
      sources: result.sources || null,
      model_used: "llama-3.1-8b-instant",
    });

    return new Response(JSON.stringify({
      answer: result.answer || "I couldn't generate a response. Please try again.",
      sources: result.sources || [],
      confidence: result.confidence || 0.5,
      processing_time_ms: processingTime,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("civic-brain error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
