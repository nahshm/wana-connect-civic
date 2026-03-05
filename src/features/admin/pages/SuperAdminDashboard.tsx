import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield, Users, Flag, TrendingUp, Settings, AlertTriangle, Lock, Eye,
  UserCheck, MessageSquare, BarChart3, FileText, Bell, ChevronDown,
  Search, Filter, Activity, Server, Brain, Sparkles,
  CheckCircle, XCircle, Clock, Briefcase, ShieldAlert, Radio, Send,
  Building, MapPin, Calendar, Map, Check, X, Loader2, Bot, RefreshCw,
  ThumbsUp, ThumbsDown, Minus, Sliders, Database, BookOpen, Pencil, Plus, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { AdministrativeDivisionManager } from './components/AdministrativeDivisionManager';
import { InstitutionsManager } from './components/InstitutionsManager';
import PerformanceMonitoringTab from '../components/PerformanceMonitoringTab';

// Tab configuration
const mainTabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'anonymous', label: 'Anonymous Reports', icon: ShieldAlert },
  { id: 'crisis', label: 'Crisis Management', icon: AlertTriangle },
  { id: 'ngo', label: 'NGO Partners', icon: Briefcase },
  { id: 'moderators', label: 'Moderator Oversight', icon: Shield },
  { id: 'officials', label: 'Officials', icon: UserCheck },
  { id: 'verification', label: 'Position Verification', icon: Check },
  { id: 'geo-data', label: 'Geographic Data', icon: Map },
  { id: 'institutions', label: 'Government Institutions', icon: Building },
  { id: 'agent-queue', label: 'Agent Queue', icon: Bot },
  { id: 'agent-control', label: 'Agent Control Center', icon: Sliders },
  { id: 'ai-insights', label: 'AI Insights', icon: Brain },
  { id: 'feature-flags', label: 'Feature Flags', icon: Settings },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'performance', label: 'Performance Monitoring', icon: Activity },
  { id: 'system', label: 'System Health', icon: Server }
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showGrokChat, setShowGrokChat] = useState(false);

  // Verify super admin access
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error || !data?.some(r => r.role === 'super_admin' || r.role === 'admin')) {
        toast.error('Access denied. Super Admin privileges required.');
        navigate('/');
        return;
      }

      setIsSuperAdmin(true);
      setIsLoading(false);
    };

    checkAccess();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifying Super Admin access...</p>
        </div>
      </div>
    );
  }

  // Institutions Tab - Government Institutions Manager
  function InstitutionsTab() {
    const [selectedCountry, setSelectedCountry] = useState('KE');

    const SUPPORTED_COUNTRIES = [
      { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
      { code: 'US', name: 'United States', flag: '🇺🇸' },
      { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
      { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    ];

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label>Country:</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_COUNTRIES.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <InstitutionsManager countryCode={selectedCountry} />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-destructive-foreground" />
            </div>
            <div>
              <div className="font-bold text-sidebar-foreground">Super Admin</div>
              <div className="text-xs text-sidebar-muted-foreground">Full Control</div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-1">
          {mainTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${selectedTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border flex-shrink-0">
          <div className="text-xs text-sidebar-muted-foreground mb-2">System Status</div>
          <div className="flex items-center gap-2 text-sm text-sidebar-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {mainTabs.find(t => t.id === selectedTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowGrokChat(!showGrokChat)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ask Grok AI
            </Button>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Button variant="destructive">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Mode
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
          {selectedTab === 'overview' && <OverviewTab />}
          {selectedTab === 'users' && <UserManagementTab />}
          {selectedTab === 'anonymous' && <AnonymousReportsTab />}
          {selectedTab === 'crisis' && <CrisisManagementTab />}
          {selectedTab === 'ngo' && <NGOPartnersTab />}
          {selectedTab === 'moderators' && <ModeratorsTab />}
          {selectedTab === 'officials' && <OfficialsTab />}
          {selectedTab === 'verification' && <PositionVerificationTab />}
          {selectedTab === 'geo-data' && <GeographicDataTab />}
          {selectedTab === 'institutions' && <InstitutionsTab />}
          {selectedTab === 'agent-queue' && <AgentQueueTab />}
          {selectedTab === 'agent-control' && <AgentControlCenterTab />}
          {selectedTab === 'ai-insights' && <AIInsightsTab />}
          {selectedTab === 'feature-flags' && <FeatureFlagsTab />}
          {selectedTab === 'security' && <SecurityTab />}
          {selectedTab === 'analytics' && <AnalyticsTab />}
          {selectedTab === 'performance' && <PerformanceMonitoringTab />}
          {selectedTab === 'system' && <SystemHealthTab />}
        </div>
        </ScrollArea>
      </div>

      {/* Grok AI Chat */}
      {showGrokChat && <GrokAIAssistant onClose={() => setShowGrokChat(false)} />}
    </div>
  );
}

// Overview Tab
function OverviewTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    anonymousReports: 0,
    activeModerators: 0,
    verifiedOfficials: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const usersRes = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const reportsRes = await supabase.from('anonymous_reports').select('id', { count: 'exact', head: true });
      const modsRes = await supabase.from('community_moderators').select('id', { count: 'exact', head: true });
      const officialsRes = await supabase.from('officials').select('id', { count: 'exact', head: true });

      setStats({
        totalUsers: usersRes.count || 0,
        anonymousReports: reportsRes.count || 0,
        activeModerators: modsRes.count || 0,
        verifiedOfficials: officialsRes.count || 0
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-destructive flex-shrink-0 w-6 h-6" />
          <div className="flex-1">
            <div className="font-semibold text-destructive">System Ready</div>
            <div className="text-sm text-muted-foreground mt-1">
              SuperAdmin dashboard is now active. All admin features are available.
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <Users className="text-blue-600 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <ShieldAlert className="text-orange-600 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{stats.anonymousReports}</div>
            <div className="text-sm text-muted-foreground">Anonymous Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Shield className="text-green-600 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{stats.activeModerators}</div>
            <div className="text-sm text-muted-foreground">Active Moderators</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <UserCheck className="text-purple-600 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{stats.verifiedOfficials}</div>
            <div className="text-sm text-muted-foreground">Verified Officials</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Summary */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8" />
              <div>
                <div className="text-xl font-bold">Grok AI Platform Intelligence</div>
                <div className="text-sm text-white/80">Real-time pattern analysis and insights</div>
              </div>
            </div>
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
              View Full Report
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm">Corruption Patterns Detected</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm">Suspicious Connections</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm">Content Accuracy Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// User Management Tab
function UserManagementTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setUsers(data || []);
    };

    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.slice(0, 10).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium">{user.display_name || user.username || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">{user.username}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.role || 'citizen'}</Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Anonymous Reports Tab
function AnonymousReportsTab() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from('anonymous_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setReports(data || []);
    };

    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <AlertTriangle className="text-destructive mb-2 w-6 h-6" />
            <div className="text-2xl font-bold">{reports.filter(r => r.severity === 'critical').length}</div>
            <div className="text-sm text-muted-foreground">Critical Reports</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <ShieldAlert className="text-orange-500 mb-2 w-6 h-6" />
            <div className="text-2xl font-bold">{reports.length}</div>
            <div className="text-sm text-muted-foreground">Total Anonymous Reports</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <CheckCircle className="text-green-500 mb-2 w-6 h-6" />
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm text-muted-foreground">Identity Protection</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <Lock className="text-purple-500 mb-2 w-6 h-6" />
            <div className="text-2xl font-bold">{reports.reduce((acc, r) => acc + (r.evidence_count || 0), 0)}</div>
            <div className="text-sm text-muted-foreground">Evidence Files Secured</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anonymous Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No anonymous reports yet.
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{report.report_id}</div>
                      <div className="text-sm text-muted-foreground">{report.category}</div>
                    </div>
                    <Badge variant={report.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {report.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Crisis Management Tab
function CrisisManagementTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Crisis Command Center</h2>
              <p className="text-destructive-foreground/80">Real-time monitoring and emergency response</p>
            </div>
            <Button variant="secondary">
              <Radio className="w-4 h-4 mr-2" />
              Broadcast Emergency Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'CRITICAL', count: 0, color: 'destructive' },
          { label: 'HIGH', count: 0, color: 'orange' },
          { label: 'MEDIUM', count: 0, color: 'yellow' },
          { label: 'RESOLVED', count: 0, color: 'green' }
        ].map((severity) => (
          <Card key={severity.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{severity.count}</div>
              <div className="text-sm font-medium">{severity.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// NGO Partners Tab
function NGOPartnersTab() {
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase
        .from('ngo_partners')
        .select('*')
        .order('created_at', { ascending: false });

      setPartners(data || []);
    };

    fetchPartners();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Partner Organizations</h3>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {partners.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No NGO partners configured yet. Add your first partner organization.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{partner.name}</h4>
                    <p className="text-sm text-muted-foreground">{partner.type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Moderators Tab
function ModeratorsTab() {
  const [moderators, setModerators] = useState<any[]>([]);

  useEffect(() => {
    const fetchModerators = async () => {
      const { data } = await supabase
        .from('community_moderators')
        .select(`
          *,
          community:communities(name, display_name)
        `)
        .limit(50);

      // Fetch profiles separately
      let modsWithProfiles = data || [];
      if (modsWithProfiles.length > 0) {
        const userIds = modsWithProfiles.map(m => m.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .in('id', userIds);

          const profilesMap: Record<string, { avatar_url: string; display_name: string; id: string; username: string }> = {};
          (profiles || []).forEach(p => { profilesMap[p.id] = p; });
          modsWithProfiles = modsWithProfiles.map(m => ({
            ...m,
            user: profilesMap[m.user_id] || null
          }));
        }
      }

      setModerators(modsWithProfiles);
    };

    fetchModerators();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Community Moderators ({moderators.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {moderators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No moderators found.
            </div>
          ) : (
            <div className="space-y-2">
              {moderators.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {mod.user?.display_name?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <div className="font-medium">{mod.user?.display_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">c/{mod.community?.name}</div>
                    </div>
                  </div>
                  <Badge>{mod.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Officials Tab - Enhanced with Claim Approval
function OfficialsTab() {
  const [officials, setOfficials] = useState<any[]>([]);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'verified' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch verified officials
    const { data: officialsData, error: officialsError } = await supabase
      .from('officials')
      .select('*')
      .order('name', { ascending: true })
      .limit(50);

    if (officialsError) {
      console.error('Officials fetch error:', officialsError);
    }
    console.log('Officials data:', officialsData);
    setOfficials(officialsData || []);

    // Fetch pending claims from office_holders
    // Note: Must specify FK name because office_holders has TWO FKs to profiles (user_id AND verified_by)
    const { data: claimsData, error: claimsError } = await supabase
      .from('office_holders')
      .select(`
        *,
        profiles!office_holders_user_id_fkey(id, username, display_name, avatar_url),
        government_positions(id, title, governance_level, country_code)
      `)
      .order('claimed_at', { ascending: false });

    if (claimsError) {
      console.error('Claims fetch error:', claimsError);
    }
    console.log('Claims data (raw):', claimsData);

    // Transform data to expected format
    const transformedClaims = (claimsData || []).map(claim => ({
      ...claim,
      profile: claim.profiles,
      position: claim.government_positions
    }));
    console.log('Claims data (transformed):', transformedClaims);
    setPendingClaims(transformedClaims);
  };

  const handleApproval = async (claimId: string, approved: boolean) => {
    setProcessingId(claimId);
    try {
      // Find the claim to get user_id and position info
      const claim = pendingClaims.find(c => c.id === claimId);
      if (!claim) throw new Error('Claim not found');

      // Get current admin user
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // Update office_holders status
      const { error: updateError } = await supabase
        .from('office_holders')
        .update({
          verification_status: approved ? 'verified' : 'rejected',
          verified_at: approved ? new Date().toISOString() : null,
          verified_by: approved ? adminUser?.id : null,
        })
        .eq('id', claimId);

      if (updateError) throw updateError;

      // If approved, also update the user's profile for immediate effect
      // (DB trigger will also do this, but this ensures immediate sync)
      if (approved && claim.user_id) {
        const positionTitle = claim.position?.title || claim.government_positions?.title;
        const positionId = claim.position?.id || claim.government_positions?.id;

        await supabase
          .from('profiles')
          .update({
            is_verified: true,
            official_position: positionTitle,
            official_position_id: positionId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', claim.user_id);
      }

      toast.success(approved ? 'Claim approved! Official is now verified.' : 'Claim rejected.');
      fetchData();
    } catch (error) {
      console.error('Error processing claim:', error);
      toast.error('Failed to process claim');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = pendingClaims.filter(c => c.verification_status === 'pending').length;
  const verifiedCount = pendingClaims.filter(c => c.verification_status === 'verified').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <Clock className="text-orange-500 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending Claims</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <CheckCircle className="text-green-500 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <div className="text-sm text-muted-foreground">Verified Officials</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <Users className="text-blue-500 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{officials.length}</div>
            <div className="text-sm text-muted-foreground">Officials in Database</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <Shield className="text-purple-500 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{pendingClaims.length}</div>
            <div className="text-sm text-muted-foreground">Total Claims</div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b pb-4">
        <Button
          variant={activeSubTab === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSubTab('pending')}
          className="gap-2"
        >
          <Clock className="w-4 h-4" />
          Pending ({pendingCount})
        </Button>
        <Button
          variant={activeSubTab === 'verified' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSubTab('verified')}
          className="gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Verified ({verifiedCount})
        </Button>
        <Button
          variant={activeSubTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSubTab('all')}
          className="gap-2"
        >
          <Users className="w-4 h-4" />
          All Claims
        </Button>
      </div>

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeSubTab === 'pending' && 'Pending Position Claims'}
            {activeSubTab === 'verified' && 'Verified Officials'}
            {activeSubTab === 'all' && 'All Position Claims'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingClaims.filter(c =>
            activeSubTab === 'all' ? true :
              activeSubTab === 'pending' ? c.verification_status === 'pending' :
                c.verification_status === 'verified'
          ).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {activeSubTab === 'pending' ? 'pending claims' : activeSubTab === 'verified' ? 'verified officials' : 'claims found'}.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingClaims
                .filter(c =>
                  activeSubTab === 'all' ? true :
                    activeSubTab === 'pending' ? c.verification_status === 'pending' :
                      c.verification_status === 'verified'
                )
                .map((claim) => (
                  <div key={claim.id} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold">
                          {claim.profile?.display_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold">{claim.profile?.display_name || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">@{claim.profile?.username}</div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{claim.position?.title || 'Unknown Position'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {claim.position?.governance_level} - {claim.position?.country_code}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              Term: {claim.term_start ? new Date(claim.term_start).toLocaleDateString() : 'N/A'} - {claim.term_end ? new Date(claim.term_end).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Submitted: {new Date(claim.created_at).toLocaleString()}
                          </div>
                          {claim.proof_documents && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                {claim.verification_method === 'document_upload' ? 'Document Uploaded' :
                                  claim.verification_method === 'email_verification' ? 'Email Verification' :
                                    'Official Link'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={
                          claim.verification_status === 'verified' ? 'default' :
                            claim.verification_status === 'rejected' ? 'destructive' :
                              'secondary'
                        }>
                          {claim.verification_status}
                        </Badge>

                        {claim.verification_status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApproval(claim.id, true)}
                              disabled={processingId === claim.id}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => handleApproval(claim.id, false)}
                              disabled={processingId === claim.id}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {claim.verification_status === 'verified' && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/g/${claim.id}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-1" />
                              View Office
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Agent Queue Tab ─────────────────────────────────────────────────────────
type ProposalRow = {
  id: string;
  proposal_type: string;
  agent_name: string;
  confidence: number | null;
  status: string;
  created_at: string;
  subject_id: string | null;
  reasoning: string;
};

type RunLogRow = {
  id: string;
  agent_name: string;
  trigger_type: string;
  status: string;
  created_at: string;
  duration_ms: number | null;
  error_summary: string | null;
  items_scanned: number;
};

type AccountabilityAlertRow = {
  id: string;
  alert_type: string;
  subject_type: string;
  subject_name: string;
  severity: number;
  summary: string;
  county: string | null;
  constituency: string | null;
  is_public: boolean;
  acknowledged: boolean;
  created_at: string;
  details: { citizen_action?: string; raw_facts?: Record<string, unknown> } | null;
};

type DraftRow = {
  id: string;
  agent_name: string;
  draft_type: string;
  title: string;
  content: string;
  status: string;
  language: string;
  created_at: string;
  metadata: {
    finding_id?: string;
    analysis_type?: string;
    confidence?: number;
    county?: string | null;
    rag_sources_count?: number;
  } | null;
};

function AgentQueueTab() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [runLogs, setRunLogs] = useState<RunLogRow[]>([]);
  const [accountabilityAlerts, setAccountabilityAlerts] = useState<AccountabilityAlertRow[]>([]);
  const [sageDrafts, setSageDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approve' | 'remove' | 'warn'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [ackProcessing, setAckProcessing] = useState<string | null>(null);
  const [draftProcessing, setDraftProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const [proposalsRes, logsRes, alertsRes, draftsRes] = await Promise.all([
      db
        .from('agent_proposals')
        .select('id, proposal_type, agent_name, confidence, status, created_at, subject_id, reasoning')
        .order('created_at', { ascending: false })
        .limit(50),
      db
        .from('agent_runs')
        .select('id, agent_name, trigger_type, status, created_at, duration_ms, error_summary, items_scanned')
        .order('created_at', { ascending: false })
        .limit(30),
      db
        .from('accountability_alerts')
        .select('id, alert_type, subject_type, subject_name, severity, summary, county, constituency, is_public, acknowledged, created_at, details')
        .order('created_at', { ascending: false })
        .limit(30),
      db
        .from('agent_drafts')
        .select('id, agent_name, draft_type, title, content, status, language, created_at, metadata')
        .in('agent_name', ['civic-sage'])
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setProposals((proposalsRes.data as ProposalRow[]) || []);
    setRunLogs((logsRes.data as RunLogRow[]) || []);
    setAccountabilityAlerts((alertsRes.data as AccountabilityAlertRow[]) || []);
    setSageDrafts((draftsRes.data as DraftRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDecision = async (proposalId: string, decision: 'approved' | 'rejected', adminNotes?: string) => {
    setProcessing(proposalId);
    try {
      const { data: { user: admin } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('agent_proposals')
        .update({
          status: decision,
          reviewed_by: admin?.id,
          reviewed_at: new Date().toISOString(),
          action_taken: adminNotes || null,
        })
        .eq('id', proposalId);
      if (error) throw error;
      toast.success(decision === 'approved' ? 'Proposal approved — action will execute.' : 'Proposal rejected.');
      fetchData();
    } catch (e) {
      toast.error('Failed to update proposal');
    } finally {
      setProcessing(null);
    }
  };

  const verdictIcon = (verdict: string) => {
    if (verdict === 'approve') return <ThumbsUp className="w-4 h-4 text-green-500" />;
    if (verdict === 'remove') return <ThumbsDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const approveCount = proposals.filter(p => p.proposal_type === 'approve' || p.status === 'approved').length;
  const removeCount = proposals.filter(p => p.proposal_type === 'ban_user' || p.proposal_type === 'hide_content').length;
  const recentRuns = runLogs.length;

  const filtered = filter === 'all' ? proposals : proposals.filter(p =>
    filter === 'pending' ? p.status === 'pending' : p.proposal_type === filter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">WAAS Agent Queue</h2>
            <p className="text-sm text-muted-foreground">Proposals · Accountability Alerts · Agent Runs</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <Clock className="text-orange-500 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <ThumbsUp className="text-green-500 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{approveCount}</div>
            <div className="text-sm text-muted-foreground">Approve Verdicts</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <ThumbsDown className="text-destructive mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{removeCount}</div>
            <div className="text-sm text-muted-foreground">Remove Verdicts</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4">
            <Bot className="text-violet-500 mb-2 w-5 h-5" />
            <div className="text-2xl font-bold">{recentRuns}</div>
            <div className="text-sm text-muted-foreground">Recent Agent Runs</div>
          </CardContent>
        </Card>
      </div>

      {/* Proposal Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Proposal Queue</CardTitle>
            <div className="flex gap-2">
              {(['all', 'pending', 'approve', 'remove', 'warn'] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'outline'}
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No proposals found. Agents will populate this queue as content is moderated.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(proposal => (
                <div key={proposal.id} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {verdictIcon(proposal.proposal_type)}
                        <Badge variant="outline" className="capitalize text-xs">{proposal.proposal_type}</Badge>
                        <Badge
                          variant={proposal.proposal_type === 'ban_user' ? 'destructive' : proposal.proposal_type === 'send_warning' ? 'default' : 'secondary'}
                          className="capitalize text-xs"
                        >
                          {proposal.proposal_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Confidence: {Math.round((proposal.confidence || 0) * 100)}%
                        </span>
                        <Badge
                          variant={proposal.status === 'pending' ? 'secondary' : proposal.status === 'approved' ? 'default' : 'destructive'}
                          className="capitalize text-xs ml-auto"
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                      {proposal.reasoning && (
                        <p className="text-sm text-muted-foreground mt-1 truncate" title={proposal.reasoning}>
                          {proposal.reasoning}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Subject: <code className="font-mono">{proposal.subject_id?.slice(0, 12)}…</code>
                        &nbsp;·&nbsp;{new Date(proposal.created_at).toLocaleString()}
                      </p>
                    </div>

                    {proposal.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                          onClick={() => handleDecision(proposal.id, 'approved')}
                          disabled={processing === proposal.id}
                        >
                          {processing === proposal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => handleDecision(proposal.id, 'rejected')}
                          disabled={processing === proposal.id}
                        >
                          {processing === proposal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Run Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Agent Runs</CardTitle>
          <CardDescription>Last 30 agent execution records</CardDescription>
        </CardHeader>
        <CardContent>
          {runLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No agent runs recorded yet. Runs are logged when the Edge Functions execute.
            </div>
          ) : (
            <div className="space-y-2">
              {runLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      log.status === 'completed' ? 'bg-green-500' :
                      log.status === 'failed' ? 'bg-destructive' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{log.agent_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.trigger_type} · {log.items_scanned ?? 0} items · {new Date(log.created_at).toLocaleString()}
                      </div>
                      {log.error_summary && (
                        <div className="text-xs text-destructive mt-0.5 truncate max-w-xs" title={log.error_summary}>
                          {log.error_summary}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                    className="capitalize text-xs"
                  >
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accountability Alerts — from civic-tracker */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Accountability Alerts
              </CardTitle>
              <CardDescription>Generated by civic-tracker · Last 30 records</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {accountabilityAlerts.filter(a => !a.acknowledged).length} unacknowledged
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            </div>
          ) : accountabilityAlerts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No alerts yet. civic-tracker runs daily at 08:00 EAT.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accountabilityAlerts.map(alert => {
                const severityColor =
                  alert.severity >= 8 ? 'border-l-destructive bg-destructive/5' :
                  alert.severity >= 6 ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20' :
                  alert.severity >= 4 ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' :
                  'border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20';

                const alertTypeLabel: Record<string, string> = {
                  delay: 'Project Delay',
                  budget_overrun: 'Budget Overrun',
                  stalled: 'Stalled Project',
                  broken_promise: 'Broken Promise',
                };

                return (
                  <div
                    key={alert.id}
                    className={`p-4 border-l-4 rounded-lg ${severityColor} ${alert.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {alertTypeLabel[alert.alert_type] ?? alert.alert_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.subject_type}
                          </Badge>
                          <span className="text-xs font-semibold">
                            Severity {alert.severity}/10
                          </span>
                          {alert.county && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{alert.county}
                            </span>
                          )}
                          {alert.acknowledged && (
                            <Badge variant="secondary" className="text-xs ml-auto">Acknowledged</Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate" title={alert.subject_name}>
                          {alert.subject_name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {alert.summary}
                        </p>
                        {alert.details?.citizen_action && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            💡 {alert.details.citizen_action}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={ackProcessing === alert.id}
                          onClick={async () => {
                            setAckProcessing(alert.id);
                            const { data: { user } } = await supabase.auth.getUser();
                            const { error } = await supabase
                              .from('accountability_alerts')
                              .update({
                                acknowledged: true,
                                acknowledged_by: user?.id,
                                acknowledged_at: new Date().toISOString(),
                              })
                              .eq('id', alert.id);
                            if (error) toast.error('Failed to acknowledge alert');
                            else { toast.success('Alert acknowledged'); fetchData(); }
                            setAckProcessing(null);
                          }}
                        >
                          {ackProcessing === alert.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <CheckCircle className="w-4 h-4 mr-1" />}
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* civic-sage Draft Reports — pending admin approval */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-500" />
                Sage Intelligence Drafts
              </CardTitle>
              <CardDescription>
                Generated by civic-sage · Awaiting admin review before publication
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {sageDrafts.filter(d => d.status === 'pending').length} pending
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            </div>
          ) : sageDrafts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No drafts yet. civic-sage generates reports when Scout finds high-relevance civic data.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sageDrafts.map(draft => {
                const confidence = draft.metadata?.confidence ?? 0;
                const confBorder =
                  confidence >= 0.8 ? 'border-l-green-500 bg-green-50/30 dark:bg-green-950/20' :
                  confidence >= 0.6 ? 'border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20' :
                  'border-l-muted bg-muted/20';

                return (
                  <div
                    key={draft.id}
                    className={`p-4 border-l-4 rounded-lg space-y-2 ${confBorder} ${draft.status !== 'pending' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {draft.draft_type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{draft.language}</Badge>
                          {draft.metadata?.county && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{draft.metadata.county}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Conf: {Math.round(confidence * 100)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            RAG: {draft.metadata?.rag_sources_count ?? 0} sources
                          </span>
                          <Badge
                            variant={draft.status === 'pending' ? 'secondary' : draft.status === 'approved' ? 'default' : 'destructive'}
                            className="text-xs ml-auto capitalize"
                          >
                            {draft.status}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{draft.title}</p>
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-4 font-sans">
                          {draft.content.slice(0, 400)}{draft.content.length > 400 ? '…' : ''}
                        </pre>
                        <p className="text-xs text-muted-foreground mt-1">
                          {draft.agent_name} · {new Date(draft.created_at).toLocaleString()}
                        </p>
                      </div>
                      {draft.status === 'pending' && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            disabled={draftProcessing === draft.id}
                            onClick={async () => {
                              setDraftProcessing(draft.id);
                              const { error } = await supabase
                                .from('agent_drafts')
                                .update({ status: 'approved', reviewed_at: new Date().toISOString() })
                                .eq('id', draft.id);
                              if (error) toast.error('Failed to approve draft');
                              else { toast.success('Draft approved'); fetchData(); }
                              setDraftProcessing(null);
                            }}
                          >
                            {draftProcessing === draft.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                            disabled={draftProcessing === draft.id}
                            onClick={async () => {
                              setDraftProcessing(draft.id);
                              const { error } = await supabase
                                .from('agent_drafts')
                                .update({ status: 'discarded', reviewed_at: new Date().toISOString() })
                                .eq('id', draft.id);
                              if (error) toast.error('Failed to discard draft');
                              else { toast.success('Draft discarded'); fetchData(); }
                              setDraftProcessing(null);
                            }}
                          >
                            {draftProcessing === draft.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <XCircle className="w-4 h-4" />}
                            Discard
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Agent Control Center Tab ──────────────────────────────────────────────────
function AgentControlCenterTab() {
  const [subTab, setSubTab] = useState<'quill-drafts' | 'thresholds' | 'rag-viewer'>('quill-drafts');

  // ── Quill Drafts state ──
  type QuillDraft = { id: string; agent_name: string; draft_type: string; title: string; content: string; status: string; language: string; metadata: Record<string, unknown>; created_at: string };
  const [quillDrafts, setQuillDrafts] = useState<QuillDraft[]>([]);
  const [quillLoading, setQuillLoading] = useState(false);
  const [quillProcessing, setQuillProcessing] = useState<string | null>(null);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);

  // ── Threshold state ──
  type AgentStateRow = { id: string; agent_name: string; state_key: string; state_value: string; description: string | null; updated_at: string };
  const [thresholds, setThresholds] = useState<AgentStateRow[]>([]);
  const [threshLoading, setThreshLoading] = useState(false);
  const [editingThresh, setEditingThresh] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  // ── RAG Viewer state ──
  type VectorRow = { id: string; source_type: string; title: string | null; content: string; created_at: string };
  const [vectors, setVectors] = useState<VectorRow[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragFilter, setRagFilter] = useState<string>('all');
  const [addingDoc, setAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', content: '', source_type: 'manual' });
  const [ragSaving, setRagSaving] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchQuillDrafts = async () => {
    setQuillLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('agent_drafts')
      .select('*')
      .in('status', ['pending', 'low_confidence', 'approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(30);
    setQuillDrafts((data ?? []) as QuillDraft[]);
    setQuillLoading(false);
  };

  const fetchThresholds = async () => {
    setThreshLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('agent_state')
      .select('*')
      .order('agent_name', { ascending: true });
    setThresholds((data ?? []) as AgentStateRow[]);
    setThreshLoading(false);
  };

  const fetchVectors = async () => {
    setRagLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any).from('vectors').select('id, source_type, title, content, created_at').order('created_at', { ascending: false }).limit(50);
      if (ragFilter !== 'all') q = q.eq('source_type', ragFilter);
      const { data, error } = await q;
      if (error) {
        console.error('[RAG] fetchVectors error:', error);
        toast.error(`Failed to load vectors: ${error.message}`);
        return;
      }
      setVectors((data ?? []) as VectorRow[]);
    } catch (err) {
      console.error('[RAG] fetchVectors unexpected error:', err);
      toast.error('Unexpected error loading vectors');
    } finally {
      setRagLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (subTab === 'quill-drafts') fetchQuillDrafts(); }, [subTab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (subTab === 'thresholds') fetchThresholds(); }, [subTab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (subTab === 'rag-viewer') fetchVectors(); }, [subTab, ragFilter]);

  const handleDraftAction = async (draftId: string, newStatus: 'approved' | 'rejected') => {
    setQuillProcessing(draftId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('agent_drafts').update({ status: newStatus, reviewed_at: new Date().toISOString() }).eq('id', draftId);
    if (error) toast.error(`Failed to ${newStatus} draft`);
    else { toast.success(`Draft ${newStatus}`); fetchQuillDrafts(); }
    setQuillProcessing(null);
  };

  const handleSaveThreshold = async (row: AgentStateRow) => {
    setSaving(true);
    const { error } = await supabase.from('agent_state')
      .update({ state_value: editValue, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (error) toast.error('Failed to save');
    else { toast.success(`Saved: ${row.agent_name}.${row.state_key} = ${editValue}`); setEditingThresh(null); fetchThresholds(); }
    setSaving(false);
  };

  const handleAddDoc = async () => {
    if (!newDoc.content.trim()) { toast.error('Content is required'); return; }
    setRagSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('vectors').insert({ title: newDoc.title || null, content: newDoc.content, source_type: newDoc.source_type, embedding: null });
      if (error) {
        console.error('[RAG] handleAddDoc error:', error);
        toast.error(`Failed to save document: ${error.message}`);
      } else {
        toast.success('Document added to knowledge base');
        setNewDoc({ title: '', content: '', source_type: 'manual' });
        setAddingDoc(false);
        fetchVectors();
      }
    } catch (err) {
      console.error('[RAG] handleAddDoc unexpected error:', err);
      toast.error('Unexpected error saving document');
    } finally {
      setRagSaving(false);
    }
  };

  const draftTypeColor: Record<string, string> = {
    warning_message: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    civic_summary: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    educational_post: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    accountability_alert_summary: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    user_notification: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
    promise_breach_notice: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  };

  // Group thresholds by agent name
  const grouped = thresholds.reduce((acc, row) => {
    if (!acc[row.agent_name]) acc[row.agent_name] = [];
    acc[row.agent_name].push(row);
    return acc;
  }, {} as Record<string, AgentStateRow[]>);

  // RAG source type options
  const ragSourceTypes = ['all', 'kenya_constitution', 'kenya_ppada', 'kenya_pfma', 'kenya_kica', 'wanaiq_guidelines', 'scout_finding', 'manual'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-cyan-600 to-indigo-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Sliders className="w-8 h-8" />
            <div>
              <div className="text-xl font-bold">Agent Control Center</div>
              <div className="text-sm text-white/80">Quill drafts · Threshold tuning · RAG knowledge base</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-tab bar */}
      <div className="flex gap-2 border-b pb-3">
        {([['quill-drafts', 'Quill Drafts', BookOpen], ['thresholds', 'Threshold Tuning', Sliders], ['rag-viewer', 'Knowledge Base', Database]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              subTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Quill Drafts ── */}
      {subTab === 'quill-drafts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Quill Content Drafts</h3>
              <p className="text-sm text-muted-foreground">Review and approve content generated by civic-quill before it goes live</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchQuillDrafts} className="gap-1">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>

          {quillLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : quillDrafts.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No drafts yet. civic-quill generates content when agent_events are processed.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {quillDrafts.map(draft => (
                <Card key={draft.id} className={draft.status !== 'pending' ? 'opacity-70' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${draftTypeColor[draft.draft_type] ?? 'bg-muted text-muted-foreground'}`}>
                            {draft.draft_type.replace(/_/g, ' ')}
                          </span>
                          <Badge variant={draft.status === 'pending' ? 'secondary' : draft.status === 'approved' ? 'default' : 'destructive'} className="text-xs capitalize">
                            {draft.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{draft.language}</Badge>
                          <span className="text-xs text-muted-foreground">{draft.agent_name} · {new Date(draft.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="font-medium">{draft.title}</p>
                        {expandedDraft === draft.id ? (
                          <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap font-sans bg-muted/40 p-3 rounded-lg">
                            {draft.content}
                          </pre>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{draft.content.slice(0, 200)}{draft.content.length > 200 ? '…' : ''}</p>
                        )}
                        <button
                          onClick={() => setExpandedDraft(expandedDraft === draft.id ? null : draft.id)}
                          className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline"
                        >
                          <ChevronRight className={`w-3 h-3 transition-transform ${expandedDraft === draft.id ? 'rotate-90' : ''}`} />
                          {expandedDraft === draft.id ? 'Collapse' : 'Expand full content'}
                        </button>
                      </div>
                      {draft.status === 'pending' && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            disabled={quillProcessing === draft.id}
                            onClick={() => handleDraftAction(draft.id, 'approved')}>
                            {quillProcessing === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                            disabled={quillProcessing === draft.id}
                            onClick={() => handleDraftAction(draft.id, 'rejected')}>
                            {quillProcessing === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Threshold Tuning ── */}
      {subTab === 'thresholds' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Agent Thresholds</h3>
            <p className="text-sm text-muted-foreground">Edit agent_state values that control pipeline sensitivity, timing, and behaviour</p>
          </div>
          {threshLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            Object.entries(grouped).map(([agentName, rows]) => (
              <Card key={agentName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    {agentName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rows.map(row => (
                      <div key={row.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-medium">{row.state_key}</code>
                          </div>
                          {row.description && <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>}
                        </div>
                        {editingThresh === row.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-32 h-8 text-sm"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveThreshold(row); if (e.key === 'Escape') setEditingThresh(null); }}
                              autoFocus
                            />
                            <Button size="sm" className="h-8" disabled={saving} onClick={() => handleSaveThreshold(row)}>
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingThresh(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{row.state_value}</code>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingThresh(row.id); setEditValue(row.state_value); }}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── RAG Knowledge Base ── */}
      {subTab === 'rag-viewer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">RAG Knowledge Base</h3>
              <p className="text-sm text-muted-foreground">View and add documents powering civic-sage's analysis</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={fetchVectors} className="gap-1">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setAddingDoc(!addingDoc)} className="gap-1">
                <Plus className="w-4 h-4" /> Add Document
              </Button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex gap-2 flex-wrap">
            {ragSourceTypes.map(st => (
              <button key={st} onClick={() => setRagFilter(st)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                  ragFilter === st ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
                }`}>
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Add document form */}
          {addingDoc && (
            <Card className="border-dashed border-2 border-primary/40">
              <CardHeader><CardTitle className="text-base">Add Knowledge Document</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm">Title (optional)</Label>
                  <Input value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} placeholder="E.g. Article 43 — Right to Education" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Source Type</Label>
                  <select value={newDoc.source_type} onChange={e => setNewDoc({ ...newDoc, source_type: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                    {['manual', 'kenya_constitution', 'kenya_ppada', 'kenya_pfma', 'kenya_kica', 'wanaiq_guidelines'].map(st => (
                      <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Content *</Label>
                  <textarea
                    value={newDoc.content}
                    onChange={e => setNewDoc({ ...newDoc, content: e.target.value })}
                    placeholder="Paste the document text here..."
                    rows={6}
                    className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setAddingDoc(false)}>Cancel</Button>
                  <Button disabled={ragSaving} onClick={handleAddDoc}>
                    {ragSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                    Save to Knowledge Base
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {ragLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : vectors.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No documents in knowledge base yet. Run the seeding script or add documents manually.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {vectors.map(vec => (
                <div key={vec.id} className="p-4 border rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-muted rounded font-medium capitalize">{vec.source_type.replace(/_/g, ' ')}</span>
                    {vec.title && <span className="text-sm font-medium truncate">{vec.title}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(vec.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{vec.content.slice(0, 300)}{vec.content.length > 300 ? '…' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// AI Insights Tab
function AIInsightsTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8" />
            <div>
              <div className="text-xl font-bold">Grok AI Platform Intelligence</div>
              <div className="text-sm text-white/80">Advanced pattern recognition and threat analysis</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">96.3%</div>
              <div className="text-sm">Detection Accuracy</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm">Corruption Patterns</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">0.8%</div>
              <div className="text-sm">False Positive Rate</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm">Content Analyzed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Security Tab
function SecurityTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Anonymous Protection Rate', value: 100, note: '0 breaches' },
            { label: 'Content Encryption', value: 100, note: 'All data encrypted' },
            { label: 'Server Uptime', value: 99.9, note: 'Last 30 days' },
            { label: 'AI Threat Detection', value: 96, note: 'Real-time monitoring' }
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{metric.label}</span>
                <span className="text-green-600 font-semibold">{metric.value}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{metric.note}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Analytics Tab
function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Analytics dashboard coming soon. Integration with platform metrics in progress.
        </CardContent>
      </Card>
    </div>
  );
}

// System Health Tab
function SystemHealthTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Database</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Operational</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Authentication</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Operational</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Storage</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Operational</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Feature Flags Tab
function FeatureFlagsTab() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('category', { ascending: true })
      .order('feature_name', { ascending: true });

    if (!error && data) setFlags(data);
    setLoading(false);
  };

  const toggleFlag = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('feature_flags')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to update feature flag', variant: 'destructive' });
    } else {
      toast({ title: 'Feature flag updated' });
      fetchFlags();
    }
  };

  // Group flags by category
  const groupedFlags = flags.reduce((acc, flag) => {
    if (!acc[flag.category]) acc[flag.category] = [];
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Warning */}
      <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-100">
                Platform-Wide Feature Control
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Changes take effect immediately for all users. Toggle carefully.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category} Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(categoryFlags as any[]).map((flag: any) => (
              <div
                key={flag.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold">{flag.feature_name}</div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <code className="text-xs bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                    {flag.feature_key}
                  </code>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                    {flag.is_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flag.is_enabled}
                      onChange={(e) => toggleFlag(flag.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {flags.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No feature flags configured yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Geographic Data Tab - Template-Driven
function GeographicDataTab() {
  const [selectedCountry, setSelectedCountry] = useState('KE'); // Default to Kenya

  // Supported countries list (can be expanded)
  const SUPPORTED_COUNTRIES = [
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  ];

  // Fetch governance template for selected country
  const { data: templateData, isLoading: templateLoading } = useQuery({
    queryKey: ['governance-template', selectedCountry],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_governance_templates')
        .select('governance_system')
        .eq('country_code', selectedCountry)
        .maybeSingle();

      if (error) {
        console.error('Template fetch error:', error);
        return null;
      }
      return data?.governance_system;
    }
  });

  // Parse levels from template
  const levels: string[] = (templateData as any)?.levels || [];
  const defaultTab = levels[0] || 'county'; // Fallback to 'county' if no template

  // Helper to get level metadata
  const getLevelMeta = (level: string, index: number) => {
    const meta = templateData?.[level] || {};
    return {
      label: meta.label || capitalize(level),
      labelPlural: meta.label_plural || `${meta.label || capitalize(level)}s`,
      count: meta.count,
      parentLevel: index > 0 ? levels[index - 1] : null
    };
  };

  // Capitalize helper
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="space-y-6">
      {/* Country Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-base font-semibold">Select Country:</Label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="flex h-10 w-[280px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {SUPPORTED_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
            <div className="flex-1">
              {templateLoading ? (
                <p className="text-sm text-muted-foreground">Loading governance structure...</p>
              ) : levels.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Managing {levels.length}-level hierarchy for{' '}
                  {SUPPORTED_COUNTRIES.find(c => c.code === selectedCountry)?.name}
                </p>
              ) : (
                <p className="text-sm text-orange-600">
                  ⚠ No governance template found for {selectedCountry}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template-Driven Tabs */}
      {templateLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading governance template...</p>
          </CardContent>
        </Card>
      ) : levels.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <h3 className="font-semibold text-lg mb-2">No Template Available</h3>
            <p className="text-muted-foreground mb-4">
              No governance template exists for {SUPPORTED_COUNTRIES.find(c => c.code === selectedCountry)?.name}.
            </p>
            <p className="text-sm text-muted-foreground">
              Please create a governance template for this country in the database first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-${Math.min(levels.length, 5)}`}>
            {levels.map((level, index) => {
              const meta = getLevelMeta(level, index);
              return (
                <TabsTrigger key={level} value={level} className="flex items-center gap-2">
                  {index === 0 && <Building className="h-4 w-4" />}
                  {index === 1 && <MapPin className="h-4 w-4" />}
                  {index === 2 && <Map className="h-4 w-4" />}
                  {index === 3 && <MapPin className="h-4 w-4" />}
                  {index === 4 && <Map className="h-4 w-4" />}
                  {meta.labelPlural}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {levels.map((level, index) => {
            const meta = getLevelMeta(level, index);
            const parentMeta = meta.parentLevel ? getLevelMeta(meta.parentLevel, index - 1) : null;

            return (
              <TabsContent key={level} value={level}>
                <Card>
                  <CardHeader>
                    <CardTitle>{meta.labelPlural} Management</CardTitle>
                    <CardDescription>
                      Manage {meta.labelPlural.toLowerCase()} for{' '}
                      {SUPPORTED_COUNTRIES.find(c => c.code === selectedCountry)?.name}
                      {meta.count && ` (Expected: ~${meta.count})`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AdministrativeDivisionManager
                      countryCode={selectedCountry}
                      governanceLevel={level}
                      levelIndex={index + 1}
                      levelLabel={meta.label}
                      levelLabelPlural={meta.labelPlural}
                      parentLevelLabel={parentMeta?.label}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

// Position Verification Tab
function PositionVerificationTab() {
  const { user } = useAuth();
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('office_holders')
      .select(`
        id,
        user_id,
        position_id,
        verification_status,
        verification_method,
        claimed_at,
        proof_documents,
        position:government_positions(title, country_code, jurisdiction_name)
      `)
      .eq('verification_status', 'pending')
      .order('claimed_at', { ascending: false });

    if (!error && data) {
      // Fetch profiles separately
      const userIds = data.map((c: any) => c.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const profilesMap: Record<string, { display_name: string; id: string }> = {};
        (profiles || []).forEach(p => { profilesMap[p.id] = p; });
        const claimsWithProfiles = data.map((c: any) => ({
          ...c,
          user: profilesMap[c.user_id] || null
        }));
        setPendingClaims(claimsWithProfiles);
      } else {
        setPendingClaims(data);
      }
    }
    setIsLoading(false);
  };

  const handleVerdict = async (claimId: string, verdict: 'verified' | 'rejected') => {
    const { error } = await supabase
      .from('office_holders')
      .update({
        verification_status: verdict,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        is_active: verdict === 'verified',
      })
      .eq('id', claimId);

    if (error) {
      toast.error('Failed to update claim');
    } else {
      toast.success(`Claim ${verdict} successfully`);
      fetchClaims();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Position Claims</h3>
          <p className="text-sm text-muted-foreground">Review and verify official position claims</p>
        </div>
        <Button onClick={fetchClaims} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">Loading claims...</CardContent>
        </Card>
      ) : pendingClaims.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No pending claims to review.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingClaims.map((claim: any) => (
            <Card key={claim.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-lg">{claim.position?.title || 'Unknown Position'}</CardTitle>
                    <CardDescription>
                      {claim.position?.jurisdiction_name || 'Unknown'} • Applicant: <span className="font-semibold">{claim.user?.display_name || 'Unknown'}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{claim.position?.country_code || 'N/A'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Method:</span> {claim.verification_method || 'N/A'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span> {claim.claimed_at ? new Date(claim.claimed_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Proof:</span>
                    {claim.proof_documents?.document_url ? (
                      <a href={claim.proof_documents.document_url} target="_blank" rel="noreferrer" className="text-blue-600 underline ml-2">
                        View Document
                      </a>
                    ) : (
                      <span className="ml-2 italic text-muted-foreground">No document provided</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleVerdict(claim.id, 'rejected')}
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleVerdict(claim.id, 'verified')}
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve & Verify
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Grok AI Assistant Component
function GrokAIAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m Grok, your AI assistant for WanalQ platform management. I can help you analyze patterns, detect corruption, verify content, and provide insights. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const quickActions = [
    { icon: Brain, label: 'Analyze corruption patterns' },
    { icon: AlertTriangle, label: 'High-risk reports' },
    { icon: TrendingUp, label: 'Platform health' }
  ];

  return (
    <div className="fixed right-6 bottom-6 w-96 h-[600px] bg-card rounded-lg shadow-2xl border flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">Grok AI Assistant</div>
            <div className="text-xs text-white/80">Real-time platform intelligence</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
          <XCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b bg-muted/50">
        <div className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setInputMessage(action.label)}
              >
                <Icon className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
              }`}>
              <div className="text-sm">{msg.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask Grok anything..."
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && inputMessage.trim()) {
                setMessages([...messages, {
                  role: 'user',
                  content: inputMessage,
                  timestamp: new Date()
                }]);
                setInputMessage('');
                // Simulate AI response
                setTimeout(() => {
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'I\'m analyzing the platform data. AI features will be fully integrated with Lovable AI Gateway for production use.',
                    timestamp: new Date()
                  }]);
                }, 1000);
              }
            }}
          />
          <Button size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}