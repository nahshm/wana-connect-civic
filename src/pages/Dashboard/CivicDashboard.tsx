import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, TrendingUp, Users, FileText, CheckCircle2, BarChart3, GraduationCap, Megaphone, Phone, HelpCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MyActions } from '@/components/dashboard/MyActions';
import { GamificationWidgets } from '@/components/gamification/GamificationWidgets';

interface DashboardData {
  countyName: string;
  constituencyName: string;
  wardName: string;
  mpName: string;
  mpId?: string;
  mcaName: string;
  mcaId?: string;
  governorName?: string;
  governorId?: string;
  localPosts: any[];
  trendingDiscussions: any[];
  onboardingProgress: number;
  userAvatar?: string;
  userDisplayName?: string;
  userBanner?: string;
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

      // Fetch officials based on user's location
      const { data: officials } = await supabase
        .from('officials')
        .select('*')
        .or(`ward_id.eq.${profile?.ward_id},constituency_id.eq.${profile?.constituency_id},county_id.eq.${profile?.county_id}`);

      // Find specific officials by level
      const mca = officials?.find(o => o.level === 'mca');
      const mp = officials?.find(o => o.level === 'mp');
      const governor = officials?.find(o => o.level === 'governor');

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
        mpName: mp?.name || 'MP not yet registered',
        mpId: mp?.id,
        mcaName: mca?.name || 'MCA not yet registered',
        mcaId: mca?.id,
        governorName: governor?.name || 'Governor not found',
        governorId: governor?.id,
        localPosts: localPosts || [],
        trendingDiscussions: trendingPosts || [],
        onboardingProgress: 100,
        userAvatar: profile?.avatar_url,
        userDisplayName: profile?.display_name || profile?.username,
        userBanner: (profile as any)?.banner_url,
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
    <div className="container mx-auto px-2 sm:px-4 pb-6">
      {/* Dashboard Header with Banner */}
      <div className="w-full bg-card border border-border rounded-lg overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-16 sm:h-20 md:h-24 lg:h-28 w-full bg-muted relative">
          {data.userBanner ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${data.userBanner})` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          )}
        </div>

        {/* Header Content */}
        <div className="px-4 sm:px-6">
          <div className="relative flex flex-col sm:flex-row items-start sm:items-end pb-4 -mt-8 sm:-mt-12 mb-2">
            {/* Avatar */}
            <div className="relative mr-0 sm:mr-4 mb-4 sm:mb-0">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 border-4 border-card rounded-full">
                <AvatarImage src={data.userAvatar || undefined} />
                <AvatarFallback className="text-2xl sm:text-3xl lg:text-4xl bg-primary text-primary-foreground">
                  {data.userDisplayName?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Welcome Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" />
                Here's what's happening in {data.wardName}
              </p>
            </div>
          </div>
        </div>
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
              <Link to="/dashboard/report">
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
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/dashboard/analytics">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gamification Overview */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Your Civic Impact</h2>
        <GamificationWidgets />
      </div>

      {/* Insights & Analysis Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">📊 Insights & Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget Analysis Card */}
          <Link to="/feed/budget">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Budget Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track and analyze government budget allocations and spending
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Policy Updates Card */}
          <Link to="/feed/policy">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Policy Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Stay informed about latest policy changes and legislation
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Civic Education Card */}
          <Link to="/c/CivicEducation">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                  Civic Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn about your rights, responsibilities, and civic duties
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Civic Resources Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">📚 Civic Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4 justify-start text-left" asChild>
            <Link to="/participation">
              <div className="flex items-start gap-3">
                <Megaphone className="w-5 h-5 mt-0.5 text-orange-500" />
                <div>
                  <p className="font-semibold">Public Participation</p>
                  <p className="text-xs text-muted-foreground">Engage in public forums</p>
                </div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-4 justify-start text-left" asChild>
            <Link to="/contacts">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-semibold">Government Contacts</p>
                  <p className="text-xs text-muted-foreground">Directory of officials</p>
                </div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-4 justify-start text-left" asChild>
            <Link to="/education">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 mt-0.5 text-green-500" />
                <div>
                  <p className="font-semibold">Civic Education Hub</p>
                  <p className="text-xs text-muted-foreground">Learning resources</p>
                </div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-4 justify-start text-left" asChild>
            <Link to="/help">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 mt-0.5 text-purple-500" />
                <div>
                  <p className="font-semibold">Help Center</p>
                  <p className="text-xs text-muted-foreground">Get support</p>
                </div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto py-4 justify-start text-left" asChild>
            <Link to="/privacy">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 mt-0.5 text-gray-500" />
                <div>
                  <p className="font-semibold">Privacy Policy</p>
                  <p className="text-xs text-muted-foreground">Your data protection</p>
                </div>
              </div>
            </Link>
          </Button>
        </div>
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

        {/* My Projects Card */}
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Projects you've reported</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Project data would be loaded here */}
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Track your submitted projects here
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/projects/submit">Post a Project</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Actions Card */}
        <MyActions />
      </div>
    </div>
  );
};

export default CivicDashboard;
