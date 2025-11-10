import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Users, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardData {
  countyName: string;
  constituencyName: string;
  wardName: string;
  mpName: string;
  mcaName: string;
  localPosts: any[];
  trendingDiscussions: any[];
  onboardingProgress: number;
}

const CivicDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Get user profile with location
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          counties:county_id(name),
          constituencies:constituency_id(name),
          wards:ward_id(name)
        `)
        .eq('id', user.id)
        .single();

      // Get local posts from ward
      const { data: localPosts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id(username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get trending discussions
      const { data: trendingPosts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id(username, display_name, avatar_url)
        `)
        .order('upvotes', { ascending: false })
        .limit(5);

      setData({
        countyName: profile?.counties?.name || 'N/A',
        constituencyName: profile?.constituencies?.name || 'N/A',
        wardName: profile?.wards?.name || 'N/A',
        mpName: 'Your MP', // TODO: Link to actual MP
        mcaName: 'Your MCA', // TODO: Link to actual MCA
        localPosts: localPosts || [],
        trendingDiscussions: trendingPosts || [],
        onboardingProgress: 100,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in {data.wardName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Your Location Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Your Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Ward</p>
              <p className="font-semibold">{data.wardName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Constituency</p>
              <p className="font-semibold">{data.constituencyName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">County</p>
              <p className="font-semibold">{data.countyName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Your Representatives Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Representatives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">MP</p>
              <p className="font-semibold">{data.mpName}</p>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Send Message
              </Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MCA</p>
              <p className="font-semibold">{data.mcaName}</p>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/create-post">
                <FileText className="w-4 h-4 mr-2" />
                Report an Issue
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/communities">
                <Users className="w-4 h-4 mr-2" />
                Join Communities
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/projects">
                <TrendingUp className="w-4 h-4 mr-2" />
                Track Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Local Issues</CardTitle>
            <CardDescription>Recent posts from {data.wardName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.localPosts.length > 0 ? (
              data.localPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm line-clamp-1">{post.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {post.upvotes} votes
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No local issues yet. Be the first to report!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trending Discussions */}
        <Card>
          <CardHeader>
            <CardTitle>Trending in {data.countyName}</CardTitle>
            <CardDescription>Hot discussions in your county</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.trendingDiscussions.length > 0 ? (
              data.trendingDiscussions.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm line-clamp-1">{post.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {post.comment_count} comments
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trending discussions yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CivicDashboard;
