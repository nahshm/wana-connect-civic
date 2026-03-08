import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { FeedSortBar } from '@/components/feed/FeedSortBar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { FeedErrorBoundary } from '@/components/feed/FeedErrorBoundary';
import { UnifiedFeedItem, UnifiedFeedItemSkeleton } from '@/components/feed/UnifiedFeedItem';
import { EmptyFeedState } from '@/components/feed/EmptyFeedState';
import { useUnifiedFeed } from '@/hooks/useUnifiedFeed';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const [memberCommunityIds, setMemberCommunityIds] = useState<Set<string>>(new Set());

  // Unified feed for both guests and authenticated users
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useUnifiedFeed({
    userId: user?.id ?? undefined,
    limit: 10,
    sortBy
  });

  const feedItems = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

  // Batch membership check for community posts
  useEffect(() => {
    if (!user?.id || feedItems.length === 0) {
      setMemberCommunityIds(new Set());
      return;
    }

    const communityIds = [
      ...new Set(
        feedItems
          .filter(item => item.type === 'post' && item.data?.community_id)
          .map(item => item.data.community_id as string)
      )
    ];

    if (communityIds.length === 0) return;

    const checkMembership = async () => {
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id)
        .in('community_id', communityIds);

      if (memberships) {
        setMemberCommunityIds(new Set(memberships.map(m => m.community_id)));
      }
    };

    checkMembership();
  }, [user?.id, feedItems]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      console.error('Error fetching feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feed. Please try again.',
        variant: 'destructive',
      });
    }
  }, [isError, error, toast]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleInteraction = useCallback(() => {}, []);

  const handleJoinCommunity = useCallback(async (communityId: string, communityName: string) => {
    if (!user) {
      authModal.open('login');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({ community_id: communityId, user_id: user.id });

      if (error) throw error;

      setMemberCommunityIds(prev => new Set([...prev, communityId]));
      toast({
        title: 'Joined!',
        description: `You are now a member of ${communityName}.`,
      });
    } catch (err: any) {
      if (err?.code === '23505') {
        // Already a member
        setMemberCommunityIds(prev => new Set([...prev, communityId]));
      } else {
        console.error('Error joining community:', err);
        toast({
          title: 'Error',
          description: 'Could not join community. Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [user, authModal, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-6">
        <div className="flex-1 max-w-2xl space-y-4">
          <UnifiedFeedItemSkeleton />
          <UnifiedFeedItemSkeleton />
          <UnifiedFeedItemSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-6">
      {/* Main Content */}
      <div className="flex-1 max-w-2xl">
        <FeedSortBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <FeedErrorBoundary>
          <div className="space-y-4">
            {feedItems.length === 0 ? (
              <EmptyFeedState />
            ) : (
              feedItems.map(item => {
                const communityId = item.data?.community_id;
                const isMember = communityId ? memberCommunityIds.has(communityId) : true;

                return (
                  <UnifiedFeedItem
                    key={item.id}
                    item={item}
                    onInteraction={handleInteraction}
                    isMember={isMember}
                    onJoinCommunity={handleJoinCommunity}
                  />
                );
              })
            )}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef}>
              {isFetchingNextPage && <UnifiedFeedItemSkeleton />}
              {!hasNextPage && feedItems.length > 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  You've reached the end of the town hall.
                </p>
              )}
            </div>
          </div>
        </FeedErrorBoundary>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden xl:block xl:w-80 2xl:w-96 flex-shrink-0">
        <div className="fixed top-16 right-0 xl:w-80 2xl:w-96 h-[calc(100vh-4rem)] border-l border-border bg-background">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <RightSidebar />
            </div>
          </ScrollArea>
        </div>
      </aside>
    </div>
  );
}
