import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, MapPin, BookOpen, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props { postId: string; mode?: string | null; modeData?: any }

/** Extra part of a feed post that depends on its type (poll voting, event details, issue/guide label). */
export function PostModeBlock({ postId, mode, modeData }: Props) {
  if (!mode || mode === 'discussion') return null;
  if (mode === 'issue') return <Badge variant="outline" className="mb-2 gap-1 border-primary/40 text-primary"><Receipt className="w-3 h-3" />Civic issue</Badge>;
  if (mode === 'guide') return <Badge variant="secondary" className="mb-2 gap-1"><BookOpen className="w-3 h-3" />Civic guide</Badge>;
  if (mode === 'event') {
    const start = modeData?.start_time ? new Date(modeData.start_time) : null;
    const loc = typeof modeData?.location === 'string' ? modeData.location : modeData?.location?.address || modeData?.location?.name;
    return (
      <div className="mb-2 rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
        <div className="flex items-center gap-2 font-medium"><CalendarDays className="w-4 h-4 text-primary" />{start ? start.toLocaleString() : 'Date to be announced'}</div>
        {loc && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" />{loc}</div>}
      </div>
    );
  }
  if (mode === 'poll') return <PollBlock postId={postId} options={Array.isArray(modeData?.options) ? modeData.options : []} expiresAt={modeData?.expires_at} />;
  return null;
}

function PollBlock({ postId, options, expiresAt }: { postId: string; options: any[]; expiresAt?: string }) {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const qc = useQueryClient();
  const closed = !!expiresAt && new Date(expiresAt) < new Date();
  const { data } = useQuery({
    queryKey: ['post-poll', postId, user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('post_poll_votes').select('user_id, option_index').eq('post_id', postId);
      const rows = (data || []) as { user_id: string; option_index: number }[];
      return { counts: options.map((_, i) => rows.filter(r => r.option_index === i).length), mine: rows.find(r => r.user_id === user?.id)?.option_index ?? null, total: rows.length };
    },
  });
  const vote = async (i: number) => {
    if (!user) { authModal.open('login'); return; }
    if (closed) return;
    const db = (supabase as any).from('post_poll_votes');
    const { error } = data?.mine === i
      ? await db.delete().eq('post_id', postId).eq('user_id', user.id)
      : await db.upsert({ post_id: postId, user_id: user.id, option_index: i }, { onConflict: 'post_id,user_id' });
    if (error) toast({ title: 'Could not save your vote', description: error.message, variant: 'destructive' });
    qc.invalidateQueries({ queryKey: ['post-poll', postId] });
  };
  const showResults = data?.mine != null || closed;
  return (
    <div className="mb-2 space-y-1.5" onClick={e => e.stopPropagation()}>
      {options.map((opt, i) => {
        const label = typeof opt === 'string' ? opt : opt?.text ?? opt?.label ?? String(opt);
        const pct = data?.total ? Math.round((data.counts[i] / data.total) * 100) : 0;
        return (
          <button key={i} type="button" onClick={() => vote(i)} disabled={closed}
            className={cn('relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              data?.mine === i ? 'border-primary' : 'border-border hover:border-primary/50')}>
            {showResults && <span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${pct}%` }} />}
            <span className="relative flex justify-between gap-2"><span>{label}</span>{showResults && <span className="text-muted-foreground">{pct}%</span>}</span>
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">{data?.total ?? 0} vote{data?.total === 1 ? '' : 's'}{closed ? ' · Poll closed' : ''}</p>
    </div>
  );
}
