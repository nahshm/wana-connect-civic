import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin,
  Users,
  MessageSquare,
  Target,
  Flag,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react';

interface UserLocation {
  county: string;
  constituency: string;
  ward: string;
}

export const WelcomeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserLocation();
  }, [user]);

  const loadUserLocation = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          county_id,
          constituency_id,
          ward_id,
          counties (name),
          constituencies (name),
          wards (name)
        `)
        .eq('id', user.id)
        .single();

      if (profile) {
        setLocation({
          county: (profile.counties as any)?.name || '',
          constituency: (profile.constituencies as any)?.name || '',
          ward: (profile.wards as any)?.name || '',
        });
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: MessageSquare,
      title: 'Create Your First Post',
      description: 'Share an issue or start a discussion in your community',
      action: () => navigate('/create-post'),
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Award className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to WanaIQ! 🎉
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            You're all set up and ready to make a difference in your community
          </p>
          {location && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 px-4 py-2 rounded-full">
              <MapPin className="w-4 h-4" />
              <span>{location.ward}, {location.constituency}, {location.county}</span>
            </div>
          )}
        </div>

        {/* What's Next Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            What's Next?
          </h2>
          <p className="text-muted-foreground mb-6">
            Here are some quick actions to help you get started on your civic journey
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${action.bgColor}`}>
                      <action.icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Your Civic Journey */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Your Civic Journey
            </CardTitle>
            <CardDescription>
              Complete these tasks over the next 7 days to unlock badges and earn karma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  1
                </div>
                <span className="text-muted-foreground">Introduce yourself in your ward community</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                  2
                </div>
                <span className="text-muted-foreground">View and follow your MP/MCA</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                  3
                </div>
                <span className="text-muted-foreground">Report a local issue</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                  4
                </div>
                <span className="text-muted-foreground">Comment on a trending discussion</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="text-center mt-8">
          <Button size="lg" onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;
