// src/components/security/SecureImage.tsx
// PURPOSE: Renders private bucket images through the Cloudflare Worker proxy,
// preventing right-click save, drag-to-desktop, and direct URL access.
//
// Two usage modes:
//   1. Preferred: <SecureImage bucket="media" path="user/photo.jpg" alt="..." />
//      → uses getMediaUrl() + useFetchBlobUrl() internally
//   2. Legacy / external: <SecureImage src="https://..." alt="..." />
//      → passes src directly without proxy (for OG images, thumbnails, etc.)

import React from 'react';
import { cn } from '@/lib/utils';
import { useMediaUrl } from '@/lib/secureMedia';
import type { PrivateBucket } from '@/lib/secureMedia';

// ─── Props ────────────────────────────────────────────────────────────────────

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

type SecureImageProps = (BucketMode | SrcMode) & {
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** onClick for lightbox / zoom use-cases */
  onClick?: (resolvedSrc: string) => void;
};

// ─── Internal: handles bucket mode ───────────────────────────────────────────

function BucketImage({
  bucket,
  path,
  alt,
  className,
  style,
  onClick,
}: Required<Pick<BucketMode, 'bucket' | 'path'>> & Pick<SecureImageProps, 'alt' | 'className' | 'style' | 'onClick'>) {
  const blobUrl = useMediaUrl(bucket, path);
  return (
    <BaseSecureImage
      resolvedSrc={blobUrl}
      isLoading={!blobUrl}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
    />
  );
}

// ─── Internal: renders the actual element ────────────────────────────────────

function BaseSecureImage({
  resolvedSrc,
  isLoading,
  alt,
  className,
  style,
  onClick,
}: {
  resolvedSrc: string;
  isLoading: boolean;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (src: string) => void;
}) {
  return (
    <div
      className={cn('relative select-none', isLoading && 'media-loading', className)}
      style={{ display: 'inline-block', ...style }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {resolvedSrc && (
        <img
          src={resolvedSrc}
          alt={alt}
          className={cn('block w-full h-full object-cover transition-opacity duration-200', isLoading ? 'opacity-0' : 'opacity-100')}
          draggable={false}
          style={{ pointerEvents: 'none' }}
          onClick={onClick ? () => onClick(resolvedSrc) : undefined}
        />
      )}
      {/* Transparent overlay blocks right-click and drag on the img */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          cursor: onClick ? 'zoom-in' : 'default',
          WebkitUserDrag: 'none',
        } as React.CSSProperties}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onClick={onClick && resolvedSrc ? () => onClick(resolvedSrc) : undefined}
      />
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function SecureImage({ bucket, path, src, alt, className, style, onClick }: SecureImageProps) {
  if (bucket && path) {
    return <BucketImage bucket={bucket} path={path} alt={alt} className={className} style={style} onClick={onClick} />;
  }
  // External / already-resolved src — no proxy needed
  return (
    <BaseSecureImage
      resolvedSrc={src!}
      isLoading={false}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
    />
  );
}
