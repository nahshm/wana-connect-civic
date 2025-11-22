import React, { useState, useEffect, useCallback } from 'react';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { PostCard } from '@/components/posts/PostCard';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Users, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Community, Post, PostMedia } from '@/types';
import { useFeatureToggle } from '@/hooks/useFeatureToggle';

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
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      // Fetch posts with author, community, and official information
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
          communities!posts_community_id_fkey (id, name, display_name, description, member_count, category),
          officials!posts_official_id_fkey (id, name, position),
          post_media!post_media_post_id_fkey (*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Fetch user votes if authenticated
      let userVotes: { [postId: string]: 'up' | 'down' } = {};
      if (user && postsData) {
        const postIds = postsData.map(post => post.id);
        const { data: votesData } = await supabase
          .from('votes')
          .select('post_id, vote_type')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        if (votesData) {
          votesData.forEach(vote => {
            userVotes[vote.post_id] = vote.vote_type as 'up' | 'down';
          });
        }
      }

      // Transform the data to match our interface
      const transformedPosts: Post[] = postsData?.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author: {
          id: post.profiles?.id || '',
          username: post.profiles?.username || 'anonymous',
          displayName: post.profiles?.display_name || post.profiles?.username || 'Anonymous User',
          avatar: post.profiles?.avatar_url,
          isVerified: post.profiles?.is_verified,
          role: post.profiles?.role as 'citizen' | 'official' | 'expert' | 'journalist',
        },
        community: post.communities ? {
          id: post.communities.id,
          name: post.communities.name,
          displayName: post.communities.display_name,
          description: post.communities.description || '',
          memberCount: post.communities.member_count || 0,
          category: post.communities.category as 'governance' | 'civic-education' | 'accountability' | 'discussion',
        } : undefined,
        upvotes: post.upvotes || 0,
        downvotes: post.downvotes || 0,
        commentCount: post.comment_count || 0,
        tags: post.tags || [],
        createdAt: new Date(post.created_at),
        userVote: userVotes[post.id] || null,
        contentSensitivity: (post.content_sensitivity as any) || 'public',
        isNgoVerified: post.is_ngo_verified || false,
        media: post.post_media?.map(m => ({
          id: m.id.toString(),
          post_id: m.post_id,
          file_path: m.file_path,
          filename: m.filename,
          file_type: m.file_type,
          file_size: m.file_size,
        })) || [],
      })) || [];

      setPosts(transformedPosts);

      // Fetch communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })
        .limit(5);

      if (communitiesError) throw communitiesError;
      const transformedCommunities = (communitiesData || []).map(community => ({
        id: community.id,
        name: community.name,
        displayName: community.display_name,
        description: community.description || '',
        memberCount: community.member_count,
        category: community.category as 'governance' | 'civic-education' | 'accountability' | 'discussion',
        isFollowing: false, // TODO: Fetch user following status
      }));
      setCommunities(transformedCommunities);

      // TODO: Fetch live Baraza spaces when service is available
      // For now, keeping empty array as Baraza service is not running
      if (barazaEnabled) {
        try {
          const response = await fetch('http://localhost:5000/api/baraza/spaces');
          if (response.ok) {
            const data = await response.json();
            setBarazaSpaces(data.spaces || []);
          } else {
            setBarazaSpaces([]);
          }
        } catch (error) {
          console.error('Error fetching Baraza spaces:', error);
          setBarazaSpaces([]);
        }
      } else {
        setBarazaSpaces([]);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: `Failed to load posts: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on posts",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote
          await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            post_id: postId,
            vote_type: voteType,
          });
      }

      // Refresh posts to show updated vote counts
      fetchData();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const sortedPosts = posts.sort((a, b) => {
    switch (sortBy) {
      case 'new':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'rising':
        // Simple rising algorithm: recent posts with good engagement
        const aScore = (a.upvotes - a.downvotes) / Math.max(1, Math.floor((Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60)));
        const bScore = (b.upvotes - b.downvotes) / Math.max(1, Math.floor((Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60)));
        return bScore - aScore;
      case 'hot':
      default:
        // Hot algorithm: balance of votes and recency
        const aHot = a.upvotes + a.commentCount - Math.floor((Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60));
        const bHot = b.upvotes + b.commentCount - Math.floor((Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60));
        return bHot - aHot;
    }
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-screen-xl mx-auto px-4 py-6">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl space-y-6">
        {/* Welcome Section */}
        {!user && (
          <Card className="bg-gradient-to-r from-civic-green/10 to-civic-blue/10 border-civic-green/20">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to WanaIQ</CardTitle>
              <CardDescription className="text-lg">
                Kenya's premier civic engagement platform. Join discussions, track government promises, and participate in democracy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button asChild className="bg-civic-green hover:bg-civic-green/90">
                  <Link to="/auth">Get Started</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/communities">Browse Communities</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Post CTA */}
        {user && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-muted-foreground">What's on your mind about civic matters?</p>
                </div>
                <Button asChild className="bg-civic-blue hover:bg-civic-blue/90">
                  <Link to="/create" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Post
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feed Header */}
        <FeedHeader
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="bg-gradient-to-br from-civic-green/5 to-civic-blue/5 border-civic-green/20">
              <CardContent className="py-12 px-8">
                <div className="text-center mb-8">
                  <MessageSquare className="h-16 w-16 text-civic-blue mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-4 text-civic-blue">Welcome to WanaIQ!</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Kenya's premier civic engagement platform. Here's what you can do:
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
                        Join WanaIQ Community
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
                post={{
                  id: post.id,
                  title: post.title,
                  content: post.content,
                  author: {
                    id: post.author.id,
                    username: post.author.username,
                    displayName: post.author.displayName,
                    avatar: post.author.avatar,
                    isVerified: post.author.isVerified,
                    role: post.author.role as 'citizen' | 'official' | 'expert' | 'journalist',
                  },
                  community: post.community ? {
                    id: post.community.id,
                    name: post.community.name,
                    displayName: post.community.displayName,
                    description: post.community.description,
                    memberCount: post.community.memberCount,
                    category: post.community.category as 'governance' | 'civic-education' | 'accountability' | 'discussion',
                  } : undefined,
                  createdAt: post.createdAt,
                  upvotes: post.upvotes,
                  downvotes: post.downvotes,
                  commentCount: post.commentCount,
                  userVote: post.userVote,
                  tags: post.tags,
                  contentSensitivity: post.contentSensitivity,
                  isNgoVerified: post.isNgoVerified,
                  media: post.media,
                }}
                onVote={handleVote}
              />
            ))
          )}
        </div>

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

      {/* Right Sidebar */}
      <div className="hidden lg:block w-80">
        <div className="sticky top-24 space-y-6">
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
                      {community.memberCount.toLocaleString()} members
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {community.category.replace('-', ' ')}
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
    </div>
  );
}
