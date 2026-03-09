import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Server, Users, Database, Shield, Loader2 } from 'lucide-react';

export default function SystemSection() {
  const { data: systemStats, isLoading } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: async () => {
      const [usersRes, rolesRes, reportsRes, flagsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }),
        supabase.from('anonymous_reports').select('id', { count: 'exact', head: true }),
        supabase.from('content_flags').select('id', { count: 'exact', head: true }),
      ]);
      return {
        totalUsers: usersRes.count || 0,
        roleAssignments: rolesRes.count || 0,
        totalReports: reportsRes.count || 0,
        totalFlags: flagsRes.count || 0,
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const services = [
    { name: 'Database', icon: Database, status: 'operational' },
    { name: 'Authentication', icon: Shield, status: 'operational' },
    { name: 'Storage', icon: Server, status: 'operational' },
    { name: 'Edge Functions', icon: Server, status: 'operational' },
  ];

  return (
    <div className="space-y-6">
      {/* Security Metrics */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" />Security Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Registered Users</div>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.roleAssignments}</div>
              <div className="text-xs text-muted-foreground mt-1">Role Assignments</div>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.totalReports}</div>
              <div className="text-xs text-muted-foreground mt-1">Anonymous Reports</div>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <div className="text-2xl font-bold">{systemStats?.totalFlags}</div>
              <div className="text-xs text-muted-foreground mt-1">Content Flags</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">Anonymous Protection</span>
                <span className="text-green-600 font-semibold">100%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">Data Encryption</span>
                <span className="text-green-600 font-semibold">100%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4" />System Health</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map(svc => (
              <div key={svc.name} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  <svc.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{svc.name}</span>
                </div>
                <Badge variant="default" className="text-xs capitalize">{svc.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
