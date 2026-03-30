// src/components/security/SecureImage.tsx
// PURPOSE: Prevents right-click save, drag-to-desktop, and direct
// image downloading for civic education content images.
// Updated to automatically handle authenticated media via blob URLs.

import { useFetchBlobUrl } from '../../lib/secureMedia';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SecureImage({ src, alt, className, style }: SecureImageProps) {
  const finalSrc = useFetchBlobUrl(src);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', userSelect: 'none', ...style }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={finalSrc || src} // Show original (may be loading spinner/placeholder) if blob not yet ready
        alt={alt}
        className={className}
        draggable={false}
        style={{ 
          display: 'block', 
          pointerEvents: 'none',
          opacity: finalSrc ? 1 : 0.5,
          transition: 'opacity 0.2s ease-in'
        }}
      />
      {/* Transparent overlay intercepts right-click and drag */}
      <div
        style={{
          position: 'absolute', inset: 0,
          zIndex: 1, cursor: 'default',
          WebkitUserDrag: 'none',
        } as React.CSSProperties}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
