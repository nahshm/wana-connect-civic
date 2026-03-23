import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface AgentEvent {
  id: string;
  event_type: string;
  source_agent: string;
  target_agent: string | null;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  thinking: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  tool_call: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  tool_result: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  routing_decision: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  moderation_flag: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  ingest_complete: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  fact_check: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  issue_cluster: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  draft_ready: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  answer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
};

const MAX_EVENTS = 100;

export function LiveEventsFeed() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Bootstrap: load last 50 events
  useEffect(() => {
    (supabase as any)
      .from('agent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }: { data: AgentEvent[] | null }) => {
        if (data) setEvents(data.reverse());
      });
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('live-agent-events')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'agent_events' },
        (payload: { new: AgentEvent }) => {
          const ev = payload.new;
          setEvents(prev => {
            const next = [ev, ...prev].slice(0, MAX_EVENTS);
            return next;
          });
          setNewIds(prev => {
            const next = new Set(prev);
            next.add(ev.id);
            setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(ev.id); return n; }), 1500);
            return next;
          });
        },
      )
      .subscribe(status => setConnected(status === 'SUBSCRIBED'));

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  const agents = Array.from(new Set(events.map(e => e.source_agent)));
  const types = Array.from(new Set(events.map(e => e.event_type)));

  const filtered = events.filter(e =>
    (agentFilter === 'all' || e.source_agent === agentFilter) &&
    (typeFilter === 'all' || e.event_type === typeFilter),
  );

  const payloadPreview = (payload: Record<string, unknown>) => {
    const str = JSON.stringify(payload);
    return str.length > 150 ? str.slice(0, 150) + '...' : str;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />Live Events
          </h3>
          <p className="text-sm text-muted-foreground">Real-time inter-agent event stream</p>
        </div>
        <div className="flex items-center gap-2">
          {connected
            ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><Wifi className="w-3.5 h-3.5" />Live</span>
            : <span className="flex items-center gap-1 text-xs text-muted-foreground"><WifiOff className="w-3.5 h-3.5" />Connecting…</span>}
          <Badge variant="outline" className="text-xs">{events.length} events</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
          className="text-xs h-8 rounded-md border border-input bg-background px-2"
        >
          <option value="all">All Agents</option>
          {agents.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-xs h-8 rounded-md border border-input bg-background px-2"
        >
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEvents([])}>
          Clear
        </Button>
      </div>

      {/* Event list */}
      {!filtered.length ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Activity className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No events yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Events appear here in real-time when agents run. Go to the <strong>Agents</strong> tab and trigger a run to see events flow.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(ev => (
            <div
              key={ev.id}
              className={`p-3 rounded-lg border text-xs transition-all duration-500 ${
                newIds.has(ev.id)
                  ? 'bg-primary/5 border-primary/40 scale-[1.01]'
                  : 'bg-muted/30 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${EVENT_TYPE_COLORS[ev.event_type] ?? EVENT_TYPE_COLORS.answer}`}>
                  {ev.event_type.replace(/_/g, ' ')}
                </span>
                <span className="font-semibold text-foreground">{ev.source_agent}</span>
                {ev.target_agent && (
                  <span className="text-muted-foreground">→ {ev.target_agent}</span>
                )}
                <span className="text-muted-foreground ml-auto">
                  {new Date(ev.created_at).toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-muted-foreground font-mono text-[10px] whitespace-pre-wrap break-all">
                {payloadPreview(ev.payload)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
