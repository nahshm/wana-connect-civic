import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, TrendingUp } from 'lucide-react';

interface RunRow {
  agent_name: string;
  status: string;
  duration_ms: number | null;
  items_scanned: number;
  created_at: string;
}

interface AgentStats {
  agent: string;
  totalRuns: number;
  successRate: number;
  avgLatency: number;
  totalItems: number;
  errors: number;
  lastRun: string | null;
}

function buildStats(runs: RunRow[]): AgentStats[] {
  const grouped: Record<string, RunRow[]> = {};
  for (const r of runs) {
    if (!grouped[r.agent_name]) grouped[r.agent_name] = [];
    grouped[r.agent_name].push(r);
  }

  return Object.entries(grouped)
    .map(([agent, rows]) => {
      const total = rows.length;
      const successes = rows.filter(r => r.status === 'success').length;
      const errors = rows.filter(r => r.status === 'failed').length;
      const withLatency = rows.filter(r => r.duration_ms != null);
      const avgLatency = withLatency.length
        ? withLatency.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / withLatency.length
        : 0;
      const totalItems = rows.reduce((s, r) => s + (r.items_scanned ?? 0), 0);
      const sorted = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        agent,
        totalRuns: total,
        successRate: total > 0 ? Math.round((successes / total) * 100) : 0,
        avgLatency: Math.round(avgLatency),
        totalItems,
        errors,
        lastRun: sorted[0]?.created_at ?? null,
      };
    })
    .sort((a, b) => b.totalRuns - a.totalRuns);
}

export function Analytics() {
  const { data: stats, isLoading, refetch } = useQuery<AgentStats[]>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('agent_runs')
        .select('agent_name, status, duration_ms, items_scanned, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return buildStats(data ?? []);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />Analytics
          </h3>
          <p className="text-sm text-muted-foreground">Agent performance — last 7 days</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !stats?.length ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No run data in the last 7 days.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Agent Run Statistics</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="text-left p-3 font-medium">Agent</th>
                    <th className="text-right p-3 font-medium">Runs</th>
                    <th className="text-right p-3 font-medium">Success %</th>
                    <th className="text-right p-3 font-medium">Avg Latency</th>
                    <th className="text-right p-3 font-medium">Items</th>
                    <th className="text-right p-3 font-medium">Errors</th>
                    <th className="text-right p-3 font-medium">Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={s.agent} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="p-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.agent}</code>
                      </td>
                      <td className="p-3 text-right font-mono text-xs">{s.totalRuns}</td>
                      <td className="p-3 text-right">
                        <span className={`font-semibold text-xs ${s.successRate >= 90 ? 'text-emerald-600' : s.successRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                          {s.successRate}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                        {s.avgLatency > 0 ? `${s.avgLatency}ms` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-xs">{s.totalItems.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-xs text-red-500">{s.errors || '—'}</td>
                      <td className="p-3 text-right text-xs text-muted-foreground">
                        {s.lastRun ? new Date(s.lastRun).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
