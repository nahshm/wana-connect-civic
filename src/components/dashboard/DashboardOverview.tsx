import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, Users, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface OverviewStats {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  totalSupportGiven: number;
  recentActions: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
}

const StatCard = ({ icon: Icon, label, value, accent }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
}) => (
  <div className={`relative overflow-hidden rounded-xl border border-border/60 p-4 bg-card hover:border-primary/30 transition-colors group`}>
    <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full ${accent} opacity-10 group-hover:opacity-20 transition-opacity`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${accent} bg-opacity-10`}>
        <Icon className="w-4 h-4 text-inherit" />
      </div>
    </div>
  </div>
);

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        // Get all user's civic actions
        const { data: actions } = await (supabase as any)
          .from('civic_actions')
          .select('id, title, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Count support given
        const { count: supportCount } = await (supabase as any)
          .from('civic_action_supporters')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const allActions = actions || [];
        const open = allActions.filter((a: any) => ['submitted', 'in_progress', 'under_review'].includes(a.status));
        const resolved = allActions.filter((a: any) => a.status === 'resolved');

        setStats({
          totalIssues: allActions.length,
          openIssues: open.length,
          resolvedIssues: resolved.length,
          totalSupportGiven: supportCount || 0,
          recentActions: allActions.slice(0, 5),
        });
      } catch (e) {
        console.error('DashboardOverview error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  const STATUS_ICON: Record<string, React.ReactNode> = {
    submitted: <Clock className="w-3 h-3 text-amber-400" />,
    in_progress: <TrendingUp className="w-3 h-3 text-blue-400" />,
    resolved: <CheckCircle2 className="w-3 h-3 text-green-400" />,
    under_review: <AlertCircle className="w-3 h-3 text-purple-400" />,
  };

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={FileText} label="Issues Reported" value={stats.totalIssues} accent="bg-blue-500" />
        <StatCard icon={Clock} label="Open" value={stats.openIssues} accent="bg-amber-500" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolvedIssues} accent="bg-green-500" />
        <StatCard icon={Users} label="Issues Supported" value={stats.totalSupportGiven} accent="bg-purple-500" />
      </div>

      {/* Recent activity */}
      {stats.recentActions.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h4>
            <div className="space-y-2.5">
              {stats.recentActions.map(action => (
                <Link
                  key={action.id}
                  to={`/dashboard/actions/${action.id}`}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="mt-0.5">
                    {STATUS_ICON[action.status] || <FileText className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {action.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;
