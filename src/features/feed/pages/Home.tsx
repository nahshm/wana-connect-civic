import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { FeedSortBar } from '@/components/feed/FeedSortBar';
import { PostSkeletonList, InlinePostSkeleton } from '@/components/feed/PostSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Users, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { SELECT_FIELDS } from '@/lib/select-fields';
import { Community } from '@/types';
import { useFeatureToggle } from '@/hooks/useFeatureToggle';
import { FeedErrorBoundary } from '@/components/feed/FeedErrorBoundary';
import { CommunityJoinDialog } from '@/components/community/CommunityJoinDialog';
import { UnifiedFeedItem, FeedItem, UnifiedFeedItemSkeleton, EmptyFeedState } from '@/components/feed/UnifiedFeedItem';
import { useUnifiedFeed } from '@/hooks/useUnifiedFeed';

interface BarazaSpace {
  space_id: string;
  title: string;
  description: string;
  host_user_id: string;
  participant_count: number;
  created_at: string;
}

export default function Index() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [barazaSpaces, setBarazaSpaces] = useState<BarazaSpace[]>([]);
  const barazaEnabled = useFeatureToggle('baraza');
  // const [isLoading, setIsLoading] = useState(true); // Handled by hook
  // const [isFetchingNextPage, setIsFetchingNextPage] = useState(false); // Handled by hook
  // const [hasNextPage, setHasNextPage] = useState(true); // Handled by hook
  // const [page, setPage] = useState(1); // Handled by hook
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');

  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [userCommunityIds, setUserCommunityIds] = useState<string[]>([]);
  const [joinDialogState, setJoinDialogState] = useState<{
    isOpen: boolean;
    communityId: string;
    communityName: string;
  } | null>(null);

  // React Query Hook for Unified Feed
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    isError,
    error
  } = useUnifiedFeed({ 
    userId: user?.id,
    limit: 10,
    sortBy 
  });

  // Flatten the pages into a single array of items
  const feedItems = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

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

  // Fetch communities
  const fetchCommunities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(SELECT_FIELDS.COMMUNITY_CARD)
        .order('member_count', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data) {
        const transformedCommunities: Community[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          displayName: item.display_name,
          description: item.description,
          memberCount: item.member_count,
          category: item.category,
        }));
        setCommunities(transformedCommunities);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  }, []);

  // Fetch Baraza spaces
  const fetchBarazaSpaces = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('baraza_spaces')
        .select('space_id,title,description,host_user_id,participant_count,created_at')
        .eq('is_live', true)
        .order('participant_count', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (data) {
        setBarazaSpaces(data);
      }
    } catch (error) {
      console.error('Error fetching baraza spaces:', error);
    }
  }, []);

  // Fetch user's community memberships
  const fetchUserCommunities = useCallback(async () => {
    if (!user) {
      setUserCommunityIds([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const communityIds = data.map(item => item.community_id);
        setUserCommunityIds(communityIds);
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  }, [user]);

  // Initial data fetch for sidebars (Feed is handled by React Query)
  useEffect(() => {
    const loadSideData = async () => {
      await Promise.all([
        fetchCommunities(),
        barazaEnabled ? fetchBarazaSpaces() : Promise.resolve(),
        fetchUserCommunities(),
      ]);
    };

    loadSideData();
  }, [fetchCommunities, fetchBarazaSpaces, barazaEnabled, fetchUserCommunities]);

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

  // Handle interactions (likes, votes, etc.)
  // This is a simplified handler that bubbles up from components
  const handleInteraction = useCallback(() => {
    // For now, we might just want to refresh or optimistically update
    // But since the feed is diverse, we let individual components handle their specific logic
    // and they can call this if a global refresh is needed.
  }, []);

  // Handle community join
  const handleJoinCommunity = useCallback((communityId: string, communityName: string) => {
    if (!user) {
      authModal.open('login');
      return;
    }
    setJoinDialogState({ isOpen: true, communityId, communityName });
  }, [user, authModal]);

  const handleJoinConfirm = useCallback(async () => {
    if (!user || !joinDialogState) return;

    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          user_id: user.id,
          community_id: joinDialogState.communityId,
          role: 'member'
        });

      if (error) throw error;

      setUserCommunityIds(prev => [...prev, joinDialogState.communityId]);
      
      toast({
        title: '✅ Joined!',
        description: `Welcome to c/${joinDialogState.communityName}!`,
        duration: 3000,
      });

      await fetchUserCommunities();
      setJoinDialogState(null);
    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: 'Failed to join',
        description: 'Could not join community. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user, joinDialogState, toast, fetchUserCommunities]);

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-6">
        <div className="flex-1 max-w-3xl space-y-6">
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
        {/* Sort Bar - currently mostly visual for Unified Feed as rpc handles sort */}
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
              feedItems.map(item => (
                <UnifiedFeedItem
                  key={item.id}
                  item={item}
                  onInteraction={handleInteraction}
                />
              ))
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

        {/* Live Baraza Spaces */}
        {barazaEnabled && barazaSpaces.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Live Baraza Spaces
              </CardTitle>
              <CardDescription>
                Join live audio discussions on civic matters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {barazaSpaces.map(space => (
                <div key={space.space_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{space.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {space.participant_count} participants • Live now
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link to={`/baraza/${space.space_id}`}>Join</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="hidden xl:block xl:w-80 2xl:w-96 flex-shrink-0">
        <div className="fixed top-16 right-0 xl:w-80 2xl:w-96 h-[calc(100vh-4rem)] border-l border-border bg-background">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4 sm:space-y-6">
              <RightSidebar />
              
              {/* Popular Communities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Popular Communities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {communities.slice(0, 5).map(community => (
                    <div key={community.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{community.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(community.memberCount ?? 0).toLocaleString()} members
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(community.category ?? '').replace('-', ' ')}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/communities" className="flex items-center gap-2">
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Community Join Dialog */}
      {joinDialogState && (
        <CommunityJoinDialog
          isOpen={joinDialogState.isOpen}
          onClose={() => setJoinDialogState(null)}
          communityName={joinDialogState.communityName}
          onJoin={handleJoinConfirm}
        />
      )}
    </div>
  );
}