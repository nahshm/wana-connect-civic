import { useState, useEffect } from 'react';
import { Community, Post } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCommunityData = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch all communities
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('*');

        if (communitiesError) throw communitiesError;

        // Fetch user memberships if logged in
        let joinedCommunityIds = new Set<string>();
        if (user) {
          const { data: memberships, error: membershipsError } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', user.id);

          if (membershipsError) throw membershipsError;

          if (memberships) {
            memberships.forEach(m => joinedCommunityIds.add(m.community_id));
          }
        }

        // Map to Community type
        const mappedCommunities: Community[] = (communitiesData || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          displayName: c.display_name || c.name,
          description: c.description || '',
          memberCount: c.member_count || 0,
          category: c.category || 'discussion',
          isFollowing: joinedCommunityIds.has(c.id),
          avatarUrl: c.avatar_url,
          bannerUrl: c.banner_url,
          // Map other fields as needed, providing defaults
          type: c.type || 'interest',
          sensitivityLevel: c.sensitivity_level || 'public'
        }));

        setCommunities(mappedCommunities);

        // TODO: Fetch real posts
        // For now, we'll keep the mock posts or fetch empty
        setPosts([]);

      } catch (error) {
        console.error('Error loading community data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load communities',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, toast]);

  const toggleCommunityFollow = async (communityId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to join communities',
        variant: 'destructive',
      });
      return;
    }

    try {
      const community = communities.find(c => c.id === communityId);
      if (!community) return;

      const isFollowing = community.isFollowing;

      if (isFollowing) {
        // Leave community
        const { error } = await supabase
          .from('community_members')
          .delete()
          .eq('community_id', communityId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Join community
        const { error } = await supabase
          .from('community_members')
          .insert({
            community_id: communityId,
            user_id: user.id
          });

        if (error) throw error;
      }

      // Update local state
      setCommunities(prev =>
        prev.map(c =>
          c.id === communityId
            ? { ...c, isFollowing: !isFollowing, memberCount: c.memberCount + (isFollowing ? -1 : 1) }
            : c
        )
      );

      toast({
        title: isFollowing ? 'Left community' : 'Joined community',
        description: `You have ${isFollowing ? 'left' : 'joined'} ${community.displayName}`,
      });

    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update membership',
        variant: 'destructive',
      });
    }
  };

  // Keep mock implementation for voting and adding posts for now as we focus on communities
  const voteOnPost = (postId: string, vote: 'up' | 'down') => {
    // ... (keep existing mock logic or implement real voting later)
  };

  const addPost = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  return {
    communities,
    posts,
    loading,
    toggleCommunityFollow,
    voteOnPost,
    addPost
  };
};