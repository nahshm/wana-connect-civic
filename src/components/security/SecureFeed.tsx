// src/components/security/SecureFeed.tsx
// PURPOSE: Wraps every infinite-scroll feed to prevent scrapers from
// triggering pagination. Fixes the active CSS/scrollbar breakage.

import { useEffect, useRef, useCallback } from 'react';
import { isLikelyBot } from '../../lib/botDetection';

interface SecureFeedProps {
  children: React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function SecureFeed({
  children,
  onLoadMore,
  hasMore,
  isLoading
}: SecureFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lastLoadRef = useRef<number>(0);
  const COOLDOWN_MS = 800; // No human scrolls faster than this

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (!entries[0].isIntersecting) return;
    if (!hasMore || isLoading) return;

    // Block if tab is hidden — scrapers often run in background tabs
    if (document.hidden) return;

    // Block if bot signals detected
    if (isLikelyBot()) return;

    // Rate limit: prevent rapid-fire pagination
    const now = Date.now();
    if (now - lastLoadRef.current < COOLDOWN_MS) return;
    lastLoadRef.current = now;

    onLoadMore();
  }, [onLoadMore, hasMore, isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '100px', // Only look 100px ahead, not 500-1000px
    });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [handleIntersection]);

  return (
    <div>
      {children}
      {hasMore && (
        <div
          ref={sentinelRef}
          style={{ height: 1, visibility: 'hidden' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
