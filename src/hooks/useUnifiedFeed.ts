
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeedItem } from '@/components/feed/UnifiedFeedItem';

interface UseUnifiedFeedOptions {
  userId?: string | null;
  communityId?: string | null;
  limit?: number;
  sortBy?: 'hot' | 'new' | 'top' | 'rising';
  verifiedOnly?: boolean;
}

// Map UI sort values to DB parameter values
const SORT_MAP: Record<string, string> = {
  hot: 'hot',
  new: 'newest',
  top: 'top',
  rising: 'rising',
};

export interface UnifiedFeedPage {
  items: FeedItem[];
  hasMore: boolean;
}

export const useUnifiedFeed = ({ userId, communityId, limit = 10, sortBy = 'hot', verifiedOnly = false }: UseUnifiedFeedOptions = {}) => {
  return useInfiniteQuery<UnifiedFeedPage>({
    queryKey: ['unified-feed', { userId, communityId, sortBy, verifiedOnly }],
    queryFn: async ({ pageParam }) => {
      const offset = (pageParam as number) * limit;

      const rpcParams: Record<string, unknown> = {
        p_user_id: userId || null,
        p_community_id: communityId || null,
        p_limit_count: limit,
        p_offset_count: offset,
        p_sort_by: SORT_MAP[sortBy] || 'newest',
        p_verified_only: verifiedOnly,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_unified_feed', rpcParams);

      if (error) throw error;

      // Transform data to FeedItem type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let items: FeedItem[] = ((data as any[]) || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        user_id: item.user_id,
        username: item.username,
        avatar_url: item.avatar_url,
        created_at: item.created_at,
        data: item.data
      }));

      // Attach user interaction states for post items
      if (userId && items.length > 0) {
        const postIds = items.filter(item => item.type === 'post').map(item => item.id);
        if (postIds.length > 0) {
          const [votesResult, savesResult, followsResult, hiddenResult] = await Promise.all([
            supabase.from('votes').select('post_id, vote_type').eq('user_id', userId).in('post_id', postIds),
            supabase.from('saved_items').select('item_id').eq('user_id', userId).eq('item_type', 'post').in('item_id', postIds),
            supabase.from('post_follows').select('post_id').eq('user_id', userId).in('post_id', postIds),
            supabase.from('hidden_items').select('item_id').eq('user_id', userId).eq('item_type', 'post').in('item_id', postIds)
          ]);

          const voteMap = (votesResult.data || []).reduce((acc, vote) => {
            acc[vote.post_id] = vote.vote_type;
            return acc;
          }, {} as Record<string, string>);

          const saveMap = new Set((savesResult.data || []).map(s => s.item_id));
          const followMap = new Set((followsResult.data || []).map(f => f.post_id));
          const hiddenMap = new Set((hiddenResult.data || []).map(h => h.item_id));

          // Filter out hidden items and map state
          items = items
            .filter(item => item.type !== 'post' || !hiddenMap.has(item.id))
            .map(item => {
              if (item.type === 'post') {
                return {
                  ...item,
                  data: {
                    ...item.data,
                    user_vote: voteMap[item.id] || null,
                    is_saved: saveMap.has(item.id),
                    is_followed: followMap.has(item.id)
                  }
                };
              }
              return item;
            });
        }
      }

      // Determine if there are more items based on the raw response length BEFORE client-side filtering
      const hasMore = ((data as any[]) || []).length === limit;

      return { items, hasMore };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: UnifiedFeedPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
