import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Plus, RefreshCw, Globe, Newspaper, Landmark, Sliders,
  ToggleLeft, ToggleRight, Trash2, Loader2, ExternalLink,
  ChevronDown, FileSearch,
} from 'lucide-react';
import { toast } from 'sonner';

type SourceType = 'news' | 'gov_portal' | 'parliament' | 'custom';
type ScrapeStatus = 'success' | 'partial' | 'failed' | null;

interface DataSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  active: boolean;
  scrape_interval_hours: number;
  last_scraped: string | null;
  last_scraped_status: ScrapeStatus;
  created_at: string;
}

const TYPE_CONFIG: Record<SourceType, { label: string; icon: React.ElementType; color: string }> = {
  news: { label: 'News', icon: Newspaper, color: 'text-blue-500' },
  gov_portal: { label: 'Gov Portal', icon: Globe, color: 'text-emerald-500' },
  parliament: { label: 'Parliament', icon: Landmark, color: 'text-violet-500' },
  custom: { label: 'Custom', icon: Sliders, color: 'text-amber-500' },
};

const STATUS_BADGE: Record<NonNullable<ScrapeStatus>, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const DEFAULT_FORM = { name: '', url: '', type: 'news' as SourceType, scrape_interval_hours: 12 };

export function DataSourcesPanel() {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [findingsOpen, setFindingsOpen] = useState(false);

  const { data: sources, isLoading, refetch } = useQuery<DataSource[]>({
    queryKey: ['admin-data-sources'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('data_sources')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: findings, isLoading: findingsLoading } = useQuery({
    queryKey: ['admin-scout-findings'],
    enabled: findingsOpen,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('scout_findings')
        .select('id, title, source_url, category, relevance_score, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('Name and URL are required');
      return;
    }
    try {
      new URL(form.url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from('data_sources').insert({
      name: form.name.trim(),
      url: form.url.trim(),
      type: form.type,
      scrape_interval_hours: form.scrape_interval_hours,
      active: true,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Data source added');
    setForm(DEFAULT_FORM);
    setAdding(false);
    refetch();
  };

  const handleToggle = async (source: DataSource) => {
    setTogglingId(source.id);
    const { error } = await (supabase as any)
      .from('data_sources')
      .update({ active: !source.active })
      .eq('id', source.id);
    setTogglingId(null);
    if (error) toast.error(error.message);
    else refetch();
  };

  const handleDelete = async (source: DataSource) => {
    if (!window.confirm(`Delete "${source.name}"? This cannot be undone.`)) return;
    setDeletingId(source.id);
    const { error } = await (supabase as any).from('data_sources').delete().eq('id', source.id);
    setDeletingId(null);
    if (error) toast.error(error.message);
    else { toast.success('Source deleted'); refetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Sources</h3>
          <p className="text-sm text-muted-foreground">Configure scrape sources for civic-scout.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setAdding(!adding)}>
            <Plus className="w-4 h-4 mr-1" />Add Source
          </Button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <Card className="border-dashed border-2 border-primary/40">
          <CardHeader><CardTitle className="text-sm">New Data Source</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Daily Nation Kenya"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">URL * (RSS feed or page)</Label>
                <Input
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com/rss"
                  type="url"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Type</Label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as SourceType })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Scrape every (hours)</Label>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={form.scrape_interval_hours}
                  onChange={e => setForm({ ...form, scrape_interval_hours: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" disabled={saving} onClick={handleAdd}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source list */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !sources?.length ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No data sources configured yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {sources.map(s => {
            const typeConf = TYPE_CONFIG[s.type];
            const TypeIcon = typeConf.icon;
            return (
              <Card key={s.id} className={s.active ? '' : 'opacity-60'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TypeIcon className={`w-5 h-5 shrink-0 ${typeConf.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{s.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{typeConf.label}</Badge>
                        {s.last_scraped_status && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_BADGE[s.last_scraped_status]}`}>
                            {s.last_scraped_status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline truncate max-w-xs flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />{s.url}
                        </a>
                        <span className="text-xs text-muted-foreground shrink-0">· every {s.scrape_interval_hours}h</span>
                        {s.last_scraped && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            · last {new Date(s.last_scraped).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggle(s)}
                        disabled={togglingId === s.id}
                        className="p-1 hover:text-primary transition-colors"
                        title={s.active ? 'Deactivate' : 'Activate'}
                      >
                        {togglingId === s.id
                          ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          : s.active
                          ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                          : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={deletingId === s.id}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        {deletingId === s.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Scout Findings */}
      <Collapsible open={findingsOpen} onOpenChange={setFindingsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <FileSearch className="w-4 h-4" />Scout Findings
              {findings?.length ? <Badge variant="secondary" className="text-xs">{findings.length}</Badge> : null}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${findingsOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {findingsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : !findings?.length ? (
            <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">
              No scout findings yet. Add data sources above and trigger civic-scout from the Agents tab.
            </CardContent></Card>
          ) : (
            findings.map((f: any) => (
              <div key={f.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] capitalize">{f.category}</Badge>
                  <span className="text-sm font-medium truncate flex-1">{f.title}</span>
                  {f.relevance_score != null && (
                    <span className="text-xs text-muted-foreground">Score: {f.relevance_score}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                {f.source_url && (
                  <a href={f.source_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                    <ExternalLink className="w-3 h-3" />{f.source_url}
                  </a>
                )}
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
