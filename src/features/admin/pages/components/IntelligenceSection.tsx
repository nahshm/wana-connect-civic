import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';
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
  ChevronDown, Sparkles, AlertTriangle, Globe, Cpu, BrainCircuit,
  Zap, BarChart2, CheckCircle, XCircle, Clock, CheckSquare, Square
} from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

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
      const { data: currentState, error: selectError } = await supabase
        .from('agent_state')
        .select('state_value')
        .eq('agent_name', 'civic-publisher')
        .eq('state_key', 'publish_queue')
        .maybeSingle();

      if (selectError) throw selectError;

      const existing = (currentState?.state_value as string[]) || [];
      const merged = [...new Set([...existing, ...findingIds])];

      const { error: upsertError } = await supabase.from('agent_state').upsert({
        agent_name: 'civic-publisher',
        state_key: 'publish_queue',
        state_value: merged,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'agent_name,state_key' });

      if (upsertError) throw upsertError;

      const { error: invokeError } = await supabase.functions.invoke('civic-publisher', {
        body: { trigger: 'queue' },
      });
      if (invokeError) throw invokeError;
    },
    onSuccess: () => {
      toast.success('Findings published to queue');
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
        <div className="flex items-center gap-4">
          {selectedIds.length > 0 && (
            <Button size="sm" onClick={() => publishMutation.mutate(selectedIds)}
              disabled={publishMutation.isPending} className="gap-1">
              <CheckSquare className="w-3 h-3" />
              Add {selectedIds.length} to Publisher Queue
            </Button>
          )}
          <div className="flex items-center gap-2 text-[10px] bg-muted/50 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium">Queue Status:</span>
            <span className="text-primary italic">Findings are processed in the background</span>
          </div>
        </div>
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

      {/* Trigger Buttons */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-sm font-medium">Run Processor Pipeline</p>
            <p className="text-xs text-muted-foreground">
              Embeds findings → clusters by category → triggers quill summaries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={triggerProcessor} disabled={running} variant="outline" className="gap-2">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {running ? 'Processing...' : 'Run Processor'}
            </Button>
            <Button onClick={async () => {
              try {
                toast.info('Triggering publisher...');
                const { error } = await supabase.functions.invoke('civic-publisher', { body: { trigger: 'queue' } });
                if (error) throw error;
                toast.success('Publisher triggered. Check Step 4 for drafts.');
                queryClient.invalidateQueries({ queryKey: ['intelligence-auto-posts'] });
                queryClient.invalidateQueries({ queryKey: ['processor-stats'] });
              } catch (e: any) {
                toast.error(`Publish failed: ${e.message}`);
              }
            }} variant="default" className="gap-2">
              <Send className="w-4 h-4" />
              Trigger Publishing
            </Button>
          </div>
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
function EditPostDialog({
  open,
  onOpenChange,
  post,
  onSave,
  loading
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: any;
  onSave: (vals: { title: string; content: string }) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
    }
  }, [post]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Auto-Generated Post</DialogTitle>
          <DialogDescription>Refine the AI-generated content before publishing to the community feed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Post Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter a compelling headline..." />
          </div>
          <div className="space-y-2">
            <Label>Post Content</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={8} placeholder="Write the community update..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave({ title, content })} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AutoPostsTab() {
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<any | null>(null);

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
    mutationFn: async ({ id, status, title, content }: { id: string; status?: string; title?: string; content?: string }) => {
      const updates: any = {};
      if (status) updates.moderation_status = status;
      if (title) updates.title = title;
      if (content) updates.content = content;
      
      const { error } = await supabase.from('posts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post updated');
      setEditingPost(null);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(post => (
              <Card key={post.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">AI Generated Draft</span>
                      <span className="text-xs font-semibold leading-none mt-1">{post.published_by_agent || 'Civic Publisher'}</span>
                    </div>
                  </div>
                  <Badge variant={
                    post.moderation_status === 'approved' ? 'default' :
                    post.moderation_status === 'pending_review' ? 'secondary' : 'destructive'
                  } className="capitalize text-[10px]">
                    {post.moderation_status || 'Pending'}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-bold text-base leading-tight">{post.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()} · {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 px-3 text-xs"
                        onClick={() => setEditingPost(post)}>
                        Edit
                      </Button>
                      {post.moderation_status !== 'approved' && (
                        <Button size="sm" variant="default" className="h-8 px-3 text-xs"
                          onClick={() => updateStatus.mutate({ id: post.id, status: 'approved' })}>
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8 px-3 text-xs text-destructive hover:bg-destructive/5"
                        onClick={() => deletePost.mutate(post.id)}>
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      )}

      <EditPostDialog 
        open={!!editingPost}
        onOpenChange={(open) => !open && setEditingPost(null)}
        post={editingPost}
        loading={updateStatus.isPending}
        onSave={(vals) => updateStatus.mutate({ id: editingPost.id, ...vals })}
      />
    </div>
  );
}

// ── 5. Publisher Settings Tab ─────────────────────────────────────────────────
interface PreviewPost {
  title: string;
  content: string;
  community_id: string;
  finding_id: string;
  finding_title: string;
  moderation_status: string;
}

function SeedPreviewDialog({ 
  open, 
  onOpenChange, 
  posts, 
  onConfirm, 
  loading,
  communities 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  posts: PreviewPost[];
  onConfirm: (selectedFindingIdsPerCommunity: Record<string, string[]>) => void;
  loading: boolean;
  communities: Record<string, unknown>[];
}) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Update selection when posts change
  useEffect(() => {
    if (posts.length > 0) {
      setSelectedIndices(posts.map((_, i) => i));
    }
  }, [posts]);

  const handleConfirm = () => {
    const selected = posts.filter((_, i) => selectedIndices.includes(i));
    const grouped: Record<string, string[]> = {};
    selected.forEach(p => {
      if (!grouped[p.community_id]) grouped[p.community_id] = [];
      grouped[p.community_id].push(p.finding_id);
    });
    onConfirm(grouped);
  };

  const toggleSelect = (i: number) => {
    setSelectedIndices(prev => 
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview Auto-Generated Seed Posts</DialogTitle>
          <DialogDescription>
            Review the content AI generated for your selected communities. Uncheck any you wish to discard.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 mt-4 pr-4 border rounded-md">
          <div className="p-4 space-y-4">
            {posts.map((post, i) => {
              const community = communities.find(c => c.id === post.community_id);
              return (
                <div key={i} className="flex gap-3 p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <Checkbox 
                    id={`preview-${i}`}
                    checked={selectedIndices.includes(i)} 
                    onCheckedChange={() => toggleSelect(i)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`preview-${i}`} className="cursor-pointer">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {(community?.name as string) || 'Unknown Community'}
                        </Badge>
                      </Label>
                      <span className="text-[10px] text-muted-foreground italic">
                        Source: {post.finding_title}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold">{post.title}</h4>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading || selectedIndices.length === 0}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Confirm & Publish {selectedIndices.length} Posts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PublisherSettingsTab() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [seedCommunityIds, setSeedCommunityIds] = useState<string[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPosts, setPreviewPosts] = useState<PreviewPost[]>([]);
  const [editingContext, setEditingContext] = useState<string | null>(null);
  const [contextText, setContextText] = useState('');
  const queryClient = useQueryClient();

  // Load publisher state
  const { data: state } = useQuery({
    queryKey: ['publisher-state'],
    queryFn: async () => {
      const { data } = await supabase.from('agent_state').select('*').eq('agent_name', 'civic-publisher');
      const s: Record<string, unknown> = {};
      data?.forEach(row => s[row.state_key] = row.state_value);
      setSettings(s);
      return s;
    }
  });

  const { data: communities, isLoading: loadingCommunities } = useQuery({
    queryKey: ['communities-list-publisher'],
    queryFn: async () => {
      const { data, error } = await supabase.from('communities').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const updateSetting = async (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await supabase.from('agent_state').upsert({
      agent_name: 'civic-publisher',
      state_key: key,
      state_value: value as Json,
      updated_at: new Date().toISOString()
    }, { onConflict: 'agent_name,state_key' });
    toast.success(`${key} updated`);
  };

  const handlePreviewSeed = async () => {
    if (seedCommunityIds.length === 0) return;
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('civic-publisher', {
        body: { 
          seed: true, 
          preview: true,
          trigger: 'seed',
          community_ids: seedCommunityIds 
        }
      });
      if (error) throw error;
      if (data?.posts && data.posts.length > 0) {
        setPreviewPosts(data.posts);
        setPreviewOpen(true);
      } else {
        toast.info("No new findings available to seed these specific communities right now.");
      }
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(`Preview failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleFinalPublish = async (grouped: Record<string, string[]>) => {
    setSeeding(true);
    try {
      // Flatten the grouped selection back into specific post objects from previewPosts
      const chosenPosts = previewPosts.filter(p => 
        grouped[p.community_id]?.includes(p.finding_id)
      );

      if (chosenPosts.length === 0) {
        toast.info("No posts selected to publish.");
        return;
      }

      const { error } = await supabase.functions.invoke('civic-publisher', {
        body: { 
          publish_posts: chosenPosts
        }
      });
      
      if (error) throw error;
      toast.success(`${chosenPosts.length} posts published successfully!`);
      setPreviewOpen(false);
      setSeedCommunityIds([]);
      queryClient.invalidateQueries({ queryKey: ['intelligence-auto-posts'] });
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const saveContext = async (communityId: string) => {
    const { error } = await supabase.from('communities')
      .update({ publisher_context: contextText })
      .eq('id', communityId);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Context saved');
    setEditingContext(null);
    queryClient.invalidateQueries({ queryKey: ['communities-list-publisher'] });
  };

  const toggleCommunity = (id: string) => {
    setSeedCommunityIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (seedCommunityIds.length === (communities || []).length) {
      setSeedCommunityIds([]);
    } else {
      setSeedCommunityIds((communities || []).map(c => c.id));
    }
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Bulk Seed Communities</CardTitle>
          <Button variant="outline" size="sm" onClick={selectAll} disabled={loadingCommunities || !communities?.length}>
            {seedCommunityIds.length === (communities || []).length ? 'Deselect All' : 'Select All'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Select one or more communities to backfill with 3–5 auto-generated posts from available findings.
          </p>
          
          <ScrollArea className="h-[200px] rounded-md border p-2 bg-muted/10">
            {loadingCommunities ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {(communities || []).map(c => (
                  <div key={c.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded transition-colors">
                    <Checkbox 
                      id={`seed-${c.id}`} 
                      checked={seedCommunityIds.includes(c.id)}
                      onCheckedChange={() => toggleCommunity(c.id)}
                    />
                    <label 
                      htmlFor={`seed-${c.id}`}
                      className="text-xs font-medium leading-none cursor-pointer truncate"
                      title={`${c.name} (${c.location_value})`}
                    >
                      {c.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end">
            <Button onClick={handlePreviewSeed} disabled={seeding || seedCommunityIds.length === 0}>
              {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              Preview & Seed ({seedCommunityIds.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      <SeedPreviewDialog 
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        posts={previewPosts}
        loading={seeding}
        communities={communities || []}
        onConfirm={handleFinalPublish}
      />

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

// ── 6. Agent Proposals Tab ──────────────────────────────────────────────────
function AgentProposalsTab() {
  const queryClient = useQueryClient();
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['agent-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_proposals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action, subjectId }: { id: string; action: 'accept' | 'reject'; subjectId?: string }) => {
      const { error: propError } = await supabase
        .from('agent_proposals')
        .update({ 
          status: action === 'accept' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          action_taken: action
        })
        .eq('id', id);
      if (propError) throw propError;

      if (action === 'accept' && subjectId) {
        // Find the proposal to get its type if not passed
        const { data: prop } = await supabase.from('agent_proposals').select('proposal_type, subject_type').eq('id', id).single();
        if (!prop) return;

        if (prop.subject_type === 'post') {
          // Determine status from proposal_type or reasoning
          const newStatus = prop.proposal_type === 'remove' ? 'hidden' : 'flagged';
          const { error: postError } = await supabase.from('posts').update({ moderation_status: newStatus }).eq('id', subjectId);
          if (postError) throw postError;
          toast.success(`Post ${newStatus}`);
        } else if (prop.subject_type === 'comment') {
          const newStatus = prop.proposal_type === 'remove' ? 'hidden' : 'flagged';
          const { error: commentError } = await supabase.from('comments').update({ moderation_status: newStatus }).eq('id', subjectId);
          if (commentError) throw commentError;
          toast.success(`Comment ${newStatus}`);
        }
      }
    },
    onSuccess: () => {
      toast.success('Proposal processed');
      queryClient.invalidateQueries({ queryKey: ['agent-proposals'] });
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4 text-xs text-muted-foreground">
          <strong>Review AI Agent Proposals:</strong> Approve or reject suggestions from autonomous agents. 
          Current proposals include content flags, publication summaries, and moderation verdicts.
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !proposals?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <BrainCircuit className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No pending agent proposals to review.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {proposals.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    p.proposal_type === 'remove' ? 'bg-red-50 text-red-600' : 
                    p.proposal_type === 'flag' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold capitalize">{p.agent_name} Proposal</h4>
                      <Badge variant="outline" className="text-[10px] uppercase">{p.proposal_type}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{Math.round((p.confidence || 0) * 100)}% Confidence</Badge>
                    </div>
                    <p className="text-xs font-medium">{p.reasoning}</p>
                    <div className="text-[10px] text-muted-foreground mt-2">
                      Subject: {p.subject_type} · {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" onClick={() => actionMutation.mutate({ id: p.id, action: 'accept', subjectId: p.subject_id })}
                      disabled={actionMutation.isPending}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => actionMutation.mutate({ id: p.id, action: 'reject' })}
                      disabled={actionMutation.isPending}>
                      Reject
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
          <span className="hidden sm:inline">4.</span> Auto-Generated Posts
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
      <TabsContent value="proposals"><AgentProposalsTab /></TabsContent>
    </Tabs>
  );
}
