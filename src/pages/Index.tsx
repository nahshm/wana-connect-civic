import React, { useState, useEffect } from 'react';
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

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified?: boolean;
    role?: string;
  };
  community?: {
    id: string;
    name: string;
    display_name: string;
    category: string;
  };
  official?: {
    id: string;
    name: string;
    position: string;
  };
  upvotes: number;
  downvotes: number;
  comment_count: number;
  tags: string[];
  created_at: string;
  user_vote?: 'up' | 'down' | null;
}

export default function Index() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch posts with author, community, and official information
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
          communities (id, name, display_name, category),
          officials (id, name, position)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Transform the data to match our interface
      const transformedPosts = postsData?.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author: {
          id: post.profiles.id,
          username: post.profiles.username || 'Anonymous',
          display_name: post.profiles.display_name || 'Anonymous User',
          avatar_url: post.profiles.avatar_url,
          is_verified: post.profiles.is_verified,
          role: post.profiles.role,
        },
        community: post.communities,
        official: post.officials,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        comment_count: post.comment_count,
        tags: post.tags || [],
        created_at: post.created_at,
        user_vote: null, // TODO: Fetch user vote if authenticated
      })) || [];

      setPosts(transformedPosts);

      // Fetch communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })
        .limit(5);

      if (communitiesError) throw communitiesError;
      setCommunities(communitiesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id);
          
          // Update post count
          const updateField = voteType === 'up' ? 'upvotes' : 'downvotes';
          await supabase
            .from('posts')
            .update({ [updateField]: posts.find(p => p.id === postId)![updateField] - 1 })
            .eq('id', postId);
        } else {
          // Update vote
          await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
          
          // Update post counts
          const post = posts.find(p => p.id === postId)!;
          const updates = voteType === 'up' 
            ? { upvotes: post.upvotes + 1, downvotes: post.downvotes - 1 }
            : { upvotes: post.upvotes - 1, downvotes: post.downvotes + 1 };
          
          await supabase
            .from('posts')
            .update(updates)
            .eq('id', postId);
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
        
        // Update post count
        const updateField = voteType === 'up' ? 'upvotes' : 'downvotes';
        await supabase
          .from('posts')
          .update({ [updateField]: posts.find(p => p.id === postId)![updateField] + 1 })
          .eq('id', postId);
      }

      // Refresh posts
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
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'rising':
        // Simple rising algorithm: recent posts with good engagement
        const aScore = (a.upvotes - a.downvotes) / Math.max(1, Math.floor((Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60)));
        const bScore = (b.upvotes - b.downvotes) / Math.max(1, Math.floor((Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60)));
        return bScore - aScore;
      case 'hot':
      default:
        // Hot algorithm: balance of votes and recency
        const aHot = a.upvotes + a.comment_count - Math.floor((Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60));
        const bHot = b.upvotes + b.comment_count - Math.floor((Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60));
        return bHot - aHot;
    }
  });

  return (
    <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
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
                    displayName: post.author.display_name,
                    avatar: post.author.avatar_url,
                    isVerified: post.author.is_verified,
                    role: post.author.role as 'citizen' | 'official' | 'expert' | 'journalist',
                  },
                  community: post.community ? {
                    id: post.community.id,
                    name: post.community.name,
                    displayName: post.community.display_name,
                    description: '',
                    memberCount: 0,
                    category: post.community.category as 'governance' | 'civic-education' | 'accountability' | 'discussion',
                  } : undefined,
                  createdAt: new Date(post.created_at),
                  upvotes: post.upvotes,
                  downvotes: post.downvotes,
                  commentCount: post.comment_count,
                  userVote: post.user_vote,
                  tags: post.tags,
                }}
                onVote={handleVote}
              />
            ))
          )}
        </div>
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
                    <p className="font-medium text-sm">{community.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {community.member_count.toLocaleString()} members
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