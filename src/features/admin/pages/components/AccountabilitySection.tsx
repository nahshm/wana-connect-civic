import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderKanban, ScrollText, Users, Calendar, CheckCircle, XCircle,
  AlertTriangle, Loader2, RefreshCw, Eye, Clock, Building
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccountabilitySection() {
  return (
    <Tabs defaultValue="projects" className="space-y-6">
      <TabsList>
        <TabsTrigger value="projects" className="gap-2"><FolderKanban className="w-4 h-4" />Projects</TabsTrigger>
        <TabsTrigger value="promises" className="gap-2"><ScrollText className="w-4 h-4" />Promises</TabsTrigger>
        <TabsTrigger value="actions" className="gap-2"><Users className="w-4 h-4" />Civic Actions</TabsTrigger>
        <TabsTrigger value="elections" className="gap-2"><Calendar className="w-4 h-4" />Elections</TabsTrigger>
      </TabsList>

      <TabsContent value="projects"><ProjectsSubTab /></TabsContent>
      <TabsContent value="promises"><PromisesSubTab /></TabsContent>
      <TabsContent value="actions"><CivicActionsSubTab /></TabsContent>
      <TabsContent value="elections"><ElectionsSubTab /></TabsContent>
    </Tabs>
  );
}

function ProjectsSubTab() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const queryClient = useQueryClient();

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['admin-projects', filter],
    queryFn: async () => {
      let query = supabase
        .from('government_projects')
        .select(`
          *,
          government_institutions(name, jurisdiction_name),
          officials(display_name, position_title)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const { error } = await supabase
        .from('government_projects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Project status updated');
      refetch();
    },
    onError: () => toast.error('Failed to update project status'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Government Projects</h3>
        <div className="flex gap-2">
          {(['all', 'pending', 'active', 'completed'] as const).map(f => (
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
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !projects?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderKanban className="w-12 h-12 mx-auto mb-3" />
            No projects found for current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <Card key={project.id} className="border-l-4 border-l-blue-400">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm truncate">{project.title}</h4>
                      <Badge
                        variant={
                          project.status === 'active' ? 'default' :
                          project.status === 'completed' ? 'secondary' :
                          project.status === 'pending' ? 'outline' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {project.description && project.description.length > 100
                        ? `${project.description.substring(0, 100)}...`
                        : project.description
                      }
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {project.government_institutions?.name || 'No institution'}
                      </div>
                      {project.budget_allocated && (
                        <div>Budget: KSh {project.budget_allocated.toLocaleString()}</div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {project.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600"
                          onClick={() => updateStatusMutation.mutate({ projectId: project.id, status: 'active' })}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatusMutation.mutate({ projectId: project.id, status: 'rejected' })}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost">
                      <Eye className="w-3 h-3" />
                    </Button>
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

function PromisesSubTab() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled' | 'broken'>('all');

  const { data: promises, isLoading } = useQuery({
    queryKey: ['admin-promises', filter],
    queryFn: async () => {
      let query = supabase
        .from('office_promises')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Official Promises</h3>
        <div className="flex gap-2">
          {(['all', 'pending', 'fulfilled', 'broken'] as const).map(f => (
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

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !promises?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ScrollText className="w-12 h-12 mx-auto mb-3" />
            No promises found for current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {promises.map(promise => (
            <Card key={promise.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{promise.title}</h4>
                    <div className="text-xs text-muted-foreground mb-2">
                      {promise.description || 'No description'}
                    </div>
                    <Badge
                      variant={
                        promise.status === 'fulfilled' ? 'secondary' :
                        promise.status === 'broken' ? 'destructive' : 'outline'
                      }
                      className="text-xs"
                    >
                      {promise.status || 'pending'}
                    </Badge>
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

function CivicActionsSubTab() {
  const { data: actions, isLoading } = useQuery({
    queryKey: ['admin-civic-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('civic_actions')
        .select(`
          *,
          profiles(display_name),
          government_institutions(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Civic Actions</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !actions?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3" />
            No civic actions found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {actions.map(action => (
            <Card key={action.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{action.title}</h4>
                    <div className="text-xs text-muted-foreground mb-2">
                      {action.category} • {action.location_text || 'No location'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{action.status}</Badge>
                      {action.urgency && (
                        <Badge
                          variant={action.urgency === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {action.urgency} urgency
                        </Badge>
                      )}
                    </div>
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

function ElectionsSubTab() {
  const { data: elections, isLoading } = useQuery({
    queryKey: ['admin-elections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('election_cycles')
        .select('*')
        .order('election_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Election Cycles</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !elections?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3" />
            No election cycles found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {elections.map(election => (
            <Card key={election.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{election.name}</h4>
                    <div className="text-xs text-muted-foreground mb-2">
                      {election.election_type} • {new Date(election.election_date).toLocaleDateString()}
                    </div>
                    <Badge variant="outline" className="text-xs">{election.status}</Badge>
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