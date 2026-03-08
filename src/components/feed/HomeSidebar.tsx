import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, ArrowUp, MessageSquare } from 'lucide-react';

interface TrendingPost {
  id: string;
  title: string;
  community: string;
  upvotes: number;
  comments: number;
}

interface Community {
  id: string;
  name: string;
  members: number;
  description: string;
}

export const HomeSidebar = () => {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [postsRes, commRes] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, upvotes, comment_count, community:communities(name)')
          .order('upvotes', { ascending: false })
          .limit(5),
        supabase
          .from('communities')
          .select('id, name, member_count, description')
          .order('member_count', { ascending: false })
          .limit(5),
      ]);

      if (postsRes.data) {
        setTrendingPosts(postsRes.data.map((p: any) => ({
          id: p.id,
          title: p.title,
          community: p.community?.name ? `c/${p.community.name}` : 'General',
          upvotes: p.upvotes || 0,
          comments: p.comment_count || 0,
        })));
      }

      if (commRes.data) {
        setCommunities(commRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          members: c.member_count || 0,
          description: c.description || '',
        })));
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      {/* Trending Posts */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Trending Today
        </h3>
        <div className="space-y-1">
          {trendingPosts.map((post, i) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="flex items-start gap-2.5 p-2 -mx-1 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <span className="text-xs font-bold text-muted-foreground/60 w-4 pt-0.5 text-right">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{post.community}</span>
                  <span className="flex items-center gap-0.5">
                    <ArrowUp className="w-3 h-3" />
                    {post.upvotes}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageSquare className="w-3 h-3" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {trendingPosts.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No trending posts yet.</p>
          )}
        </div>
      </div>

      {/* Popular Communities */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Popular Communities
        </h3>
        <div className="space-y-1">
          {communities.map((comm) => (
            <Link
              key={comm.id}
              to={`/c/${comm.name}`}
              className="flex items-center justify-between p-2 -mx-1 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  c/{comm.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {comm.members.toLocaleString()} members
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs flex-shrink-0 ml-2"
              >
                View
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/help" className="hover:text-foreground transition-colors">Help</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/rules" className="hover:text-foreground transition-colors">Rules</Link>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">ama Inc © 2024</p>
      </div>
    </div>
  );
};
