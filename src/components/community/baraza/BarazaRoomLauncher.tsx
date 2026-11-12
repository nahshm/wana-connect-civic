import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Video, ExternalLink, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

/** Baraza = external live rooms (Zoom / X Spaces / Meet) until we build our own WebRTC. */
export function detectProvider(url: string): 'zoom' | 'x_spaces' | 'google_meet' | 'other' {
  const u = url.toLowerCase();
  if (u.includes('zoom.us')) return 'zoom';
  if (u.includes('x.com/i/spaces') || u.includes('twitter.com/i/spaces')) return 'x_spaces';
  if (u.includes('meet.google.com')) return 'google_meet';
  return 'other';
}
const PROVIDER_LABEL = { zoom: 'Zoom', x_spaces: 'X Spaces', google_meet: 'Google Meet', other: 'Live room' } as const;

interface Room {
  space_id: string; title: string; description: string | null; external_url: string;
  provider: keyof typeof PROVIDER_LABEL | null; host_user_id: string; scheduled_start: string | null; created_at: string;
}

export function BarazaRoomLauncher({ channelId, communityId, channelName }: { channelId: string; communityId?: string; channelName: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [when, setWhen] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['baraza-rooms', channelId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('baraza_spaces')
        .select('space_id,title,description,external_url,provider,host_user_id,scheduled_start,created_at')
        .eq('channel_id', channelId).not('external_url', 'is', null)
        .order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data as Room[];
    },
  });

  const create = async () => {
    if (!user) return;
    if (!title.trim() || !/^https:\/\//i.test(url.trim())) {
      toast({ title: 'Add a title and a link starting with https://', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from('baraza_spaces').insert({
      title: title.trim(), external_url: url.trim(), provider: detectProvider(url),
      host_user_id: user.id, channel_id: channelId, community_id: communityId ?? null,
      scheduled_start: when ? new Date(when).toISOString() : null, is_live: !when,
    });
    setSaving(false);
    if (error) { toast({ title: 'Could not share the room', description: error.message, variant: 'destructive' }); return; }
    setTitle(''); setUrl(''); setWhen(''); setOpen(false);
    qc.invalidateQueries({ queryKey: ['baraza-rooms', channelId] });
  };

  const remove = async (id: string) => {
    await (supabase as any).from('baraza_spaces').delete().eq('space_id', id);
    qc.invalidateQueries({ queryKey: ['baraza-rooms', channelId] });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center"><Video className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="text-lg font-bold">Baraza · #{channelName}</h2>
            <p className="text-sm text-muted-foreground">Share a Zoom, X Spaces or Google Meet link so members can join your live session.</p>
          </div>
        </div>
        {user && !open && <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" />Open a live room</Button>}
      </div>

      {open && (
        <Card className="p-4 space-y-3">
          <div className="space-y-1"><Label htmlFor="bz-title">Title</Label><Input id="bz-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ward budget townhall" /></div>
          <div className="space-y-1"><Label htmlFor="bz-url">Meeting link</Label><Input id="bz-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://zoom.us/j/..." /></div>
          <div className="space-y-1"><Label htmlFor="bz-when">Starts (leave empty if live now)</Label><Input id="bz-when" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} /></div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={create} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Share room</Button>
          </div>
        </Card>
      )}

      {isLoading ? <p className="text-sm text-muted-foreground">Loading rooms…</p> : rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No live rooms yet.</p>
      ) : rooms.map(r => (
        <Card key={r.space_id} className="p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground">
              {PROVIDER_LABEL[r.provider ?? 'other']} · {r.scheduled_start ? new Date(r.scheduled_start).toLocaleString() : 'Live now'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {user?.id === r.host_user_id && <Button variant="ghost" size="icon" aria-label="Remove room" onClick={() => remove(r.space_id)}><Trash2 className="w-4 h-4" /></Button>}
            <Button asChild size="sm"><a href={r.external_url} target="_blank" rel="noopener noreferrer">Join<ExternalLink className="w-3.5 h-3.5 ml-1" /></a></Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
