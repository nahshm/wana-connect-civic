import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, FileText, Users, Target, BarChart3, GraduationCap, Shield,
  Phone, HelpCircle, Megaphone, Sword } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dashboard components
import { CitizenIdentityPanel } from '@/components/dashboard/CitizenIdentityPanel';
import { QuickActionBar } from '@/components/dashboard/QuickActionBar';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { DashboardQuestWidget } from '@/components/dashboard/DashboardQuestWidget';
import { DashboardLeaderboardWidget } from '@/components/dashboard/DashboardLeaderboardWidget';
import { MyActions } from '@/components/dashboard/MyActions';
import { CommunityIssuesFeed } from '@/components/dashboard/CommunityIssuesFeed';

const CivicDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 pb-6">
      {/* ========= 3-COLUMN CIVIC CONTROL ROOM ========= */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4 lg:gap-5">

        {/* ─────── LEFT SIDEBAR: Citizen Identity ─────── */}
        <aside className="lg:sticky lg:top-16 lg:self-start space-y-4 order-2 lg:order-1">
          <CitizenIdentityPanel />

          {/* Civic Resources (compact) */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">📚 Resources</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1 space-y-1">
              {[
                { icon: Megaphone, label: 'Public Participation', to: '/participation', color: 'text-orange-400' },
                { icon: Phone, label: 'Govt. Contacts', to: '/contacts', color: 'text-blue-400' },
                { icon: GraduationCap, label: 'Civic Education', to: '/c/CivicEducation', color: 'text-purple-400' },
                { icon: HelpCircle, label: 'Help Center', to: '/help', color: 'text-green-400' },
                { icon: Shield, label: 'Privacy Policy', to: '/privacy', color: 'text-zinc-400' },
              ].map(({ icon: Icon, label, to, color }) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs gap-2"
                  asChild
                >
                  <Link to={to}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* ─────── CENTER: Main Content Area ─────── */}
        <main className="min-w-0 space-y-4 order-1 lg:order-2">
          {/* Quick Action Bar */}
          <QuickActionBar />

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-5 h-10 bg-muted/50 rounded-xl p-1">
              <TabsTrigger
                value="overview"
                className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="my-actions"
                className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Actions</span>
              </TabsTrigger>
              <TabsTrigger
                value="community"
                className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Community</span>
              </TabsTrigger>
              <TabsTrigger
                value="quests"
                className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Sword className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quests</span>
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              <DashboardOverview />
            </TabsContent>

            {/* My Actions Tab */}
            <TabsContent value="my-actions" className="mt-4">
              <MyActions />
            </TabsContent>

            {/* Community Tab */}
            <TabsContent value="community" className="mt-4">
              <CommunityIssuesFeed />
            </TabsContent>

            {/* Quests Tab */}
            <TabsContent value="quests" className="mt-4">
              <DashboardQuestWidget fullView />
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link to="/feed/budget">
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        Budget Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        Track government budget allocations and spending
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/feed/policy">
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-400" />
                        Policy Updates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        Latest policy changes and legislation
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/c/CivicEducation">
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-400" />
                        Civic Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        Learn about your rights and civic duties
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* ─────── RIGHT SIDEBAR: Gamification & Social ─────── */}
        <aside className="lg:sticky lg:top-16 lg:self-start space-y-4 order-3">
          <DashboardQuestWidget />
          <DashboardLeaderboardWidget />
        </aside>
      </div>
    </div>
  );
};

export default CivicDashboard;
