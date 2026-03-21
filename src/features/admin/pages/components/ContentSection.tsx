import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldAlert, AlertTriangle, Lock, CheckCircle, XCircle,
  Loader2, RefreshCw, Radio, Flag, ChevronDown, ChevronRight,
  Eye, MessageSquare, FileText, Flame, MapPin, Image as ImageIcon,
  Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContentSection() {
  return (
    <Tabs defaultValue="moderation" className="space-y-6">
      <TabsList>
        <TabsTrigger value="moderation" className="gap-2"><Flag className="w-4 h-4" />Moderation Queue</TabsTrigger>
        <TabsTrigger value="incidents" className="gap-2"><Flame className="w-4 h-4" />Incidents</TabsTrigger>
        <TabsTrigger value="reports" className="gap-2"><ShieldAlert className="w-4 h-4" />Anonymous Reports</TabsTrigger>
        <TabsTrigger value="crisis" className="gap-2"><AlertTriangle className="w-4 h-4" />Crisis</TabsTrigger>
      </TabsList>

      <TabsContent value="moderation"><ModerationQueueSubTab /></TabsContent>
      <TabsContent value="incidents"><IncidentsSubTab /></TabsContent>
      <TabsContent value="reports"><AnonymousReportsSubTab /></TabsContent>
      <TabsContent value="crisis"><CrisisSubTab /></TabsContent>
    </Tabs>
  );
}

