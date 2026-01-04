import React, { useState, useEffect, useCallback } from 'react';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { PostCard } from '@/components/posts/PostCard';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { TrendingCarousel } from '@/components/feed/TrendingCarousel';
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
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  // Posts fetched via usePosts hook
  // handleVote now uses useVote hook defined above
  if (isLoading) {
    return <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-6">
        <div className="flex-1 max-w-3xl space-y-6">
          <PostSkeletonList count={5} viewMode={viewMode} />
        </div>
      </div>;
  }
  const sortedPosts = posts.sort((a, b) => {
    switch (sortBy) {
      case 'new':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'top':
        return b.upvotes - b.downvotes - (a.upvotes - a.downvotes);
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
  return <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-6">
      {/* Main Content */}
      <div className="flex-1 max-w-3xl space-y-6">
        {/* Welcome Section */}
        {!user && <Card className="bg-gradient-to-r from-civic-green/10 to-civic-blue/10 border-civic-green/20">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to ama</CardTitle>
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
          </Card>}

        {/* Trending Carousel */}
        <TrendingCarousel />

        {/* Feed Header */}
        <FeedHeader sortBy={sortBy} onSortChange={setSortBy} viewMode={viewMode} onViewModeChange={setViewMode} />

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? <Card className="bg-gradient-to-br from-civic-green/5 to-civic-blue/5 border-civic-green/20">
              <CardContent className="py-12 px-8">
                <div className="text-center mb-8">
                  <MessageSquare className="h-16 w-16 text-civic-blue mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-4 text-civic-blue">Welcome to ama!</h2>
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
                  {user ? <Button asChild className="bg-civic-green hover:bg-civic-green/90">
                      <Link to="/create" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Your First Post
                      </Link>
                    </Button> : <Button asChild className="bg-civic-green hover:bg-civic-green/90">
                      <Link to="/auth" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Join ama Community
                      </Link>
                    </Button>}
                  <Button variant="outline" asChild>
                    <Link to="/communities">Explore Communities</Link>
                  </Button>
                </div>
              </CardContent>
            </Card> : sortedPosts.map(post => <PostCard key={post.id} post={{
          id: post.id,
          title: post.title,
          content: post.content,
          author: {
            id: post.author.id,
            username: post.author.username,
            displayName: post.author.displayName,
            avatar: post.author.avatar,
            isVerified: post.author.isVerified,
            role: post.author.role as 'citizen' | 'official' | 'expert' | 'journalist'
          },
          community: post.community ? {
            id: post.community.id,
            name: post.community.name,
            displayName: post.community.displayName,
            description: post.community.description,
            memberCount: post.community.memberCount,
            category: post.community.category as 'governance' | 'civic-education' | 'accountability' | 'discussion'
          } : undefined,
          createdAt: post.createdAt,
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          commentCount: post.commentCount,
          userVote: post.userVote,
          tags: post.tags,
          contentSensitivity: post.contentSensitivity,
          isNgoVerified: post.isNgoVerified,
          media: post.media
        }} onVote={handleVote} />)}
        </div>

        {/* Live Baraza Spaces */}
        {barazaEnabled && barazaSpaces.length > 0 && <Card>
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
              {barazaSpaces.map(space => <div key={space.space_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{space.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {space.participant_count} participants • Live now
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link to={`/baraza/${space.space_id}`}>Join</Link>
                  </Button>
                </div>)}
            </CardContent>
          </Card>}
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
              {communities.slice(0, 5).map(community => <div key={community.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{community.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {community.memberCount.toLocaleString()} members
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {community.category.replace('-', ' ')}
                  </Badge>
                </div>)}
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
    </div>;
}