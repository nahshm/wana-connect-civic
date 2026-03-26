import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FeedSortBar } from '@/components/feed/FeedSortBar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { FeedErrorBoundary } from '@/components/feed/FeedErrorBoundary';
import { UnifiedFeedItem, UnifiedFeedItemSkeleton } from '@/components/feed/UnifiedFeedItem';
import { EmptyFeedState } from '@/components/feed/EmptyFeedState';
import { useUnifiedFeed } from '@/hooks/useUnifiedFeed';
import { supabase } from '@/integrations/supabase/client';
import { HomeSidebar } from '@/components/feed/HomeSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Index() {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const [memberCommunityIds, setMemberCommunityIds] = useState<Set<string>>(new Set());

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

  // Batch membership check
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

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
      toast({ title: 'Joined!', description: `You are now a member of ${communityName}.` });
    } catch (err: unknown) {
      const pgError = err as { code?: string };
      if (pgError?.code === '23505') {
        setMemberCommunityIds(prev => new Set([...prev, communityId]));
      } else {
        toast({ title: 'Error', description: 'Could not join community.', variant: 'destructive' });
      }
    }
  }, [user, authModal, toast]);

  return (
    <div className="w-full min-h-screen bg-transparent px-0 sm:px-4">
      <div className="max-w-[1000px] mx-auto grid grid-cols-1 xl:grid-cols-[640px_312px] gap-6 relative overflow-visible">
        {/* Feed Column */}
        <div className="min-w-0 py-4">
          <div className="w-full">
            <FeedSortBar
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <FeedErrorBoundary>
              {isLoading ? (
                <div className="divide-y divide-border/50">
                  <UnifiedFeedItemSkeleton />
                  <UnifiedFeedItemSkeleton />
                  <UnifiedFeedItemSkeleton />
                </div>
              ) : feedItems.length === 0 ? (
                <EmptyFeedState />
              ) : (
                <div className="divide-y divide-border/50">
                  {feedItems.map(item => {
                    const communityId = item.data?.community_id;
                    const isMember = communityId ? memberCommunityIds.has(communityId) : true;
                    return (
                      <UnifiedFeedItem
                        key={item.id}
                        item={item}
                        isMember={isMember}
                        onJoinCommunity={handleJoinCommunity}
                      />
                    );
                  })}
                  <div ref={loadMoreRef}>
                    {isFetchingNextPage && <UnifiedFeedItemSkeleton />}
                    {!hasNextPage && feedItems.length > 0 && (
                      <p className="text-center text-muted-foreground text-sm py-8">
                        You've reached the end of the feed.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </FeedErrorBoundary>
          </div>
        </div>

        {/* Right Sidebar — Phase 9: Flush Alignment */}
        <aside className="hidden xl:block w-[312px] h-fit sticky top-0 z-20 py-4">
          <ScrollArea className="h-[calc(100vh-64px)] w-full rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4 space-y-6">
              <HomeSidebar userId={user?.id} />
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
