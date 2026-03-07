
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeedItem } from '@/components/feed/UnifiedFeedItem';

interface UseUnifiedFeedOptions {
  userId?: string | null;
  limit?: number;
  sortBy?: 'hot' | 'new' | 'top' | 'rising';
}

export const useUnifiedFeed = ({ userId, limit = 10, sortBy = 'hot' }: UseUnifiedFeedOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ['unified-feed', { userId, sortBy }],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * limit;

      // Call the RPC function
      const { data, error } = await (supabase.rpc as any)('get_unified_feed', {
          p_user_id: userId || null,
          p_limit_count: limit,
          p_offset_count: offset,
          // temporarily removed p_sort_by to prevent PGRST202 errors
          // as the DB schema does not currently support it.
        });

      if (error) throw error;

      // Transform data to FeedItem type
      let items: FeedItem[] = ((data as any[]) || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        user_id: item.user_id,
        username: item.username,
        avatar_url: item.avatar_url,
        created_at: item.created_at,
        data: item.data
      }));

      // Attach user votes for post items
      if (userId && items.length > 0) {
        const postIds = items.filter(item => item.type === 'post').map(item => item.id);
        if (postIds.length > 0) {
          const { data: votes } = await supabase
            .from('votes')
            .select('post_id, vote_type')
            .eq('user_id', userId)
            .in('post_id', postIds);

          if (votes) {
            const voteMap = votes.reduce((acc, vote) => {
              acc[vote.post_id] = vote.vote_type;
              return acc;
            }, {} as Record<string, string>);

            items = items.map(item => {
              if (item.type === 'post' && voteMap[item.id]) {
                return {
                  ...item,
                  data: {
                    ...item.data,
                    user_vote: voteMap[item.id]
                  }
                };
              }
              return item;
            });
          }
        }
      }

      return items;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer items than the limit, we've reached the end
      if (lastPage.length < limit) return undefined;
      // Otherwise, the next page param is the current number of pages (which equals the next index)
      return allPages.length;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - Data remains "fresh" for 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes - Keep unused data in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: false,       // Don't refetch if component remounts within staleTime
  });
};
