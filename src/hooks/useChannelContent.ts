import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Post, GovernmentProject } from '@/types';

// Utility function to convert snake_case keys to camelCase recursively
function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result: any, key: string) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

interface Channel {
    id: string;
    name: string;
    type: string;
    category?: string;
}

interface Community {
    id: string;
    locationType?: string;
    locationValue?: string;
}

async function fetchChannelPosts(
    communityId: string,
    channelId: string,
    signal?: AbortSignal
): Promise<Post[]> {
    const { data: postsData } = await supabase
        .from('posts')
        .select(`
      *,
      author:profiles(*),
      community:communities(*),
      post_media(*)
    `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(signal);

    const camelCasePosts = toCamelCase(postsData) || [];
    return camelCasePosts.map((p: any) => ({
        ...p,
        media: p.postMedia,
    }));
}

async function fetchChannelProjects(
    community: Community,
    signal?: AbortSignal
): Promise<GovernmentProject[]> {
    if (!community.locationType || !community.locationValue) {
        return [];
    }

    const { data: projectsData } = await supabase
        .from('government_projects')
        .select(`
      *,
      official:officials(id, name, position)
    `)
        .or(`${community.locationType}.eq.${community.locationValue}`)
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(signal);

    return toCamelCase(projectsData) || [];
}

async function fetchChannelMembers(
    communityId: string,
    signal?: AbortSignal
): Promise<any[]> {
    const { data: membersData } = await supabase
        .from('community_members')
        .select(`
      *,
      profiles (username, display_name, avatar_url, role)
    `)
        .eq('community_id', communityId)
        .abortSignal(signal);

    return toCamelCase(membersData) || [];
}

export const useChannelContent = (
    communityId: string | undefined,
    channel: Channel | undefined,
    community: Community | undefined
) => {
    const isTextChannel = channel && ['feed', 'text', 'announcement'].includes(channel.type);
    const isProjectsChannel = channel?.name === 'projects-watch';

    // Posts query for text channels
    const {
        data: posts,
        isLoading: postsLoading,
        refetch: refetchPosts,
    } = useQuery({
        queryKey: ['channelPosts', communityId, channel?.id],
        queryFn: ({ signal }) => fetchChannelPosts(communityId!, channel!.id, signal),
        enabled: !!communityId && !!channel && isTextChannel,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Projects query for projects-watch channel
    const {
        data: projects,
        isLoading: projectsLoading,
    } = useQuery({
        queryKey: ['channelProjects', communityId, channel?.id],
        queryFn: ({ signal }) => fetchChannelProjects(community!, signal),
        enabled: !!communityId && !!channel && !!community && isProjectsChannel,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Members query (used for sidebar)
    const {
        data: members,
        isLoading: membersLoading,
    } = useQuery({
        queryKey: ['channelMembers', communityId],
        queryFn: ({ signal }) => fetchChannelMembers(communityId!, signal),
        enabled: !!communityId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        posts: posts ?? [],
        projects: projects ?? [],
        members: members ?? [],
        postsLoading,
        projectsLoading,
        membersLoading,
        refetchPosts,
    };
};
