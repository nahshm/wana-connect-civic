/**
 * Video slot for clip posts inside PostCard — sits where a photo would go,
 * so clips keep the normal post card design.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { Eye, Maximize2 } from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { useMediaUrl } from '@/lib/secureMedia';
import type { PostClip } from '@/types';

function parseAspectRatio(value?: string | number | null): number | null {
  if (typeof value === 'number' && isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    if (value.includes(':')) {
      const [w, h] = value.split(':').map(Number);
      if (w > 0 && h > 0) return w / h;
    }
    const num = Number(value);
    if (isFinite(num) && num > 0) return num;
  }
  return null;
}

export function FeedClipMedia({ clip }: { clip: PostClip }) {
  const navigate = useNavigate();
  const videoUrl = useMediaUrl('media', clip.video_url);
  const [ratio, setRatio] = useState<number | null>(parseAspectRatio(clip.aspect_ratio));
  const { ref, inView } = useInView({ threshold: 0.6 });

  if (!videoUrl) return null;

  return (
    <div ref={ref} className="mb-3">
      <div
        className="relative mx-auto w-full max-h-[500px] overflow-hidden rounded-xl border border-sidebar-border bg-black"
        style={{ aspectRatio: ratio ?? 16 / 9, maxWidth: ratio && ratio < 1 ? `${500 * ratio}px` : undefined }}
      >
        <VideoPlayer
          videoUrl={videoUrl}
          thumbnailUrl={clip.thumbnail_url ?? undefined}
          autoPlay
          isActive={inView}
          muted
          loop
          onAspectRatio={(r) => setRatio(r)}
          fit="contain"
          className="h-full w-full"
        />
        <button
          type="button"
          aria-label="Open clip viewer"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/civic-clips/${clip.id}`); }}
          className="absolute right-2 top-2 z-30 rounded-full bg-background/70 p-1.5 text-foreground backdrop-blur hover:bg-background/90"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        {typeof clip.views_count === 'number' && (
          <div className="pointer-events-none absolute left-2 top-2 z-30 flex items-center gap-1 rounded bg-background/70 px-2 py-0.5 text-xs text-foreground backdrop-blur">
            <Eye className="h-3 w-3" />
            {clip.views_count.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
