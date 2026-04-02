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

    // Return posts directly — Supabase uses snake_case; do NOT apply toCamelCase
    // as it breaks field names like media_urls, post_media, created_at, etc.
    return (postsData || []).map((p) => ({
        ...p,
        media: p.post_media,
    })) as unknown as Post[];
}

async function fetchChannelProjects(
    community: Community,
    signal?: AbortSignal
): Promise<GovernmentProject[]> {
    if (!community.locationType || !community.locationValue) {
        return [];
    }

    const { data: projectsData, error } = await supabase
        .from('government_projects')
        .select(`
            *,
            primary_official:government_positions(
                id, 
                title, 
                governance_level, 
                jurisdiction_name
            ),
            primary_institution:government_institutions(
                id, 
                name, 
                acronym, 
                institution_type
            ),
            project_comments(count),
            project_verifications(count)
        `)
        .or(`${community.locationType}.eq.${community.locationValue}`)
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(signal);

    if (error) throw error;
    if (!projectsData) return [];

    return projectsData.map(project => ({
        ...project,
        comments_count: (project.project_comments as unknown as { count: number }[])?.[0]?.count || 0,
        verifications_count: (project.project_verifications as unknown as { count: number }[])?.[0]?.count || 0,
        views_count: project.views_count || 0
    })) as unknown as GovernmentProject[];
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
        queryKey: ['channelPosts', communityId, channel?.id || 'none', channel?.name, channel?.type],
        queryFn: ({ signal }) => fetchChannelPosts(communityId!, channel!.id, signal),
        enabled: Boolean(communityId) && Boolean(channel?.id) && isTextChannel,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Projects query for projects-watch channel
    const {
        data: projects,
        isLoading: projectsLoading,
    } = useQuery({
        queryKey: ['channelProjects', communityId, channel?.id || 'none', channel?.name],
        queryFn: ({ signal }) => fetchChannelProjects(community!, signal),
        enabled: Boolean(communityId) && Boolean(channel?.id) && Boolean(community) && isProjectsChannel,
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
