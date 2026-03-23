import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Search, Filter, Trash2, Send, Check, X, Eye, Bot,
  RefreshCw, Loader2, FileText, Settings, BookOpen,
  ChevronDown, Sparkles, AlertTriangle, Globe, Cpu,
  Zap, BarChart2, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

// ── 1. Findings Review Tab (Scout output) ────────────────────────────────────
function FindingsReviewTab() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: findings, isLoading } = useQuery({
    queryKey: ['intelligence-findings', categoryFilter],
    queryFn: async () => {
      let q = supabase
        .from('scout_findings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (categoryFilter !== 'all') q = q.eq('category', categoryFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (findingIds: string[]) => {
      const { data: currentState } = await supabase
        .from('agent_state')
        .select('state_value')
        .eq('agent_name', 'civic-publisher')
        .eq('state_key', 'publish_queue')
        .maybeSingle();

      const existing = (currentState?.state_value as string[]) || [];
      const merged = [...new Set([...existing, ...findingIds])];

      await (supabase.from('agent_state') as any).upsert({
        agent_name: 'civic-publisher',
        state_key: 'publish_queue',
        state_value: merged,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'agent_name,state_key' });

      const { error } = await supabase.functions.invoke('civic-publisher', {
        body: { trigger: 'queue' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Findings queued for publishing');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['intelligence-findings'] });
    },
    onError: (e) => toast.error(`Publish failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scout_findings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Finding deleted');
      queryClient.invalidateQueries({ queryKey: ['intelligence-findings'] });
    },
  });

  const categories = ['all', 'budget', 'tender', 'scandal', 'promise', 'policy', 'infrastructure', 'other'];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">
            <strong>Step 1:</strong> Review raw findings scraped by <code className="text-primary">civic-scout</code>. 
            Once reviewed, move to the <strong>Processor</strong> tab to embed and cluster them.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {categories.map(c => (
            <Button key={c} size="sm" variant={categoryFilter === c ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(c)} className="text-xs capitalize h-7">
              {c}
            </Button>
          ))}
        </div>
        {selectedIds.length > 0 && (
          <Button size="sm" onClick={() => publishMutation.mutate(selectedIds)}
            disabled={publishMutation.isPending} className="gap-1">
            <Send className="w-3 h-3" />
            Publish {selectedIds.length} to Communities
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !findings?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No scout findings yet. Run <code>civic-scout</code> from AI Command to collect intelligence.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {findings.map((f: Record<string, unknown>) => (
            <Card key={f.id as string} className={`transition-colors ${selectedIds.includes(f.id as string) ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selectedIds.includes(f.id as string)}
                    onChange={() => toggleSelect(f.id as string)}
                    className="mt-1 rounded border-muted-foreground" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium truncate">{f.title as string}</h4>
                      <Badge variant="outline" className="text-[10px] capitalize">{(f.category as string) || 'other'}</Badge>
                      {f.embedded ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">Embedded</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Not Embedded</Badge>
                      )}
                      {f.processed ? (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Processed</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Unprocessed</Badge>
                      )}
                      {f.published ? (
                        <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">Published</Badge>
                      ) : null}
                      {f.cluster_id && (
                        <Badge variant="outline" className="text-[10px] font-mono">C:{(f.cluster_id as string).slice(0, 8)}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{f.summary as string}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {f.county && <span>📍 {f.county as string}</span>}
                      {f.relevance_score != null && <span>Relevance: {Math.round((f.relevance_score as number) * 100)}%</span>}
                      <span>{new Date(f.created_at as string).toLocaleDateString()}</span>
                      {f.source_url && (
                        <a href={f.source_url as string} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-0.5">
                          <Globe className="w-3 h-3" />Source
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => publishMutation.mutate([f.id as string])}
                      disabled={publishMutation.isPending}
                      title="Publish to communities">
                      <Send className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(f.id as string)}
                      title="Delete finding">
                      <Trash2 className="w-3 h-3" />
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

// ── 2. Processor Tab (Embed + Cluster) ───────────────────────────────────────
function ProcessorTab() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

  // Pipeline stats from findings
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['processor-stats'],
    queryFn: async () => {
      const [
        { count: totalCount },
        { count: unembeddedCount },
        { count: embeddedNotProcessed },
        { count: processedCount },
        { count: publishedCount },
      ] = await Promise.all([
        supabase.from('scout_findings').select('id', { count: 'exact', head: true }),
        supabase.from('scout_findings').select('id', { count: 'exact', head: true }).eq('embedded', false),
        supabase.from('scout_findings').select('id', { count: 'exact', head: true }).eq('embedded', true).eq('processed', false),
        supabase.from('scout_findings').select('id', { count: 'exact', head: true }).eq('processed', true),
        supabase.from('scout_findings').select('id', { count: 'exact', head: true }).eq('published', true),
      ]);
      return {
        total: totalCount ?? 0,
        unembedded: unembeddedCount ?? 0,
        embeddedNotProcessed: embeddedNotProcessed ?? 0,
        processed: processedCount ?? 0,
        published: publishedCount ?? 0,
      };
    },
    refetchInterval: running ? 3000 : false,
  });

  // Recent processor runs
  const { data: recentRuns } = useQuery({
    queryKey: ['processor-runs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('agent_name', 'civic-processor')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const triggerProcessor = async () => {
    setRunning(true);
    try {
      toast.info('Running civic-processor...');
      const { data, error } = await supabase.functions.invoke('civic-processor', {
        body: { trigger: 'manual' },
      });
      if (error) throw error;
      const result = data as Record<string, number>;
      toast.success(
        `Processor done: ${result.embedded ?? 0} embedded, ${result.clustered ?? 0} clustered, ${result.quill_triggered ?? 0} summaries`
      );
      queryClient.invalidateQueries({ queryKey: ['processor-stats'] });
      queryClient.invalidateQueries({ queryKey: ['processor-runs'] });
      queryClient.invalidateQueries({ queryKey: ['intelligence-findings'] });
    } catch (e: unknown) {
      toast.error(`Processor failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  const statusItems = [
    { label: 'Total Findings', value: stats?.total ?? 0, icon: FileText, color: 'text-foreground' },
    { label: 'Awaiting Embedding', value: stats?.unembedded ?? 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Awaiting Clustering', value: stats?.embeddedNotProcessed ?? 0, icon: Cpu, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Fully Processed', value: stats?.processed ?? 0, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Published to Posts', value: stats?.published ?? 0, icon: Send, color: 'text-violet-600 dark:text-violet-400' },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">
            <strong>Step 2:</strong> The processor embeds findings into vectors for search/dedup, 
            then clusters them by category and triggers <code className="text-primary">civic-quill</code> to generate summaries. 
            Run it after new findings are scraped.
          </p>
        </CardContent>
      </Card>

      {/* Pipeline Status */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statusItems.map(item => (
          <Card key={item.label}>
            <CardContent className="p-3 text-center">
              <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
              <p className="text-lg font-bold">{statsLoading ? '—' : item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Progress Visual */}
      {stats && stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-2">Pipeline Progress</p>
            <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-muted">
              {stats.published > 0 && (
                <div className="bg-violet-500 h-full transition-all" 
                  style={{ width: `${(stats.published / stats.total) * 100}%` }}
                  title={`Published: ${stats.published}`} />
              )}
              {(stats.processed - stats.published) > 0 && (
                <div className="bg-emerald-500 h-full transition-all" 
                  style={{ width: `${((stats.processed - stats.published) / stats.total) * 100}%` }}
                  title={`Processed: ${stats.processed - stats.published}`} />
              )}
              {stats.embeddedNotProcessed > 0 && (
                <div className="bg-blue-500 h-full transition-all" 
                  style={{ width: `${(stats.embeddedNotProcessed / stats.total) * 100}%` }}
                  title={`Embedded: ${stats.embeddedNotProcessed}`} />
              )}
              {stats.unembedded > 0 && (
                <div className="bg-amber-500 h-full transition-all" 
                  style={{ width: `${(stats.unembedded / stats.total) * 100}%` }}
                  title={`Unembedded: ${stats.unembedded}`} />
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Unembedded</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Embedded</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Processed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />Published</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trigger Button */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Run Processor Pipeline</p>
            <p className="text-xs text-muted-foreground">
              Embeds unembedded findings → clusters by category → triggers quill summaries
            </p>
          </div>
          <Button onClick={triggerProcessor} disabled={running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {running ? 'Running...' : 'Run Processor'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Processor Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentRuns?.length ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No runs yet</p>
          ) : (
            <div className="space-y-2">
              {recentRuns.map((run: Record<string, unknown>) => (
                <div key={run.id as string} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  {run.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : run.status === 'partial' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs">
                        Scanned {run.items_scanned as number} · Actioned {run.items_actioned as number}
                        {(run.items_failed as number) > 0 && ` · Failed ${run.items_failed as number}`}
                      </span>
                      {run.duration_ms && (
                        <Badge variant="outline" className="text-[10px]">{run.duration_ms as number}ms</Badge>
                      )}
                    </div>
                    {run.error_summary && (
                      <p className="text-[10px] text-destructive truncate">{run.error_summary as string}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(run.created_at as string).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── 3. Publisher Templates Tab ───────────────────────────────────────────────
function TemplatesTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['publisher-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publisher_templates')
        .select('*')
        .order('category');
      if (error) throw error;
      return data || [];
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (vals: Record<string, unknown>) => {
      const { error } = await supabase
        .from('publisher_templates')
        .update({
          system_prompt: vals.system_prompt as string,
          example_good: (vals.example_good as string) || null,
          example_bad: (vals.example_bad as string) || null,
          requires_review: vals.requires_review as boolean,
          active: vals.active as boolean,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vals.id as string);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template updated');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['publisher-templates'] });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">
            <strong>Step 3:</strong> Configure how <code className="text-primary">civic-publisher</code> rewrites findings into community posts. 
            Each category has its own tone, rules, and examples.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {(templates || []).map((t: Record<string, unknown>) => {
            const isEditing = editingId === t.id;
            return (
              <Card key={t.id as string}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm capitalize">{t.category as string}</CardTitle>
                      {t.requires_review && (
                        <Badge variant="secondary" className="text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1" />Requires Review
                        </Badge>
                      )}
                      <Badge variant={t.active ? 'default' : 'outline'} className="text-[10px]">
                        {t.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (isEditing) { setEditingId(null); } else {
                        setEditingId(t.id as string);
                        setEditForm(t);
                      }
                    }}>
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">System Prompt</Label>
                        <Textarea value={(editForm.system_prompt as string) || ''} rows={6}
                          onChange={e => setEditForm(prev => ({ ...prev, system_prompt: e.target.value }))}
                          className="text-xs font-mono" />
                      </div>
                      <div>
                        <Label className="text-xs">Good Example</Label>
                        <Textarea value={(editForm.example_good as string) || ''} rows={3}
                          onChange={e => setEditForm(prev => ({ ...prev, example_good: e.target.value }))}
                          className="text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Bad Example</Label>
                        <Textarea value={(editForm.example_bad as string) || ''} rows={3}
                          onChange={e => setEditForm(prev => ({ ...prev, example_bad: e.target.value }))}
                          className="text-xs" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch checked={editForm.requires_review as boolean}
                            onCheckedChange={v => setEditForm(prev => ({ ...prev, requires_review: v }))} />
                          <Label className="text-xs">Requires Review</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={editForm.active as boolean}
                            onCheckedChange={v => setEditForm(prev => ({ ...prev, active: v }))} />
                          <Label className="text-xs">Active</Label>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => updateTemplate.mutate(editForm)}
                        disabled={updateTemplate.isPending}>
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground line-clamp-3 font-mono">{t.system_prompt as string}</p>
                      {t.example_good && (
                        <div className="mt-2">
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Good example:</span>
                          <p className="text-xs text-muted-foreground line-clamp-2">{t.example_good as string}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 4. Auto-Generated Posts Tab ──────────────────────────────────────────────
function AutoPostsTab() {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['intelligence-auto-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, community_id, moderation_status, created_at, finding_id, published_by_agent, auto_generated')
        .eq('auto_generated', true)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('posts').update({ moderation_status: status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post updated');
      queryClient.invalidateQueries({ queryKey: ['intelligence-auto-posts'] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['intelligence-auto-posts'] });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">
            <strong>Step 4:</strong> Review auto-generated posts before they appear in community feeds. 
            Approve, edit, or reject posts created by <code className="text-primary">civic-publisher</code>.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !posts?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No auto-generated posts yet. Process findings first, then publish.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <Card key={post.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                      <h4 className="text-sm font-medium truncate">{post.title}</h4>
                      <Badge variant={
                        post.moderation_status === 'approved' ? 'default' :
                        post.moderation_status === 'pending_review' ? 'secondary' : 'destructive'
                      } className="text-[10px]">
                        {post.moderation_status || 'unknown'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(post.created_at).toLocaleString()} · Agent: {post.published_by_agent}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {post.moderation_status !== 'approved' && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600"
                        onClick={() => updateStatus.mutate({ id: post.id, status: 'approved' })}
                        title="Approve">
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={() => deletePost.mutate(post.id)}
                      title="Delete">
                      <Trash2 className="w-3 h-3" />
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

// ── 5. Publisher Settings Tab ─────────────────────────────────────────────────
function PublisherSettingsTab() {
  const [seedCommunityId, setSeedCommunityId] = useState('');
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['publisher-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_state')
        .select('state_key, state_value')
        .eq('agent_name', 'civic-publisher');
      const map: Record<string, unknown> = {};
      (data || []).forEach((r: { state_key: string; state_value: unknown }) => {
        map[r.state_key] = r.state_value;
      });
      return map;
    },
  });

  const updateSetting = async (key: string, value: unknown) => {
    await (supabase.from('agent_state') as any).upsert({
      agent_name: 'civic-publisher',
      state_key: key,
      state_value: value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agent_name,state_key' });
    queryClient.invalidateQueries({ queryKey: ['publisher-settings'] });
    toast.success(`Setting "${key}" updated`);
  };

  const handleSeed = async () => {
    if (!seedCommunityId.trim()) { toast.error('Enter a community ID'); return; }
    setSeeding(true);
    try {
      const { error } = await supabase.functions.invoke('civic-publisher', {
        body: { seed: true, community_id: seedCommunityId.trim() },
      });
      if (error) throw error;
      toast.success('Seed triggered! Check Auto-Generated Posts tab.');
    } catch (e: unknown) {
      toast.error(`Seed failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setSeeding(false);
    }
  };

  const { data: communities } = useQuery({
    queryKey: ['communities-list-publisher'],
    queryFn: async () => {
      const { data } = await supabase
        .from('communities')
        .select('id, name, location_type, location_value, publisher_context')
        .order('name')
        .limit(100);
      return data || [];
    },
  });

  const [editingContext, setEditingContext] = useState<string | null>(null);
  const [contextText, setContextText] = useState('');

  const saveContext = async (communityId: string) => {
    const { error } = await supabase.from('communities')
      .update({ publisher_context: contextText })
      .eq('id', communityId);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Context saved');
    setEditingContext(null);
    queryClient.invalidateQueries({ queryKey: ['communities-list-publisher'] });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">
            <strong>Step 5:</strong> Global controls, seed mode for new communities, and per-community context configuration.
          </p>
        </CardContent>
      </Card>

      {/* Global Controls */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Global Publisher Controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-Publish Enabled</Label>
              <p className="text-xs text-muted-foreground">When off, findings must be manually published</p>
            </div>
            <Switch
              checked={settings?.auto_publish !== false}
              onCheckedChange={v => updateSetting('auto_publish', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Kill Switch</Label>
              <p className="text-xs text-muted-foreground text-destructive">Emergency stop — pauses all auto-publishing instantly</p>
            </div>
            <Button size="sm" variant="destructive"
              onClick={() => updateSetting('auto_publish', false)}>
              <AlertTriangle className="w-3 h-3 mr-1" />Kill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seed Mode */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Seed Community</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Backfill a new community with 3–5 auto-generated posts from the last 30 days of findings.
          </p>
          <div className="flex gap-2">
            <select
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={seedCommunityId}
              onChange={e => setSeedCommunityId(e.target.value)}>
              <option value="">Select a community</option>
              {(communities || []).map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.location_type}: {c.location_value})</option>
              ))}
            </select>
            <Button onClick={handleSeed} disabled={seeding || !seedCommunityId}>
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Seed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Community Context Editor */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Community Context</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Add context per community to improve post relevance. E.g. "Semi-arid ward, key issues: water scarcity, pastoralist rights."
          </p>
          {(communities || []).map(c => (
            <div key={c.id} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground ml-2">({c.location_type}: {c.location_value})</span>
                {editingContext === c.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea value={contextText} onChange={e => setContextText(e.target.value)}
                      rows={3} className="text-xs" placeholder="Describe this community's key issues, demographics, tone..." />
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => saveContext(c.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingContext(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.publisher_context || <em className="opacity-50">No context set</em>}
                  </p>
                )}
              </div>
              {editingContext !== c.id && (
                <Button size="sm" variant="ghost" onClick={() => {
                  setEditingContext(c.id);
                  setContextText(c.publisher_context || '');
                }}>Edit</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Root Export ───────────────────────────────────────────────────────────────
export default function IntelligenceSection() {
  return (
    <Tabs defaultValue="findings" className="space-y-6">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="findings" className="gap-2">
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">1.</span> Findings
        </TabsTrigger>
        <TabsTrigger value="processor" className="gap-2">
          <Cpu className="w-4 h-4" />
          <span className="hidden sm:inline">2.</span> Processor
        </TabsTrigger>
        <TabsTrigger value="templates" className="gap-2">
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">3.</span> Templates
        </TabsTrigger>
        <TabsTrigger value="auto-posts" className="gap-2">
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">4.</span> Auto-Posts
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">5.</span> Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="findings"><FindingsReviewTab /></TabsContent>
      <TabsContent value="processor"><ProcessorTab /></TabsContent>
      <TabsContent value="templates"><TemplatesTab /></TabsContent>
      <TabsContent value="auto-posts"><AutoPostsTab /></TabsContent>
      <TabsContent value="settings"><PublisherSettingsTab /></TabsContent>
    </Tabs>
  );
}
