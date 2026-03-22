import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle, CheckCircle2, Clock, Users, FileText, TrendingUp,
  BarChart3, Shield, Building2, MapPin, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface OverviewStats {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  totalSupportGiven: number;
}

interface ImpactScore {
  impact_rating: number;
  trust_tier: string;
}

interface ProfileLocation {
  county: string | null;
  county_id: string | null;
}

interface OfficialInfo {
  id: string;
  name: string;
  position: string;
  photo_url: string | null;
}

// ── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, accent, children, onClick }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden rounded-xl border border-border/60 p-4 bg-card hover:border-primary/30 transition-colors group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full ${accent} opacity-10 group-hover:opacity-20 transition-opacity`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {children}
      </div>
      <div className={`p-2 rounded-lg ${accent} bg-opacity-10`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  </div>
);

// ── Trend Arrow ──────────────────────────────────────────────────────────────

const TrendIndicator = ({ current, previous }: { current: number; previous: number }) => {
  const delta = current - previous;
  if (delta > 0) return <span className="inline-flex items-center text-[10px] text-green-500 font-medium"><ArrowUpRight className="w-3 h-3" />+{delta}</span>;
  if (delta < 0) return <span className="inline-flex items-center text-[10px] text-red-500 font-medium"><ArrowDownRight className="w-3 h-3" />{delta}</span>;
  return <span className="inline-flex items-center text-[10px] text-muted-foreground font-medium"><Minus className="w-3 h-3" />0</span>;
};

// ── Main Component ───────────────────────────────────────────────────────────

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch user location
  const { data: profile } = useQuery<ProfileLocation | null>({
    queryKey: ['dashboard-profile-location', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('county, county_id')
        .eq('id', user.id)
        .single();
      return data as ProfileLocation | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Community Pulse — current week + previous week for trend
  const { data: communityPulse } = useQuery({
    queryKey: ['community-pulse', profile?.county],
    queryFn: async () => {
      if (!profile?.county) return { current: 0, previous: 0 };
      const now = Date.now();
      const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      const since14d = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [currentRes, previousRes] = await Promise.all([
        supabase
          .from('civic_actions')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true)
          .ilike('location_text', `%${profile.county}%`)
          .gte('created_at', since7d),
        supabase
          .from('civic_actions')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true)
          .ilike('location_text', `%${profile.county}%`)
          .gte('created_at', since14d)
          .lt('created_at', since7d),
      ]);
      return { current: currentRes.count ?? 0, previous: previousRes.count ?? 0 };
    },
    enabled: !!profile?.county,
    staleTime: 3 * 60 * 1000,
  });

  // Civic impact score
  const { data: impactScore } = useQuery<ImpactScore | null>({
    queryKey: ['dashboard-impact-score', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('civic_impact_scores')
        .select('impact_rating, trust_tier')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as ImpactScore | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Your Representatives — top 3 by position
  const { data: representatives } = useQuery<OfficialInfo[]>({
    queryKey: ['dashboard-reps', profile?.county_id],
    queryFn: async () => {
      if (!profile?.county_id) return [];
      const { data } = await supabase
        .from('officials')
        .select('id, name, position, photo_url')
        .eq('county_id', profile.county_id)
        .is('deprecated_at', null)
        .order('position')
        .limit(3);
      return (data ?? []) as OfficialInfo[];
    },
    enabled: !!profile?.county_id,
    staleTime: 10 * 60 * 1000,
  });

  // Total reps count
  const { data: repCount } = useQuery<number>({
    queryKey: ['dashboard-reps-count', profile?.county_id],
    queryFn: async () => {
      if (!profile?.county_id) return 0;
      const { count } = await supabase
        .from('officials')
        .select('*', { count: 'exact', head: true })
        .eq('county_id', profile.county_id)
        .is('deprecated_at', null);
      return count ?? 0;
    },
    enabled: !!profile?.county_id,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    const loadStats = async () => {
      try {
        const { data: actions } = await supabase
          .from('civic_actions')
          .select('id, title, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const { count: supportCount } = await supabase
          .from('civic_action_supporters')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (ignore) return;

        type ActionRow = { id: string; title: string; status: string; created_at: string };
        const OPEN_STATUSES = ['submitted', 'in_progress', 'under_review', 'acknowledged'];
        const allActions = (actions ?? []) as ActionRow[];
        const open = allActions.filter((a) => OPEN_STATUSES.includes(a.status));
        const resolved = allActions.filter((a) => a.status === 'resolved');

        setStats({
          totalIssues: allActions.length,
          openIssues: open.length,
          resolvedIssues: resolved.length,
          totalSupportGiven: supportCount || 0,
        });
      } catch (e) {
        if (!ignore) console.error('DashboardOverview loadStats error:', e);
      } finally {
        if (!ignore) setLoadingStats(false);
      }
    };

    loadStats();
    return () => { ignore = true; };
  }, [user]);

  const TRUST_COLOR: Record<string, string> = {
    newcomer: 'text-muted-foreground',
    engaged: 'text-blue-500',
    trusted: 'text-green-500',
    champion: 'text-amber-500',
  };

  if (loadingStats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const hasLocation = !!profile?.county;

  return (
    <div className="space-y-4">
      {/* Personal Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Issues Reported" value={stats.totalIssues} accent="bg-blue-500" />
        <StatCard icon={Clock} label="Open" value={stats.openIssues} accent="bg-amber-500" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolvedIssues} accent="bg-green-500" />
        <StatCard icon={Users} label="Issues Supported" value={stats.totalSupportGiven} accent="bg-purple-500" />

        {/* Impact Score */}
        <StatCard
          icon={TrendingUp}
          label="Impact Score"
          value={impactScore?.impact_rating ?? '—'}
          accent="bg-primary"
        >
          {impactScore?.trust_tier && (
            <p className={`text-[10px] font-semibold mt-0.5 capitalize ${TRUST_COLOR[impactScore.trust_tier] || 'text-muted-foreground'}`}>
              {impactScore.trust_tier}
            </p>
          )}
        </StatCard>

        {/* Community Pulse — or Set Location CTA */}
        {hasLocation ? (
          <StatCard
            icon={BarChart3}
            label="Community Pulse"
            value={communityPulse?.current ?? '—'}
            accent="bg-cyan-500"
          >
            <div className="flex items-center gap-1.5 mt-0.5">
              {communityPulse && <TrendIndicator current={communityPulse.current} previous={communityPulse.previous} />}
              <span className="text-[10px] text-muted-foreground truncate">{profile?.county}</span>
            </div>
          </StatCard>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-dashed border-primary/40 p-4 bg-card col-span-2 sm:col-span-1">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium">Set Your County</p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                See local activity & your representatives
              </p>
              <Button size="sm" variant="outline" className="h-7 text-xs w-full" asChild>
                <Link to="/settings">Set Location</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Your Representatives */}
      {hasLocation && (
        <div className="rounded-xl border border-border/60 p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Representatives</p>
              {repCount !== undefined && repCount > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{repCount}</span>
              )}
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
              <Link to="/officials">
                View All <Shield className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
          {representatives && representatives.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {representatives.map((rep) => (
                <Link
                  key={rep.id}
                  to={`/officials/${rep.id}`}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {rep.photo_url ? (
                      <img src={rep.photo_url} alt={rep.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{rep.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{rep.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">No representatives found for your county</p>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
          <Link to="/dashboard/report">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs">Report Issue</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
          <Link to="/report-incident">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs">Report Incident</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
          <Link to="/create">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs">Create Post</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DashboardOverview;
