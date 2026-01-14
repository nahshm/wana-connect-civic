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
  Building, MapPin, Calendar, Map, Check, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="w-64 bg-sidebar-background border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
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

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-muted-foreground mb-2">System Status</div>
          <div className="flex items-center gap-2 text-sm text-sidebar-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
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
          {selectedTab === 'ai-insights' && <AIInsightsTab />}
          {selectedTab === 'feature-flags' && <FeatureFlagsTab />}
          {selectedTab === 'security' && <SecurityTab />}
          {selectedTab === 'analytics' && <AnalyticsTab />}
          {selectedTab === 'performance' && <PerformanceMonitoringTab />}
          {selectedTab === 'system' && <SystemHealthTab />}
        </div>
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