import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ShieldAlert, AlertTriangle, Lock, CheckCircle, XCircle,
  Loader2, RefreshCw, Radio, Flag, ChevronDown, ChevronRight,
  Eye, MessageSquare, FileText, Flame, MapPin, Image as ImageIcon,
  Search, Filter, Upload, Link2, Globe, Target, X, Paperclip
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
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();

  const { data: incidents, isLoading, refetch } = useQuery({
    queryKey: ['admin-incidents', statusFilter, showArchived],
    queryFn: async () => {
      let q = supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      // Filter archived: use raw filter since archived_at isn't in generated types yet
      if (!showArchived) {
        q = q.is('archived_at' as any, null);
      }
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
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('incidents')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      } as any)
      .eq('id', id);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(`Incident marked as ${newStatus}`);
      refetch();
    }
  };

  const archiveIncident = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('incidents')
      .update({ 
        archived_at: new Date().toISOString(),
        archived_by: user?.id,
      } as any)
      .eq('id', id);
    if (error) toast.error('Failed to archive');
    else {
      toast.success('Incident archived');
      refetch();
    }
  };

  const escalateToCrisis = async (inc: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const reportId = `CR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const { error } = await supabase
      .from('crisis_reports')
      .insert({
        report_id: reportId,
        title: inc.title || 'Escalated Incident',
        description: inc.description?.substring(0, 500) || null,
        crisis_type: 'escalated_incident',
        severity: inc.severity === 'critical' ? 'critical' : 'high',
        status: 'active',
        incident_id: inc.id,
        location_text: inc.location_text,
        latitude: inc.latitude,
        longitude: inc.longitude,
      } as any);
    if (error) toast.error('Failed to escalate');
    else {
      toast.success('Escalated to Crisis Command Center');
      refetch();
    }
  };

  const addAdminNote = async (id: string) => {
    if (!adminNotes.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: incident } = await supabase.from('incidents').select('resolution_notes').eq('id', id).single();
    const existing = incident?.resolution_notes || '';
    const timestamp = new Date().toISOString().split('T')[0];
    const updated = existing ? `${existing}\n[${timestamp}] ${adminNotes.trim()}` : `[${timestamp}] ${adminNotes.trim()}`;

    const { error } = await supabase.from('incidents').update({ 
      resolution_notes: updated,
      updated_by: user?.id,
    } as any).eq('id', id);
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
        <Button size="sm" variant={showArchived ? 'default' : 'outline'} onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? 'Hide' : 'Show'} Archived
        </Button>
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
            const isArchived = !!(inc as any).archived_at;
            const canArchive = ['resolved', 'dismissed'].includes(inc.status || '') && !isArchived;
            const canEscalate = ['critical', 'high'].includes(inc.severity || '') && !isArchived;
            return (
              <Card key={inc.id} className={`border-l-4 ${isArchived ? 'border-l-muted opacity-60' : inc.severity === 'critical' ? 'border-l-destructive' : inc.severity === 'high' ? 'border-l-orange-500' : 'border-l-border'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={severityColor(inc.severity || 'low')} className="text-xs capitalize">{inc.severity}</Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(inc.status || 'open')}`}>{inc.status}</span>
                        <Badge variant="outline" className="text-xs capitalize">{inc.incident_type?.replace(/_/g, ' ')}</Badge>
                        {inc.is_anonymous && <Badge variant="outline" className="text-xs">🕶 Anonymous</Badge>}
                        {isArchived && <Badge variant="outline" className="text-xs">📦 Archived</Badge>}
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
                          {!isArchived && (
                            <div className="p-3 border rounded-lg">
                              <p className="text-xs font-semibold mb-2">Admin Notes</p>
                              {inc.resolution_notes && (
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap mb-2 font-sans">{inc.resolution_notes}</pre>
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
                          )}

                          {/* Status actions */}
                          {!isArchived && (
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
                              {canEscalate && (
                                <Button size="sm" variant="destructive" onClick={() => escalateToCrisis(inc)}>
                                  <AlertTriangle className="w-3 h-3 mr-1" />Escalate to Crisis
                                </Button>
                              )}
                              {canArchive && (
                                <Button size="sm" variant="outline" className="text-muted-foreground" onClick={() => archiveIncident(inc.id)}>
                                  📦 Archive
                                </Button>
                              )}
                            </div>
                          )}
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
  const queryClient = useQueryClient();
  const { data: reports, isLoading, refetch } = useQuery({
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

  const escalateToCrisis = async (report: any) => {
    const reportId = `CR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const { error } = await supabase
      .from('crisis_reports')
      .insert({
        report_id: reportId,
        title: report.title || `Anonymous Report: ${report.category}`,
        description: report.encrypted_content?.substring(0, 500) || null,
        crisis_type: 'escalated_anonymous',
        severity: report.severity === 'critical' ? 'critical' : 'high',
        status: 'active',
        anonymous_report_id: report.id,
        location_text: report.location_text,
      } as any);
    if (error) toast.error('Failed to escalate');
    else {
      toast.success('Escalated to Crisis Command Center');
      queryClient.invalidateQueries({ queryKey: ['admin-crisis'] });
    }
  };

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
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Reports</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !reports?.length ? (
            <p className="text-center py-8 text-muted-foreground">No reports yet.</p>
          ) : (
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="p-3 border rounded-lg flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{r.report_id}</div>
                    <div className="text-xs text-muted-foreground">{r.category}</div>
                    {r.title && <div className="text-xs text-muted-foreground mt-0.5">{r.title}</div>}
                    {r.location_text && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{r.location_text}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {['critical', 'high'].includes(r.severity) && (
                      <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => escalateToCrisis(r)}>
                        <AlertTriangle className="w-3 h-3 mr-1" />Escalate
                      </Button>
                    )}
                    <Badge variant={r.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{r.severity}</Badge>
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

// ── Crisis Command Center ─────────────────────────────────────────────────────
function CrisisSubTab() {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDesc, setBroadcastDesc] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('critical');
  const queryClient = useQueryClient();

  // Query crisis_reports
  const { data: crisisReports, isLoading: loadingCrisis, refetch: refetchCrisis } = useQuery({
    queryKey: ['admin-crisis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crisis_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Query high-severity incidents (not archived)
  const { data: criticalIncidents, isLoading: loadingIncidents } = useQuery({
    queryKey: ['admin-crisis-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .in('severity', ['critical', 'high'])
        .is('archived_at' as any, null)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loadingCrisis || loadingIncidents;

  // Combine into unified feed
  const combinedFeed = [
    ...(crisisReports?.filter(cr => cr.status !== 'archived').map(cr => ({
      id: cr.id,
      type: cr.crisis_type === 'admin_broadcast' ? 'broadcast' : cr.crisis_type === 'escalated_incident' ? 'escalated' : cr.crisis_type === 'user_flagged' ? 'crisis_post' : 'crisis_report',
      title: cr.title,
      description: cr.description,
      severity: cr.severity,
      status: cr.status,
      location: cr.location_text,
      created_at: cr.created_at || '',
      source: 'crisis_reports' as const,
      sourceId: cr.id,
    })) || []),
    ...(criticalIncidents?.filter(inc => !crisisReports?.some(cr => (cr as any).incident_id === inc.id)).map(inc => ({
      id: `inc-${inc.id}`,
      type: 'incident',
      title: inc.title || 'Untitled Incident',
      description: inc.description,
      severity: inc.severity || 'high',
      status: inc.status || 'open',
      location: inc.location_text,
      created_at: inc.created_at || '',
      source: 'incidents' as const,
      sourceId: inc.id,
    })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const counts = {
    critical: combinedFeed.filter(i => i.severity === 'critical').length,
    high: combinedFeed.filter(i => i.severity === 'high').length,
    active: combinedFeed.filter(i => ['active', 'open', 'investigating'].includes(i.status)).length,
    resolved: (crisisReports?.filter(cr => cr.status === 'resolved').length || 0),
  };

  const updateCrisisStatus = async (id: string, newStatus: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user?.id;
    }
    const { error } = await supabase.from('crisis_reports').update(updates).eq('id', id);
    if (error) toast.error('Failed to update');
    else { toast.success(`Status updated to ${newStatus}`); refetchCrisis(); }
  };

  const archiveCrisis = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('crisis_reports').update({
      status: 'archived',
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id,
    }).eq('id', id);
    if (error) toast.error('Failed to archive');
    else { toast.success('Archived'); refetchCrisis(); }
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim()) { toast.error('Title required'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const reportId = `ALERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    const { error } = await supabase.from('crisis_reports').insert({
      report_id: reportId,
      title: broadcastTitle.trim(),
      description: broadcastDesc.trim() || null,
      crisis_type: 'admin_broadcast',
      severity: broadcastSeverity,
      status: 'active',
    } as any);
    if (error) toast.error('Failed to broadcast');
    else {
      toast.success('Emergency alert broadcast recorded');
      setBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastDesc('');
      refetchCrisis();
    }
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case 'broadcast': return <Badge variant="destructive" className="text-xs gap-1"><Radio className="w-3 h-3" />Broadcast</Badge>;
      case 'escalated': return <Badge variant="destructive" className="text-xs">Escalated Incident</Badge>;
      case 'crisis_post': return <Badge variant="secondary" className="text-xs">Crisis Post</Badge>;
      case 'incident': return <Badge variant="outline" className="text-xs">High-Sev Incident</Badge>;
      default: return <Badge variant="outline" className="text-xs">Crisis Report</Badge>;
    }
  };

  const sevColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'border-l-destructive';
      case 'high': return 'border-l-orange-500';
      default: return 'border-l-yellow-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-xl font-bold">Crisis Command Center</h3>
              <p className="text-sm text-muted-foreground">Real-time monitoring and emergency response — aggregates incidents, crisis reports, and escalated content</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { refetchCrisis(); }}><RefreshCw className="w-4 h-4" /></Button>
              <Button variant="destructive" onClick={() => setBroadcastOpen(true)}>
                <Radio className="w-4 h-4 mr-2" />Broadcast Emergency Alert
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Dialog */}
      {broadcastOpen && (
        <Card className="border-destructive">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2"><Radio className="w-4 h-4 text-destructive" />Broadcast Emergency Alert</h4>
            <p className="text-xs text-muted-foreground">This creates a permanent record in the crisis monitoring system. It does NOT send push notifications or contact external authorities.</p>
            <Input placeholder="Alert title *" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} maxLength={200} />
            <Textarea placeholder="Description (optional)" value={broadcastDesc} onChange={e => setBroadcastDesc(e.target.value)} rows={3} maxLength={2000} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Severity:</span>
              {['critical', 'high', 'medium'].map(s => (
                <Button key={s} size="sm" variant={broadcastSeverity === s ? 'default' : 'outline'} onClick={() => setBroadcastSeverity(s)} className="capitalize text-xs">{s}</Button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={sendBroadcast} disabled={!broadcastTitle.trim()}>Send Broadcast</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Severity Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.critical}</div>
            <div className="text-xs text-muted-foreground">CRITICAL</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.high}</div>
            <div className="text-xs text-muted-foreground">HIGH</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.active}</div>
            <div className="text-xs text-muted-foreground">ACTIVE</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{counts.resolved}</div>
            <div className="text-xs text-muted-foreground">RESOLVED</div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Feed */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : !combinedFeed.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            No active crisis items. All clear.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {combinedFeed.map(item => {
            const canResolve = ['active', 'open', 'investigating'].includes(item.status);
            const canArchive = ['resolved', 'dismissed'].includes(item.status) && item.source === 'crisis_reports';
            return (
              <Card key={item.id} className={`border-l-4 ${sevColor(item.severity)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {typeBadge(item.type)}
                        <Badge variant={item.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs capitalize">{item.severity}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                      {item.location && <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{item.location}</span>}
                    </div>
                    {item.source === 'crisis_reports' && (
                      <div className="flex gap-1 shrink-0 flex-wrap">
                        {canResolve && (
                          <>
                            {item.status !== 'investigating' && (
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateCrisisStatus(item.sourceId, 'investigating')}>
                                Investigate
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="text-xs h-7 text-green-600" onClick={() => updateCrisisStatus(item.sourceId, 'resolved')}>
                              <CheckCircle className="w-3 h-3 mr-1" />Resolve
                            </Button>
                          </>
                        )}
                        {canArchive && (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-muted-foreground" onClick={() => archiveCrisis(item.sourceId)}>
                            📦 Archive
                          </Button>
                        )}
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
