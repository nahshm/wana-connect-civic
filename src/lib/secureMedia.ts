// src/lib/secureMedia.ts
// PURPOSE: Routes all private bucket media through the Cloudflare Worker.
// This eliminates Supabase Edge Function costs at 1M MAU scale.
//
// HOW IT WORKS:
// 1. getMediaUrl() builds the Worker URL (no JWT embedded — kept in memory only)
// 2. useFetchBlobUrl() fetches with Authorization header → creates ephemeral blob URL
// 3. SecureImage/SecureVideo use these blob URLs — they're unguessable and expire when unmounted
//
// FUTURE: When Cloudflare R2 migration is complete, only getMediaUrl() changes.
// All callers stay the same.

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const WORKER_BASE = import.meta.env.VITE_MEDIA_WORKER_URL as string;

/**
 * The canonical list of PRIVATE buckets.
 * Do NOT add public buckets here (user-profiles, manifestos, community-assets).
 */
export const PRIVATE_BUCKETS = [
  'media',
  'post-media',
  'issue-media',
  'incident-media',
  'comment-media',
  'chat-media',
  'crisis-media',
  'project-media',
  'project-documents',
] as const;

export type PrivateBucket = typeof PRIVATE_BUCKETS[number];

/**
 * Build the Cloudflare Worker URL for a private media file.
 * Does NOT embed the JWT — the consumer must add the Authorization header.
 */
export function getMediaUrl(bucket: PrivateBucket, path: string): string {
  if (!path) return '';

  // If the path is a full Supabase URL, extract the relative path and bucket info
  // to ensure it still goes through our proxy/fallback logic correctly.
  if (path.includes('.supabase.co/storage/v1/object/')) {
    const prefixes = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
    ];

    for (const prefix of prefixes) {
      if (path.includes(prefix)) {
        const parts = path.split(prefix);
        if (parts.length > 1) {
          // Extract the path after the bucket prefix and remove any query parameters
          path = parts[1].split('?')[0];
          break;
        }
      }
    }
  } else if (path.startsWith('http')) {
    // For non-Supabase external URLs, return as-is
    return path;
  }

  if (!WORKER_BASE) {
    // Fallback during local dev when worker isn't running
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const encoded = encodeURIComponent(path);
  return `${WORKER_BASE}?bucket=${bucket}&path=${encoded}`;
}

/**
 * React hook that fetches a media URL with the Supabase JWT and returns
 * an ephemeral blob URL safe for use in <img> and <video> src attributes.
 *
 * Returns empty string while loading.
 */
export function useFetchBlobUrl(workerUrl: string | null): string {
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    if (!workerUrl) return;

    // In dev without a Worker, the URL is already a public Supabase URL
    if (!WORKER_BASE || !workerUrl.includes(WORKER_BASE)) {
      setBlobUrl(workerUrl);
      return;
    }

    let currentObjectUrl = '';
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session) return;

      fetch(workerUrl, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error(`Worker responded ${r.status}`);
          return r.blob();
        })
        .then((blob) => {
          if (cancelled) return;
          currentObjectUrl = URL.createObjectURL(blob);
          setBlobUrl(currentObjectUrl);
        })
        .catch((err) => {
          console.warn('[secureMedia] fetch failed:', err.message);
          // Silently degrade — image/video simply won't show
        });
    });

    return () => {
      cancelled = true;
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      setBlobUrl('');
    };
  }, [workerUrl]);

  return blobUrl;
}

/**
 * Combined helper: build URL + fetch blob.
 * Use this in components that just need a src string.
 */
export function useMediaUrl(bucket: PrivateBucket, path: string | null | undefined): string {
  const workerUrl = path ? getMediaUrl(bucket, path) : null;
  return useFetchBlobUrl(workerUrl);
}
