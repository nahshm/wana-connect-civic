import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface MessageMediaProps {
  urls: string[];
  mediaType?: string | null;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

function isImageUrl(url: string) {
  const lower = url.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.includes(ext));
}

function getPublicUrl(path: string) {
  const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
  return data.publicUrl;
}

function getFileName(path: string) {
  // Extract filename from path like "userId/timestamp_filename.ext"
  const parts = path.split('/');
  const full = parts[parts.length - 1];
  // Remove leading timestamp_ prefix
  const underscoreIdx = full.indexOf('_');
  return underscoreIdx > 0 ? full.substring(underscoreIdx + 1) : full;
}

export function MessageMedia({ urls, mediaType }: MessageMediaProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!urls || urls.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {urls.map((url, i) => {
          const publicUrl = getPublicUrl(url);
          const isImage = mediaType === 'image' || isImageUrl(url);

          if (isImage) {
            return (
              <button
                key={i}
                className="rounded-lg overflow-hidden border max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxUrl(publicUrl)}
              >
                <img
                  src={publicUrl}
                  alt="Attachment"
                  className="max-w-[280px] max-h-[200px] object-cover"
                  loading="lazy"
                />
              </button>
            );
          }

          // File attachment card
          return (
            <a
              key={i}
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors max-w-xs"
            >
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">{getFileName(url)}</span>
              <Download className="h-4 w-4 text-muted-foreground shrink-0" />
            </a>
          );
        })}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Full size" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
