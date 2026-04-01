// src/components/chat/MessageMedia.tsx
// Renders images and file attachments in chat messages.
// All media is fetched through the Cloudflare Worker proxy — never via public URLs.

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { GlassLightbox } from '@/components/ui/GlassLightbox';
import { SecureImage } from '@/components/security/SecureImage';
import { SecureDownload } from '@/components/security/SecureDownload';

interface MessageMediaProps {
  /** Storage paths relative to the 'chat-media' bucket root. */
  urls: string[];
  mediaType?: string | null;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

function isImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Strips the timestamp prefix from a storage path to get a human-readable filename. */
function getFileName(path: string): string {
  const parts = path.split('/');
  const full = parts[parts.length - 1];
  const underscoreIdx = full.indexOf('_');
  return underscoreIdx > 0 ? full.substring(underscoreIdx + 1) : full;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const MediaImage = React.memo(function MediaImage({
  path,
  onOpenLightbox,
}: {
  path: string;
  onOpenLightbox: (resolvedBlobUrl: string) => void;
}) {
  return (
    <SecureImage
      bucket="chat-media"
      path={path}
      alt="Attachment"
      className="rounded-lg overflow-hidden border max-w-xs cursor-zoom-in hover:opacity-90 transition-opacity"
      style={{ width: 280, height: 200 }}
      onClick={onOpenLightbox}
    />
  );
});

const MediaFile = React.memo(function MediaFile({ path }: { path: string }) {
  return (
    <SecureDownload
      bucket="chat-media"
      path={path}
      filename={getFileName(path)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors max-w-xs text-sm"
    >
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <span className="truncate flex-1 text-sm">{getFileName(path)}</span>
    </SecureDownload>
  );
});

// ─── Public component ─────────────────────────────────────────────────────────

export function MessageMedia({ urls, mediaType }: MessageMediaProps) {
  // lightboxSrc holds the resolved blob URL received from SecureImage's onClick
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (!urls || urls.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {urls.map((path, i) => {
          const isImage = mediaType === 'image' || isImagePath(path);
          return isImage ? (
            <MediaImage key={i} path={path} onOpenLightbox={setLightboxSrc} />
          ) : (
            <MediaFile key={i} path={path} />
          );
        })}
      </div>

      <GlassLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
