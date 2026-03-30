// src/lib/edgeFunctionCache.ts
// PURPOSE: Reduce Supabase Edge Function invocations at 1M MAU scale.
// Every cached invocation saves ~$0.000002. At 1M users repeating the
// same calls 10x each, this saves ~$20/day on just the invocation cost.
//
// USAGE:
//   import { cachedEdgeFunction } from '@/lib/edgeFunctionCache';
//
//   const preview = await cachedEdgeFunction('link-preview', { url }, 'link_preview_cache', 3600);

interface CacheEntry {
  data: unknown;
  cachedAt: number;
  expiresAt: number;
}

// In-memory cache for the current browser session
// Cleared on page refresh — that's intentional (PWA reuse doesn't refresh)
const memoryCache = new Map<string, CacheEntry>();

interface LinkPreviewCacheRow {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
  favicon: string | null;
  expires_at: string;
}

/**
 * Call an Edge Function with layered caching:
 *   1. Memory cache (fastest, lives for browser session)
 *   2. Optional: Supabase table cache (survives refreshes, shared across users)
 *
 * @param functionName - Supabase Edge Function name (e.g. 'link-preview')
 * @param params      - Parameters that form the cache key
 * @param tableName   - Optional: Supabase table to use for persistent caching
 * @param ttlSeconds  - How long to cache (default: 5 minutes)
 */
export async function cachedEdgeFunction<T = unknown>(
  functionName: string,
  params: Record<string, unknown>,
  tableName?: string,
  ttlSeconds = 300
): Promise<T | null> {
  const cacheKey = `${functionName}:${JSON.stringify(params)}`;
  const now = Date.now();

  // 1. Check memory cache first
  const cached = memoryCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data as T;
  }

  // 2. Check table-based persistent cache if available
  if (tableName === 'link_preview_cache' && params.url) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName!)
        .select('*')
        .eq('url', params.url)
        .maybeSingle();

      const row = data as unknown as LinkPreviewCacheRow;

      if (!error && row && new Date(row.expires_at).getTime() > now) {
        const result = {
          title: row.title,
          description: row.description,
          image: row.image,
          siteName: row.site_name,
          favicon: row.favicon,
          url: row.url
        } as unknown as T;

        // Populate memory cache
        memoryCache.set(cacheKey, {
          data: result,
          cachedAt: now,
          expiresAt: new Date(row.expires_at).getTime(),
        });

        return result;
      }
    } catch (err) {
      console.warn(`[edgeFunctionCache] Persistent cache read failed:`, err);
    }
  }

  // 3. Cache miss — call the Edge Function
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke(functionName, { body: params });

    if (error) throw error;

    // 4. Store in memory cache
    memoryCache.set(cacheKey, {
      data,
      cachedAt: now,
      expiresAt: now + ttlSeconds * 1000,
    });

    // 5. Store in persistent cache if available
    if (tableName === 'link_preview_cache' && params.url && data) {
      const p = data as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from(tableName).upsert({
        url: params.url,
        title: p.title || null,
        description: p.description || null,
        image: p.image || null,
        site_name: p.siteName || null,
        favicon: p.favicon || null,
        expires_at: new Date(now + ttlSeconds * 1000).toISOString()
      }).then(({ error: upsertError }: { error: any }) => {
        if (upsertError) console.warn('[edgeFunctionCache] Upsert failed:', upsertError);
      });
    }

    // Prune memory cache if large
    if (memoryCache.size > 500) {
      const oldest = [...memoryCache.entries()]
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
        .slice(0, 100);
      oldest.forEach(([k]) => memoryCache.delete(k));
    }

    return data as T;
  } catch (err) {
    console.warn(`[edgeFunctionCache] ${functionName} failed:`, err);
    return null;
  }
}

/**
 * Invalidate a specific cache entry (call after user actions that
 * would change the cached result).
 */
export function invalidateCache(functionName: string, params: Record<string, unknown>): void {
  const cacheKey = `${functionName}:${JSON.stringify(params)}`;
  memoryCache.delete(cacheKey);
}

/**
 * Clear all cached entries (call on sign-out).
 */
export function clearAllCaches(): void {
  memoryCache.clear();
}
