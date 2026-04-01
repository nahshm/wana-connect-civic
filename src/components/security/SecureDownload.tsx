// src/components/security/SecureDownload.tsx
// PURPOSE: Authenticates and downloads files from private buckets,
// routing the request through the Cloudflare Worker proxy.
//
// Two usage modes:
//   1. Preferred: <SecureDownload bucket="project-documents" path="file.pdf" filename="doc.pdf">
//   2. Raw URL (already resolved): <SecureDownload url="https://...">
//      Used in GlassLightbox where the blob URL is already available.

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMediaUrl } from '@/lib/secureMedia';
import type { PrivateBucket } from '@/lib/secureMedia';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

type BucketMode = {
  bucket: PrivateBucket;
  path: string;
  url?: never;
};

type UrlMode = {
  url: string;
  bucket?: never;
  path?: never;
};

type SecureDownloadProps = (BucketMode | UrlMode) & {
  filename?: string;
  children: React.ReactNode;
  className?: string;
};

// ─── Core download logic ──────────────────────────────────────────────────────

async function triggerDownload(workerUrl: string, filename: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Authentication required. Please log in to download files.');

  const response = await fetch(workerUrl, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke after a short delay to ensure the download has started
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

// ─── Public component ─────────────────────────────────────────────────────────

export function SecureDownload({ bucket, path, url, filename, children, className }: SecureDownloadProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // Resolve the final worker URL
      const workerUrl = url ?? getMediaUrl(bucket!, path!);
      // Derive filename from path/url if not explicitly provided
      const resolvedFilename = filename ?? (path ?? url ?? '').split('/').pop()?.split('?')[0] ?? 'download';
      await triggerDownload(workerUrl, resolvedFilename);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred while downloading.';
      toast({ title: 'Download failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn('relative', loading && 'opacity-70 cursor-wait', className)}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </span>
      )}
      <span className={cn('flex items-center gap-2', loading && 'invisible')}>
        {children}
      </span>
    </button>
  );
}
