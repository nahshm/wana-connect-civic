import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { PostCard } from '@/components/posts/PostCard';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { TrendingCarousel } from '@/components/feed/TrendingCarousel';
import { PostSkeletonList, InlinePostSkeleton } from '@/components/feed/PostSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Users, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SELECT_FIELDS } from '@/lib/select-fields';
import { Community, Post, PostMedia } from '@/types';
import { useFeatureToggle } from '@/hooks/useFeatureToggle';
import { FeedErrorBoundary } from '@/components/feed/FeedErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';
import { CommunityJoinDialog } from '@/components/community/CommunityJoinDialog';

interface BarazaSpace {
  space_id: string;
  title: string;
  description: string;
  host_user_id: string;
  participant_count: number;
  created_at: string;
}

export default function Index() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [barazaSpaces, setBarazaSpaces] = useState<BarazaSpace[]>([]);
  const barazaEnabled = useFeatureToggle('baraza');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');

  const { user } = useAuth();
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // NEW: Track user's community memberships for hybrid feed
  const [userCommunityIds, setUserCommunityIds] = useState<string[]>([]);
  const [joinDialogState, setJoinDialogState] = useState<{
    isOpen: boolean;
    communityId: string;
    communityName: string;
  } | null>(null);

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum: number, sortType: string) => {
    try {
      const limit = 10;
      const from = (pageNum - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          community:communities(*),
          media:post_media(*),
          user_votes:votes(vote_type)
        `)
        .range(from, to);

      // Apply sorting
      switch (sortType) {
        case 'new':
          query = query.order('created_at', { ascending: false });
          break;
        case 'top':
          query = query.order('upvotes', { ascending: false });
          break;
        case 'hot':
        case 'rising':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const transformedPosts: Post[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          author: {
            id: item.author.id,
            username: item.author.username,
            displayName: item.author.display_name,
            avatar: item.author.avatar_url,
            isVerified: item.author.is_verified,
            officialPosition: item.author.official_position,
            role: item.author.role,
          },
          community: item.community ? {
            id: item.community.id,
            name: item.community.name,
            displayName: item.community.display_name,
            description: item.community.description,
            memberCount: item.community.member_count,
            category: item.community.category,
          } : undefined,
          createdAt: new Date(item.created_at),
          upvotes: item.upvotes || 0,
          downvotes: item.downvotes || 0,
          commentCount: item.comment_count || 0,
          userVote: item.user_votes?.[0]?.vote_type,
          tags: item.tags || [],
          contentSensitivity: item.content_sensitivity,
          isNgoVerified: item.is_ngo_verified,
          media: item.media || [],
        }));

        if (pageNum === 1) {
          setPosts(transformedPosts);
        } else {
          setPosts(prev => [...prev, ...transformedPosts]);
        }

        setHasNextPage(data.length === limit);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Fetch communities
  const fetchCommunities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(SELECT_FIELDS.COMMUNITY_CARD) // Selective fields
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
        .select('space_id,title,description,host_user_id,participant_count,created_at') // Only needed fields
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

  // NEW: Fetch user's community memberships for hybrid feed
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

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchPosts(1, sortBy),
        fetchCommunities(),
        barazaEnabled ? fetchBarazaSpaces() : Promise.resolve(),
        fetchUserCommunities(), // NEW: Fetch user's communities
      ]);
      setIsLoading(false);
    };

    loadInitialData();
  }, [sortBy, barazaEnabled, fetchPosts, fetchCommunities, fetchBarazaSpaces]);

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage) return;

    setIsFetchingNextPage(true);
    const nextPage = page + 1;
    await fetchPosts(nextPage, sortBy);
    setPage(nextPage);
    setIsFetchingNextPage(false);
  }, [isFetchingNextPage, hasNextPage, page, sortBy, fetchPosts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage && hasNextPage) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMorePosts, isFetchingNextPage, hasNextPage]);

  // NEW: Handle community join request
  const handleJoinCommunity = useCallback((communityId: string, communityName: string) => {
    setJoinDialogState({ isOpen: true, communityId, communityName });
  }, []);

  // NEW: Execute community join
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

      // Update local state
      setUserCommunityIds(prev => [...prev, joinDialogState.communityId]);
      
      toast({
        title: '✅ Joined!',
        description: `Welcome to c/${joinDialogState.communityName}!`,
        duration: 3000,
      });

      // Fetch updated communities
      await fetchUserCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: 'Failed to join',
        description: 'Could not join community. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw for dialog to handle
    }
  }, [user, joinDialogState, toast, fetchUserCommunities]);

  // Handle vote
  const handleVote = useCallback(async (postId: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote on posts.',
        variant: 'destructive',
      });
      return;
    }

    // Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id !== postId) return post;

        let newUpvotes = post.upvotes;
        let newDownvotes = post.downvotes;
        let newUserVote: 'up' | 'down' | undefined = voteType;

        // Remove previous vote
        if (post.userVote === 'up') newUpvotes--;
        if (post.userVote === 'down') newDownvotes--;

        // Add new vote or toggle off
        if (post.userVote === voteType) {
          newUserVote = undefined;
        } else {
          if (voteType === 'up') newUpvotes++;
          if (voteType === 'down') newDownvotes++;
        }

        return {
          ...post,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: newUserVote,
        };
      })
    );

    try {
      const currentPost = posts.find(p => p.id === postId);
      const wasVoted = currentPost?.userVote === voteType;

      if (wasVoted) {
        // Remove vote
        await supabase
          .from('votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Upsert vote
        await supabase
          .from('votes')
          .upsert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType,
          }, {
            onConflict: 'post_id,user_id'
          });
        
        // Show success toast for new vote
        if (voteType === 'up') {
          toast({
            title: '✅ Upvoted!',
            description: 'Your upvote has been recorded.',
            duration: 2000,
          });
        } else {
          toast({
            title: 'Downvoted',
            description: 'Your feedback has been recorded.',
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to register vote. Please try again.',
        variant: 'destructive',
      });
      // Revert optimistic update on error
      await fetchPosts(1, sortBy);
    }
  }, [user, posts, toast, fetchPosts, sortBy]);

  // Memoized sorted posts
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      switch (sortBy) {
        case 'new':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'top':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'rising': {
          const aScore = (a.upvotes - a.downvotes) / Math.max(1, Math.floor((Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60)));
          const bScore = (b.upvotes - b.downvotes) / Math.max(1, Math.floor((Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60)));
          return bScore - aScore;
        }
        case 'hot':
        default: {
          const aHot = a.upvotes + a.commentCount - Math.floor((Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60));
          const bHot = b.upvotes + b.commentCount - Math.floor((Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60));
          return bHot - aHot;
        }
      }
    });
  }, [posts, sortBy]);

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-6">
        <div className="flex-1 max-w-3xl space-y-6">
          <PostSkeletonList count={5} viewMode={viewMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-6">
      {/* Main Content */}
      <div className="flex-1 max-w-3xl space-y-6">

        {/* Trending Carousel */}
        <TrendingCarousel />

        {/* Feed Header */}
        <FeedHeader
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Posts Feed - wrapped in error boundary */}
        <FeedErrorBoundary>
          <div className="space-y-4">
            {posts.length === 0 ? (
              <Card className="bg-gradient-to-br from-civic-green/5 to-civic-blue/5 border-civic-green/20">
                <CardContent className="py-12 px-8">
                  <div className="text-center mb-8">
                    <MessageSquare className="h-16 w-16 text-civic-blue mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4 text-civic-blue">Welcome to ama!</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Your civic engagement platform. Here's what you can do:
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-civic-green flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Start Your First Civic Conversation
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="p-3 bg-background rounded-lg border border-civic-green/20 hover:border-civic-green/40 transition-colors cursor-pointer">
                          "What should every Kenyan know about county budgets?"
                        </div>
                        <div className="p-3 bg-background rounded-lg border border-civic-blue/20 hover:border-civic-blue/40 transition-colors cursor-pointer">
                          "How can we track our MP's promises effectively?"
                        </div>
                        <div className="p-3 bg-background rounded-lg border border-civic-orange/20 hover:border-civic-orange/40 transition-colors cursor-pointer">
                          "What civic issue affects your neighborhood most?"
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-civic-blue flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Featured Educational Content
                      </h3>
                      <div className="space-y-2 text-sm">
                        <Link to="/communities" className="block p-3 bg-background rounded-lg border border-civic-green/20 hover:border-civic-green/40 transition-colors">
                          📚 Understanding Public Participation
                        </Link>
                        <Link to="/officials" className="block p-3 bg-background rounded-lg border border-civic-blue/20 hover:border-civic-blue/40 transition-colors">
                          🏛️ Your Elected Officials Guide
                        </Link>
                        <Link to="/communities" className="block p-3 bg-background rounded-lg border border-civic-orange/20 hover:border-civic-orange/40 transition-colors">
                          💰 Budget Transparency 101
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {user ? (
                      <Button asChild className="bg-civic-green hover:bg-civic-green/90">
                        <Link to="/create" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create Your First Post
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="bg-civic-green hover:bg-civic-green/90">
                        <Link to="/auth" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Join ama Community
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" asChild>
                      <Link to="/communities">Explore Communities</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sortedPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onVote={handleVote}
                  isMember={!post.community || userCommunityIds.includes(post.community.id)}
                  onJoinCommunity={handleJoinCommunity}
                />
              ))
            )}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef}>
              {isFetchingNextPage && <InlinePostSkeleton />}
              {!hasNextPage && posts.length > 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">You've reached the end</p>
              )}
            </div>
          </div>
        </FeedErrorBoundary>

        {/* Live Baraza Spaces */}
        {barazaEnabled && barazaSpaces.length > 0 && (
          <Card>
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

      {/* Right Sidebar - Fixed positioning with responsive height */}
      <aside className="hidden xl:block xl:w-80 2xl:w-96 flex-shrink-0">
        <div className="fixed top-16 right-0 xl:w-80 2xl:w-96 h-[calc(100vh-4rem)] overflow-y-auto border-l border-border bg-background">
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