import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Post } from '@/types';
import { POST_SELECT_QUERY, transformPost, RawPostData } from './usePosts';

/**
 * Hook to fetch posts a user has saved
 */
export function useSavedPosts() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['saved-posts', user?.id],
        queryFn: async (): Promise<Post[]> => {
            if (!user) return [];

            // Fetch saved items first to get IDs
            const { data: savedItems, error: savedError } = await supabase
                .from('saved_items')
                .select('item_id')
                .eq('user_id', user.id)
                .eq('item_type', 'post')
                .order('created_at', { ascending: false });

            if (savedError) throw savedError;
            if (!savedItems || savedItems.length === 0) return [];

            const postIds = savedItems.map(item => item.item_id);

            // Fetch actual post data
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(POST_SELECT_QUERY)
                .in('id', postIds);

            if (postsError) throw postsError;

            // Fetch interaction states for these specific posts
            const [votesResult, followsResult] = await Promise.all([
                supabase.from('votes').select('post_id, vote_type').eq('user_id', user.id).in('post_id', postIds),
                supabase.from('post_follows').select('post_id').eq('user_id', user.id).in('post_id', postIds)
            ]);

            const userVotes: { [key: string]: 'up' | 'down' } = {};
            votesResult.data?.forEach(v => { userVotes[v.post_id] = v.vote_type as 'up' | 'down'; });
            
            const userFollows: { [key: string]: boolean } = {};
            followsResult.data?.forEach(f => { userFollows[f.post_id] = true; });

            // Sort posts to match the order of savedItems (most recent saved first)
            const postMap = new Map(postsData.map(p => [p.id, p]));
            
            return savedItems
                .map(item => postMap.get(item.item_id))
                .filter(Boolean)
                .map(post => transformPost(
                    post as RawPostData, 
                    userVotes[post!.id], 
                    true, // isSaved is true by definition
                    !!userFollows[post!.id]
                ));
        },
        enabled: !!user?.id,
    });
}

/**
 * Hook to fetch posts a user is following
 */
export function useFollowedPosts() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['followed-posts', user?.id],
        queryFn: async (): Promise<Post[]> => {
            if (!user) return [];

            // Fetch followed post IDs
            const { data: followsData, error: followsError } = await supabase
                .from('post_follows')
                .select('post_id, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (followsError) throw followsError;
            if (!followsData || followsData.length === 0) return [];

            const postIds = followsData.map(f => f.post_id);

            // Fetch actual post data
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(POST_SELECT_QUERY)
                .in('id', postIds);

            if (postsError) throw postsError;

            // Fetch interaction states
            const [votesResult, savesResult] = await Promise.all([
                supabase.from('votes').select('post_id, vote_type').eq('user_id', user.id).in('post_id', postIds),
                supabase.from('saved_items').select('item_id').eq('user_id', user.id).eq('item_type', 'post').in('item_id', postIds)
            ]);

            const userVotes: { [key: string]: 'up' | 'down' } = {};
            votesResult.data?.forEach(v => { userVotes[v.post_id] = v.vote_type as 'up' | 'down'; });
            
            const userSaves: { [key: string]: boolean } = {};
            savesResult.data?.forEach(s => { userSaves[s.item_id] = true; });

            // Sort to match follow order
            const postMap = new Map(postsData.map(p => [p.id, p]));
            
            return followsData
                .map(f => postMap.get(f.post_id))
                .filter(Boolean)
                .map(post => transformPost(
                    post as RawPostData, 
                    userVotes[post!.id], 
                    !!userSaves[post!.id],
                    true // isFollowed is true by definition
                ));
        },
        enabled: !!user?.id,
    });
}
