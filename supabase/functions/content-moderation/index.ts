import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  content: string;
  type: 'post' | 'comment';
  author_id: string;
}

interface ModerationResult {
  is_safe: boolean;
  confidence: number;
  flags: string[];
  suggested_action: 'approve' | 'review' | 'reject';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { content, type, author_id }: ModerationRequest = await req.json();

    // Simple content moderation logic
    const result = await moderateContent(content, type);

    // Log moderation result
    console.log(`Moderation result for ${type}:`, result);

    // If content is flagged, we might want to store it for review
    if (!result.is_safe) {
      await supabase
        .from('moderation_logs')
        .insert({
          content,
          content_type: type,
          author_id,
          moderation_result: result,
          status: 'flagged'
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content moderation:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to moderate content',
        is_safe: true, // Default to safe if moderation fails
        confidence: 0,
        flags: [],
        suggested_action: 'review'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function moderateContent(content: string, type: string): Promise<ModerationResult> {
  const flags: string[] = [];
  let confidence = 0.8;
  
  // Basic keyword filtering
  const inappropriateWords = [
    'hate', 'violence', 'spam', 'scam', 'fake news',
    // Add more inappropriate words specific to Kenyan context
  ];
  
  const lowercaseContent = content.toLowerCase();
  
  // Check for inappropriate content
  for (const word of inappropriateWords) {
    if (lowercaseContent.includes(word)) {
      flags.push(`inappropriate_language: ${word}`);
    }
  }
  
  // Check for excessive caps (might indicate shouting/spam)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 50) {
    flags.push('excessive_caps');
  }
  
  // Check for very short content that might be spam
  if (type === 'post' && content.trim().length < 10) {
    flags.push('too_short');
  }
  
  // Check for repeated characters (spam indicator)
  if (/(.)\1{4,}/.test(content)) {
    flags.push('repeated_characters');
  }
  
  // Determine if content is safe
  const is_safe = flags.length === 0;
  
  // Suggest action based on flags
  let suggested_action: 'approve' | 'review' | 'reject' = 'approve';
  if (flags.length > 0) {
    if (flags.some(flag => flag.includes('inappropriate_language'))) {
      suggested_action = flags.length > 2 ? 'reject' : 'review';
    } else {
      suggested_action = 'review';
    }
  }
  
  return {
    is_safe,
    confidence,
    flags,
    suggested_action
  };
}