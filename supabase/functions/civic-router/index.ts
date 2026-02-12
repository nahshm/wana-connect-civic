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

    const { issue_description, location } = await req.json();

    if (!issue_description) {
      return new Response(JSON.stringify({ error: "issue_description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof issue_description !== "string" || issue_description.length > 5000) {
      return new Response(JSON.stringify({ error: "issue_description must be under 5000 chars" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startTime = Date.now();

    const systemPrompt = `You are a civic issue routing AI for Kenya. Classify the issue and determine the responsible department.

Kenya government departments include:
- Water & Sanitation (county level)
- Roads & Transport (national/county)
- Health Services (county)
- Education (national/county)
- Security & Police (national)
- Land & Housing (county)
- Agriculture (county)
- Environment (national/county)
- Energy & Electricity (national)
- County Administration (county)

Respond ONLY with valid JSON:
{
  "issue_type": "water|roads|health|education|security|land|agriculture|environment|energy|administration|other",
  "department_slug": "kebab-case-department",
  "department_name": "Full Department Name",
  "jurisdiction": "national|county|constituency|ward",
  "severity": 1-10,
  "confidence": 0.0 to 1.0,
  "recommended_actions": ["action1", "action2"]
}`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Issue: ${issue_description}${location ? `\nLocation: ${location}` : ""}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 400,
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

    // Log to routing_logs
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await serviceClient.from("routing_logs").insert({
      user_id: userId,
      issue_description: issue_description.substring(0, 500),
      location: location || null,
      issue_type: result.issue_type || null,
      department_slug: result.department_slug || null,
      department_name: result.department_name || null,
      severity: result.severity || null,
      confidence: result.confidence || null,
      recommended_actions: result.recommended_actions || null,
      model_used: "llama-3.1-8b-instant",
      processing_time_ms: processingTime,
    });

    return new Response(JSON.stringify({
      issue_type: result.issue_type || "other",
      department_slug: result.department_slug || "unknown",
      department_name: result.department_name || "Unknown Department",
      jurisdiction: result.jurisdiction || "county",
      severity: result.severity || 5,
      confidence: result.confidence || 0.5,
      recommended_actions: result.recommended_actions || [],
      processing_time_ms: processingTime,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("civic-router error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
