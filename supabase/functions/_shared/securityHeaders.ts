// supabase/functions/_shared/securityHeaders.ts
// PURPOSE: Applied to every Supabase Edge Function response so API
// endpoints are also protected, not just the frontend.

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none';",
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function withSecurityHeaders(
  body: unknown,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_HEADERS,
    },
  });
}

export function withErrorResponse(message: string, status: number): Response {
  return withSecurityHeaders({ error: message }, status);
}

export function withOptionsResponse(): Response {
  return new Response(null, { headers: SECURITY_HEADERS });
}
