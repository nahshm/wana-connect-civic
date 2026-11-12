import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostModeBlock } from '@/components/posts/PostModeBlock';

/** Lists a community's poll or event posts (polls and events now live in the feed as post types). */
export function CommunityModePosts({ communityId, mode }: { communityId: string; mode: 'poll' | 'event' }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['community-mode-posts', communityId, mode],
    queryFn: async () => {
      const { data } = await (supabase as any).from('posts')
        .select('id, title, post_mode, mode_data, created_at')
        .eq('community_id', communityId).eq('post_mode', mode).neq('is_hidden', true)
        .order('created_at', { ascending: false }).limit(30);
      return (data || []) as any[];
    },
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data.length) return <p className="text-sm text-muted-foreground">No {mode === 'poll' ? 'polls' : 'events'} yet. Create one from the post composer by choosing “{mode === 'poll' ? 'Poll' : 'Event'}”.</p>;
  return (
    <div className="space-y-3">
      {data.map(p => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-4">
          <Link to={`/post/${p.id}`} className="font-semibold hover:text-primary">{p.title}</Link>
          <div className="mt-2"><PostModeBlock postId={p.id} mode={p.post_mode} modeData={p.mode_data} /></div>
        </div>
      ))}
    </div>
  );
}
