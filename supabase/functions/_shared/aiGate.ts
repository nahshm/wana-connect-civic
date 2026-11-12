/**
 * aiGate.ts — admin on/off switch for AI features.
 * Reads public.feature_flags (feature_key = key). Missing row = enabled;
 * lookup failure = disabled (fail closed to avoid surprise AI spend).
 * Returns a Response when the feature is off, otherwise null.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

export async function aiFeatureGate(key: string): Promise<Response | null> {
  let enabled = false;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const res = await fetch(
      `${url}/rest/v1/feature_flags?feature_key=eq.${encodeURIComponent(key)}&select=is_enabled`,
      { headers: { apikey: srk!, Authorization: `Bearer ${srk}` } },
    );
    if (res.ok) {
      const rows = await res.json() as { is_enabled: boolean }[];
      enabled = rows.length === 0 ? true : rows[0].is_enabled === true;
    }
  } catch (_) { enabled = false; }
  if (enabled) return null;
  return new Response(
    JSON.stringify({ disabled: true, feature: key, error: "This AI feature is currently turned off." }),
    { status: 503, headers: CORS },
  );
}
