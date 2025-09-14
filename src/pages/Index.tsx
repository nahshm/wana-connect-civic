import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { PostCard } from '@/components/posts/PostCard';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = useState('trending');
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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <Header />
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
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          
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

              {/* Posts Feed */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                </TabsList>

                <TabsContent value="trending" className="space-y-4">
                  {posts.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Be the first to start a conversation in your community
                        </p>
                        {user && (
                          <Button asChild>
                            <Link to="/create">Create First Post</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map(post => (
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
                </TabsContent>

                <TabsContent value="recent" className="space-y-4">
                  {posts
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(post => (
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
                    ))}
                </TabsContent>

                <TabsContent value="popular" className="space-y-4">
                  {posts
                    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
                    .map(post => (
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
                    ))}
                </TabsContent>
              </Tabs>
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}