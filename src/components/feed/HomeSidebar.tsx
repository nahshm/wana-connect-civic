import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, MessageSquare, Users } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { getMediaUrl } from '@/lib/secureMedia';
import { SecureImage } from '@/components/security/SecureImage';

interface RecentPost {
  id: string;
  title: string;
  created_at: string;
  upvotes: number;
  comment_count: number;
  community_name: string;
  community_avatar: string | null;
  thumbnail: string | null;
  link_image: string | null;
}

interface PopularCommunity {
  id: string;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  member_count: number;
}

interface HomeSidebarProps {
  userId?: string;
}

export const HomeSidebar = ({ userId }: HomeSidebarProps) => {
  const { toast } = useToast();
  const authModal = useAuthModal();
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [communities, setCommunities] = useState<PopularCommunity[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [showRecent, setShowRecent] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [postsRes, commRes] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, created_at, upvotes, comment_count, link_image, community:communities(name, avatar_url), media:post_media(file_path, file_type)')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('communities')
          .select('id, name, display_name, avatar_url, member_count')
          .order('member_count', { ascending: false })
          .limit(10),
      ]);

      let posts: RecentPost[] = [];

      if (postsRes.data) {
        posts = postsRes.data.map((p) => {
          const media = p.media as unknown as { file_path: string; file_type: string }[] | null;
          const imageMedia = (media || []).find((m) => m.file_type?.startsWith('image'));
          return {
            id: p.id,
            title: p.title,
            created_at: p.created_at,
            upvotes: p.upvotes || 0,
            comment_count: p.comment_count || 0,
            community_name: p.community?.name || 'General',
            community_avatar: p.community?.avatar_url || null,
            thumbnail: imageMedia?.file_path || null,
            link_image: p.link_image || null,
          };
        });
        setRecentPosts(posts);
      }

      if (commRes.data) {
        // Build activity map from recent posts
        const communityActivity = new Map<string, number>();
        posts.forEach(post => {
          if (post.community_name) {
            communityActivity.set(post.community_name, (communityActivity.get(post.community_name) || 0) + 1);
          }
        });

        // Rank by engagement: recent activity first, then member_count
        const ranked = (commRes.data as unknown as PopularCommunity[])
          .map((c) => ({
            ...c,
            recent_activity: communityActivity.get(c.name) || 0,
          }))
          .sort((a, b) => {
            if (b.recent_activity !== a.recent_activity) return b.recent_activity - a.recent_activity;
            return b.member_count - a.member_count;
          })
          .slice(0, 5)
          .map(({ recent_activity, ...c }) => c);

        setCommunities(ranked);
      }
    };
    fetchData();
  }, []);

  // Check membership for communities
  useEffect(() => {
    if (!userId || communities.length === 0) return;
    const checkMembership = async () => {
      const { data } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId)
        .in('community_id', communities.map(c => c.id));
      if (data) {
        setJoinedIds(new Set(data.map(m => m.community_id)));
      }
    };
    checkMembership();
  }, [userId, communities]);

  const handleJoin = useCallback(async (communityId: string) => {
    if (!userId) {
      authModal.open('login');
      return;
    }
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({ community_id: communityId, user_id: userId });
      if (error) throw error;
      setJoinedIds(prev => new Set([...prev, communityId]));
      toast({ title: 'Joined!' });
    } catch (err: unknown) {
      const pgError = err as { code?: string };
      if (pgError?.code === '23505') {
        setJoinedIds(prev => new Set([...prev, communityId]));
      } else {
        toast({ title: 'Error', description: 'Could not join.', variant: 'destructive' });
      }
    }
  }, [userId, authModal, toast]);

  const thumbUrl = (post: RecentPost) => {
    if (post.thumbnail) {
      if (post.thumbnail.startsWith('http')) return post.thumbnail;
      // Use proxy for private bucket media
      return getMediaUrl('media', post.thumbnail);
    }
    return post.link_image || null;
  };

  return (
    <div className="space-y-6">
      {/* Recent Posts */}
      {showRecent && recentPosts.length > 0 && (
        <div className="overflow-hidden">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Posts
            </h3>
            <button
              onClick={() => setShowRecent(false)}
              className="text-xs text-civic-blue hover:text-civic-blue/80 transition-colors font-semibold"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {recentPosts.map(post => {
              const img = thumbUrl(post);
              return (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="flex items-start gap-2.5 px-4 py-3 hover:bg-muted/30 transition-colors group border-b border-neutral-300 dark:border-neutral-700 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
                      <Avatar className="h-4 w-4 rounded-full border border-border/10">
                        {post.community_avatar && <AvatarImage src={post.community_avatar} />}
                        <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                          {post.community_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground/80">c/{post.community_name}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: false })} ago</span>
                    </div>
                    <p className="text-[13.5px] font-semibold text-muted-foreground line-clamp-2 leading-tight group-hover:text-civic-blue transition-colors">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-medium">
                      <span className="flex items-center">
                        {post.upvotes} upvotes
                      </span>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="flex items-center">
                        {post.comment_count} comments
                      </span>
                    </div>
                  </div>
                  {img && (
                    <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-border/10 bg-muted/20 mt-1">
                      <SecureImage
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Communities */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Popular Communities
        </h3>
        <div className="space-y-1">
          {communities.map(comm => {
            const joined = joinedIds.has(comm.id);
            return (
              <div
                key={comm.id}
                className="flex items-center justify-between p-2 -mx-1 rounded-lg hover:bg-accent/50 transition-colors border-b border-neutral-200 dark:border-neutral-800 last:border-0"
              >
                <Link to={`/c/${comm.name}`} className="min-w-0 flex-1 flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    {comm.avatar_url && <AvatarImage src={comm.avatar_url} />}
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {comm.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {comm.display_name || `c/${comm.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {comm.member_count.toLocaleString()} members
                    </p>
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant={joined ? "outline" : "default"}
                  className="h-7 px-3 text-xs flex-shrink-0 ml-2"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!joined) handleJoin(comm.id);
                  }}
                  disabled={joined}
                >
                  {joined ? 'Joined' : 'Join'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Link to="/explore" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/settings" className="hover:text-foreground transition-colors">Help</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/communities" className="hover:text-foreground transition-colors">Rules</Link>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">ama Inc © 2026</p>
      </div>
    </div>
  );
};
