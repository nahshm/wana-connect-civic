// src/components/security/SecureVideo.tsx
// PURPOSE: Removes the browser's native download button from video
// controls and prevents right-click context menu on video elements.
// Updated to automatically handle authenticated media via blob URLs.

import { useEffect, useRef, forwardRef } from 'react';
import { useFetchBlobUrl } from '../../lib/secureMedia';

interface SecureVideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const SecureVideo = forwardRef<HTMLVideoElement, SecureVideoProps>(
  function SecureVideo(
    { 
      src, 
      poster, 
      className, 
      autoPlay = false, 
      muted = false, 
      playsInline = true,
      controls = true,
      onPlay,
      onPause,
      onEnded
    },
    ref
  ) {
    const internalRef = useRef<HTMLVideoElement>(null);
    const finalSrc = useFetchBlobUrl(src);

    useEffect(() => {
      // Block keyboard shortcuts for saving
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && ['s', 'u'].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <video
        ref={ref ?? internalRef}
        src={finalSrc || src} // Show original (may be loading spinner/placeholder) if blob not yet ready
        poster={poster}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          width: '100%',
          opacity: finalSrc ? 1 : 0.5,
          transition: 'opacity 0.2s ease-in'
        }}
      />
    );
  }
);