// ── Incidents Sub-Tab ─────────────────────────────────────────────────────────
function IncidentsSubTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: incidents, isLoading, refetch } = useQuery({
    queryKey: ['admin-incidents', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredIncidents = incidents?.filter(inc => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inc.title?.toLowerCase().includes(term) ||
      inc.case_number?.toLowerCase().includes(term) ||
      inc.incident_type?.toLowerCase().includes(term) ||
      inc.location_text?.toLowerCase().includes(term)
    );
  });

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('incidents')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(`Incident marked as ${newStatus}`);
      refetch();
    }
  };

  const addAdminNote = async (id: string) => {
    if (!adminNotes.trim()) return;
    const { data: incident } = await supabase.from('incidents').select('resolution_notes').eq('id', id).single();
    const existing = incident?.resolution_notes || '';
    const timestamp = new Date().toISOString().split('T')[0];
    const updated = existing ? `${existing}\n[${timestamp}] ${adminNotes.trim()}` : `[${timestamp}] ${adminNotes.trim()}`;

    const { error } = await supabase.from('incidents').update({ resolution_notes: updated }).eq('id', id);
    if (error) toast.error('Failed to add note');
    else {
      toast.success('Note added');
      setAdminNotes('');
      refetch();
    }
  };

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
      case 'investigating': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
      case 'dismissed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const counts = {
    total: incidents?.length || 0,
    open: incidents?.filter(i => i.status === 'open').length || 0,
    critical: incidents?.filter(i => i.severity === 'critical').length || 0,
    anonymous: incidents?.filter(i => i.is_anonymous).length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.open}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.critical}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.anonymous}</div>
            <div className="text-xs text-muted-foreground">Anonymous</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, case #, type, location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {['all', 'open', 'investigating', 'resolved', 'dismissed'].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)} className="capitalize">
            {s}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !filteredIncidents?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            No incidents matching filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map(inc => {
            const isExpanded = expandedId === inc.id;
            return (
              <Card key={inc.id} className={`border-l-4 ${inc.severity === 'critical' ? 'border-l-destructive' : inc.severity === 'high' ? 'border-l-orange-500' : 'border-l-border'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={severityColor(inc.severity || 'low')} className="text-xs capitalize">{inc.severity}</Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(inc.status || 'open')}`}>{inc.status}</span>
                        <Badge variant="outline" className="text-xs capitalize">{inc.incident_type?.replace(/_/g, ' ')}</Badge>
                        {inc.is_anonymous && <Badge variant="outline" className="text-xs">🕶 Anonymous</Badge>}
                        {inc.case_number && <span className="text-xs font-mono text-muted-foreground">{inc.case_number}</span>}
                      </div>
                      <h4 className="font-semibold text-sm">{inc.title || 'Untitled Incident'}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                        {inc.location_text && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{inc.location_text}</span>}
                        {inc.county && <span>{inc.county}</span>}
                        {inc.media_urls && (inc.media_urls as string[]).length > 0 && (
                          <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{(inc.media_urls as string[]).length} files</span>
                        )}
                      </div>

                      <button
                        onClick={() => { setExpandedId(isExpanded ? null : inc.id); setAdminNotes(''); }}
                        className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {isExpanded ? 'Collapse' : 'View Details'}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          <div className="p-3 border rounded-lg bg-muted/30">
                            <p className="text-xs font-semibold mb-1">Description</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inc.description}</p>
                          </div>

                          {inc.evidence_notes && (
                            <div className="p-3 border rounded-lg bg-muted/30">
                              <p className="text-xs font-semibold mb-1">Evidence Notes</p>
                              <p className="text-sm text-muted-foreground">{inc.evidence_notes}</p>
                            </div>
                          )}

                          {inc.media_urls && (inc.media_urls as string[]).length > 0 && (
                            <div className="p-3 border rounded-lg bg-muted/30">
                              <p className="text-xs font-semibold mb-2">Evidence Media</p>
                              <div className="flex gap-2 flex-wrap">
                                {(inc.media_urls as string[]).map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                    className="w-16 h-16 rounded-lg border overflow-hidden hover:ring-2 ring-primary transition-all">
                                    <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {inc.latitude && inc.longitude && (
                            <div className="p-3 border rounded-lg bg-muted/30">
                              <p className="text-xs font-semibold mb-1">GPS Coordinates</p>
                              <p className="text-sm font-mono text-muted-foreground">{inc.latitude}, {inc.longitude}</p>
                            </div>
                          )}

                          {inc.agency_notified && (
                            <div className="p-3 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                              <p className="text-xs font-semibold mb-1">Agency Already Notified</p>
                              <p className="text-sm">{inc.agency_name || 'Unspecified'}</p>
                            </div>
                          )}

                          {/* Admin notes */}
                          <div className="p-3 border rounded-lg">
                            <p className="text-xs font-semibold mb-2">Admin Notes</p>
                            {(inc as any).admin_notes && (
                              <pre className="text-xs text-muted-foreground whitespace-pre-wrap mb-2 font-sans">{(inc as any).admin_notes}</pre>
                            )}
                            <div className="flex gap-2">
                              <Textarea
                                rows={2}
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                                placeholder="Add internal note..."
                                className="text-sm"
                              />
                              <Button size="sm" onClick={() => addAdminNote(inc.id)} disabled={!adminNotes.trim()}>
                                Add
                              </Button>
                            </div>
                          </div>

                          {/* Status actions */}
                          <div className="flex gap-2 flex-wrap">
                            {inc.status !== 'investigating' && (
                              <Button size="sm" variant="outline" className="text-blue-600 border-blue-300" onClick={() => updateStatus(inc.id, 'investigating')}>
                                Mark Investigating
                              </Button>
                            )}
                            {inc.status !== 'resolved' && (
                              <Button size="sm" variant="outline" className="text-green-600 border-green-300" onClick={() => updateStatus(inc.id, 'resolved')}>
                                <CheckCircle className="w-3 h-3 mr-1" />Resolve
                              </Button>
                            )}
                            {inc.status !== 'dismissed' && (
                              <Button size="sm" variant="outline" className="text-muted-foreground" onClick={() => updateStatus(inc.id, 'dismissed')}>
                                <XCircle className="w-3 h-3 mr-1" />Dismiss
                              </Button>
                            )}
                            {inc.status !== 'open' && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(inc.id, 'open')}>
                                Reopen
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Moderation Queue ──────────────────────────────────────────────────────────
function ModerationQueueSubTab() {
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: flags, isLoading, refetch } = useQuery({
    queryKey: ['admin-content-flags', filter],
    queryFn: async () => {
      let q = supabase.from('content_flags').select('*').order('created_at', { ascending: false }).limit(50);
      if (filter === 'pending') q = q.eq('status', 'pending');
      else if (filter === 'reviewed') q = q.neq('status', 'pending');
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: contentDetails } = useQuery({
    queryKey: ['admin-flagged-content-details', expandedId],
    queryFn: async () => {
      if (!expandedId) return null;
      const flag = flags?.find(f => f.id === expandedId);
      if (!flag) return null;

      let content: any = null;
      if (flag.post_id) {
        const { data } = await supabase.from('posts')
          .select('id, title, content, created_at, profiles(display_name, username)')
          .eq('id', flag.post_id).single();
        content = data ? { type: 'post', ...data } : null;
      } else if (flag.comment_id) {
        const { data } = await supabase.from('comments')
          .select('id, content, created_at, profiles(display_name, username)')
          .eq('id', flag.comment_id).single();
        content = data ? { type: 'comment', ...data } : null;
      }
      return content;
    },
    enabled: !!expandedId,
  });

  const handleAction = async (flagId: string, action: 'approved' | 'removed' | 'escalated') => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('content_flags')
      .update({ status: action, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', flagId);

    if (error) toast.error('Action failed');
    else { toast.success(`Flag marked as ${action}`); refetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Moderation Queue</h3>
        <div className="flex gap-2">
          {(['pending', 'reviewed', 'all'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !flags?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            No pending flags. Queue is clear.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flags.map(flag => {
            const isExpanded = expandedId === flag.id;
            return (
              <Card key={flag.id} className="border-l-4 border-l-orange-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {flag.post_id && <Badge variant="outline" className="text-xs gap-1"><FileText className="w-3 h-3" />Post</Badge>}
                        {flag.comment_id && <Badge variant="outline" className="text-xs gap-1"><MessageSquare className="w-3 h-3" />Comment</Badge>}
                        <Badge variant="secondary" className="text-xs">{flag.verdict}</Badge>
                        <Badge variant="outline" className="text-xs">{flag.status}</Badge>
                        {flag.flagged_by_ai && <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">AI Flagged</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(flag.created_at).toLocaleDateString()} · {new Date(flag.created_at).toLocaleTimeString()}
                      </div>
                      {flag.reason && <div className="text-sm text-orange-600 dark:text-orange-400 mt-1 italic">"{flag.reason}"</div>}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : flag.id)}
                        className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {isExpanded ? 'Hide' : 'View'} Original Content
                      </button>

                      {isExpanded && contentDetails && (
                        <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs capitalize">{contentDetails.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              By {contentDetails.profiles?.display_name || contentDetails.profiles?.username || 'Unknown'}
                            </span>
                          </div>
                          {contentDetails.title && <h5 className="font-medium text-sm mb-1">{contentDetails.title}</h5>}
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                            {contentDetails.content || 'No content'}
                          </p>
                        </div>
                      )}
                      {isExpanded && !contentDetails && (
                        <div className="mt-3 p-3 border rounded-lg bg-muted/30 text-xs text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin inline mr-1" />Loading content...
                        </div>
                      )}
                    </div>
                    {flag.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600"
                          onClick={() => handleAction(flag.id, 'approved')}>
                          <CheckCircle className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(flag.id, 'removed')}>
                          <XCircle className="w-3 h-3 mr-1" />Remove
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleAction(flag.id, 'escalated')}>
                          <AlertTriangle className="w-3 h-3 mr-1" />Escalate
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Anonymous Reports ─────────────────────────────────────────────────────────
function AnonymousReportsSubTab() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-anonymous-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anonymous_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reports?.filter(r => r.severity === 'critical').length || 0}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <Lock className="text-green-500 mb-1 w-5 h-5" />
            <div className="text-2xl font-bold">{reports?.reduce((acc, r) => acc + (r.evidence_count || 0), 0) || 0}</div>
            <div className="text-xs text-muted-foreground">Evidence Secured</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Reports</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !reports?.length ? (
            <p className="text-center py-8 text-muted-foreground">No reports yet.</p>
          ) : (
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="p-3 border rounded-lg flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{r.report_id}</div>
                    <div className="text-xs text-muted-foreground">{r.category}</div>
                    {r.title && <div className="text-xs text-muted-foreground mt-0.5">{r.title}</div>}
                  </div>
                  <Badge variant={r.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{r.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Crisis ─────────────────────────────────────────────────────────────────────
function CrisisSubTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Crisis Command Center</h3>
              <p className="text-sm text-muted-foreground">Real-time monitoring and emergency response</p>
            </div>
            <Button variant="destructive">
              <Radio className="w-4 h-4 mr-2" />Broadcast Emergency Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {['CRITICAL', 'HIGH', 'MEDIUM', 'RESOLVED'].map(level => (
          <Card key={level}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs font-medium text-muted-foreground">{level}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
