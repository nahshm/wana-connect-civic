// cloudflare/media-worker/src/index.ts
// PURPOSE: Validates Supabase JWT and proxies media from Supabase Storage.
// This eliminates ALL Supabase Edge Function invocations for media serving.
// In the future, swap Supabase Storage URLs for R2 URLs here — frontend unchanged.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_JWT_SECRET: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ALLOWED_ORIGIN: string;
}

// Validate Supabase JWT without calling any Supabase API
// Uses Web Crypto API — available natively in Cloudflare Workers
async function validateSupabaseJWT(
  token: string,
  secret: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    // Verify signature using Web Crypto
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureInput = `${parts[0]}.${parts[1]}`;
    const signature = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signatureInput)
    );

    if (!valid) return null;

    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

// Rate limiting using in-memory map (resets per worker instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, limit = 200): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    // Validate JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const user = await validateSupabaseJWT(
      authHeader.slice(7),
      env.SUPABASE_JWT_SECRET
    );

    if (!user) {
      return new Response('Invalid or expired token', { status: 403, headers: corsHeaders });
    }

    // Rate limit per user
    if (!checkRateLimit(user.userId)) {
      return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
    }

    // Parse request params
    const url = new URL(request.url);
    const bucket = url.searchParams.get('bucket');
    const path = url.searchParams.get('path');

    if (!bucket || !path) {
      return new Response('Missing bucket or path', { status: 400, headers: corsHeaders });
    }

    // Allowlist of valid private buckets — reject anything else
    const ALLOWED_BUCKETS = [
      'media', 'post-media', 'issue-media',
      'incident-media', 'comment-media', 'crisis-media', 'project-media',
      'project-documents'
    ];

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return new Response('Invalid bucket', { status: 400, headers: corsHeaders });
    }

    // SSRF protection — validate path doesn't escape bucket
    if (path.includes('..') || path.startsWith('/')) {
      return new Response('Invalid path', { status: 400, headers: corsHeaders });
    }

    // Fetch from Supabase Storage using service role key
    // FUTURE MIGRATION POINT: Replace this URL with R2 URL when ready
    const supabaseMediaUrl = `${env.SUPABASE_URL}/storage/v1/object/authenticated/${bucket}/${path}`;

    const mediaResponse = await fetch(supabaseMediaUrl, {
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (!mediaResponse.ok) {
      return new Response('Media not found', { status: 404, headers: corsHeaders });
    }

    // Stream response with cache headers
    return new Response(mediaResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': mediaResponse.headers.get('Content-Type') ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};
