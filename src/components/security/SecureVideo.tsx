// src/components/security/SecureVideo.tsx
// PURPOSE: Renders private bucket videos through the Cloudflare Worker proxy.
// Removes the native download button, prevents right-click context menu.
//
// Two usage modes:
//   1. Preferred: <SecureVideo bucket="media" path="user/video.mp4" />
//   2. Legacy / external: <SecureVideo src="https://..." />

import { forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useMediaUrl } from '@/lib/secureMedia';
import type { PrivateBucket } from '@/lib/secureMedia';

// ─── Public props (discriminated union) ──────────────────────────────────────

type BucketMode = {
  bucket: PrivateBucket;
  path: string;
  src?: never;
};

type SrcMode = {
  src: string;
  bucket?: never;
  path?: never;
};

type SharedVideoProps = {
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
};

export type SecureVideoProps = (BucketMode | SrcMode) & SharedVideoProps;

// ─── Internal render props — clean interface, no discriminated union ──────────

type InternalVideoProps = SharedVideoProps & {
  resolvedSrc: string;
  isLoading: boolean;
};

// ─── Internal: renders the actual <video> element ────────────────────────────

const VideoElement = forwardRef<HTMLVideoElement, InternalVideoProps>(
  function VideoElement(
    {
      resolvedSrc,
      isLoading,
      poster,
      className,
      autoPlay = false,
      muted = false,
      playsInline = true,
      controls = true,
      loop = false,
      onPlay,
      onPause,
      onEnded,
    },
    ref
  ) {
    // Block Ctrl+S / Cmd+S only when the user is interacting with the video element
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    }, []);

    return (
      <div className={cn('relative', isLoading && 'media-loading', className)}>
        {resolvedSrc && (
          <video
            ref={ref}
            src={resolvedSrc}
            poster={poster}
            className="block w-full h-full"
            controls={controls}
            autoPlay={autoPlay}
            muted={muted}
            playsInline={playsInline}
            loop={loop}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={handleKeyDown}
            style={{
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.2s ease-in',
            }}
          />
        )}
      </div>
    );
  }
);

// ─── Intermediate: resolves bucket → blob URL, then renders ──────────────────

const BucketVideo = forwardRef<HTMLVideoElement, { bucket: PrivateBucket; path: string } & SharedVideoProps>(
  function BucketVideo({ bucket, path, ...sharedProps }, ref) {
    const blobUrl = useMediaUrl(bucket, path);
    return <VideoElement ref={ref} resolvedSrc={blobUrl} isLoading={!blobUrl} {...sharedProps} />;
  }
);

// ─── Public component ─────────────────────────────────────────────────────────

export const SecureVideo = forwardRef<HTMLVideoElement, SecureVideoProps>(
  function SecureVideo(props, ref) {
    if ('bucket' in props && props.bucket && props.path) {
      const { bucket, path, ...sharedProps } = props;
      return <BucketVideo ref={ref} bucket={bucket} path={path} {...sharedProps} />;
    }
    // SrcMode — 'src' is present
    const { src = '', ...sharedProps } = props as { src: string } & SharedVideoProps;
    return <VideoElement ref={ref} resolvedSrc={src} isLoading={false} {...sharedProps} />;
  }
);
