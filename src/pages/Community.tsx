import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CommunityProfile, Post, CommunityModerator, CommunityRule, CommunityFlair, GovernmentProject } from '@/types/index';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Users, Calendar, Shield, Settings, Plus, Minus, Crown, UserCheck, Flag, MessageSquare, MapPin, TrendingUp } from 'lucide-react';
import { PostCard } from '@/components/posts/PostCard';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { CreatePostInput } from '@/components/community/CreatePostInput';
import LevelSelector from '@/components/community/discord/LevelSelector';
import ChannelList from '@/components/community/discord/ChannelList';
import ChannelContent from '@/components/community/discord/ChannelContent';
import { Menu, X } from 'lucide-react';
import { CreateChannelDialog } from '@/components/community/discord/CreateChannelDialog';

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

const Community = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [moderators, setModerators] = useState<CommunityModerator[]>([]);
  const [rules, setRules] = useState<CommunityRule[]>([]);
  const [flairs, setFlairs] = useState<CommunityFlair[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<GovernmentProject[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<any[]>([]);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);

  // Geographic communities for navigation
  const [geoCommunities, setGeoCommunities] = useState<{
    county?: CommunityProfile;
    constituency?: CommunityProfile;
    ward?: CommunityProfile;
  }>({});
  const [joinedCommunities, setJoinedCommunities] = useState<CommunityProfile[]>([]);

  // Discord-style state
  const [activeChannelId, setActiveChannelId] = useState('general-chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Build levels from fetched geographic communities
  const primaryLevels = [
    {
      id: 'county',
      name: geoCommunities.county?.displayName || 'County',
      type: 'COUNTY' as const,
      avatarUrl: geoCommunities.county?.avatarUrl,
      communitySlug: geoCommunities.county?.name,
      isActive: community?.id === geoCommunities.county?.id
    },
    {
      id: 'constituency',
      name: geoCommunities.constituency?.displayName || 'Constituency',
      type: 'CONSTITUENCY' as const,
      avatarUrl: geoCommunities.constituency?.avatarUrl,
      communitySlug: geoCommunities.constituency?.name,
      isActive: community?.id === geoCommunities.constituency?.id
    },
    {
      id: 'ward',
      name: geoCommunities.ward?.displayName || 'Ward',
      type: 'WARD' as const,
      avatarUrl: geoCommunities.ward?.avatarUrl,
      communitySlug: geoCommunities.ward?.name,
      isActive: community?.id === geoCommunities.ward?.id
    },
  ];

  const secondaryLevels = joinedCommunities.map(c => ({
    id: c.id,
    name: c.displayName,
    type: 'COMMUNITY' as const,
    avatarUrl: c.avatarUrl,
    communitySlug: c.name,
    isActive: community?.id === c.id
  }));

  const levels = [
    ...primaryLevels.filter(l => l.communitySlug),
    ...(secondaryLevels.length > 0 ? [{ type: 'SEPARATOR' as const, id: 'sep-1', name: '', isActive: false }] : []),
    ...secondaryLevels
  ];

  const currentLevel = [...primaryLevels, ...secondaryLevels].find(l => l.isActive) || { name: community?.displayName || 'Community', type: 'COMMUNITY' as const };

  useEffect(() => {
    if (communityName) {
      setLoading(true);
      fetchCommunityData();
    }
  }, [communityName, user?.id]);

  // Separate effect for getting the user's hierarchy once
  useEffect(() => {
    if (user) {
      fetchGeographicCommunities();
    }
  }, [user]);

  // Fetch channel data when active channel changes
  useEffect(() => {
    if (activeChannelId) {
      fetchChannelData(activeChannelId);
    }
  }, [activeChannelId, community?.id]);

  const fetchCommunityData = async () => {
    try {
      if (!communityName) return;

      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          community_moderators (
            id,
            user_id,
            role,
            profiles!community_moderators_user_id_fkey (username, display_name, avatar_url)
          ),
          community_rules (*),
          community_flairs (*),
          channels (*)
        `)
        .eq('name', communityName)
        .single();

      if (error) throw error;
      const communityData = toCamelCase(data);
      setCommunity(communityData);

      // Check membership and roles
      if (user) {
        const { data: membership } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', communityData.id)
          .eq('user_id', user.id)
          .single();

        setIsMember(!!membership);

        const { data: modData } = await supabase
          .from('community_moderators')
          .select('role')
          .eq('community_id', communityData.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsModerator(modData?.role === 'moderator');
        setIsAdmin(modData?.role === 'admin');
      }

      setModerators(communityData.communityModerators || []);
      setRules(communityData.communityRules || []);
      setFlairs(communityData.communityFlairs || []);

      if (communityData.channels && communityData.channels.length > 0) {
        const dbChannels = communityData.channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          category: ch.type === 'announcement' ? 'INFO' : 'ENGAGEMENT', // Map types to categories
          type: ch.type
        }));
        setChannels(dbChannels);
      } else {
        // Fallback to default channels
        setChannels([
          { id: 'announcements', name: 'announcements', category: 'INFO' },
          { id: 'faqs', name: 'faqs', category: 'INFO' },
          { id: 'projects-watch', name: 'projects-watch', category: 'MONITORING' },
          { id: 'promises-watch', name: 'promises-watch', category: 'MONITORING' },
          { id: 'our-leaders', name: 'our-leaders', category: 'MONITORING' },
          { id: 'general-chat', name: 'general-chat', category: 'ENGAGEMENT' },
          { id: 'town-hall', name: 'town-hall', category: 'ENGAGEMENT' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeographicCommunities = async () => {
    try {
      console.log('🔍 === fetchGeographicCommunities START ===');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ No user logged in');
        return;
      }
      console.log('👤 User ID:', user.id);

      // 1. Fetch User Profile to get location IDs
      const { data: profile } = await supabase
        .from('profiles')
        .select('county_id, constituency_id, ward_id')
        .eq('id', user.id)
        .single();

      console.log('📋 Profile data:', profile);

      const fetchedCommunities: {
        county?: CommunityProfile;
        constituency?: CommunityProfile;
        ward?: CommunityProfile;
      } = {};

      // 2. Resolve Location Names & Fetch Communities
      if (profile) {
        // Fetch County
        if (profile.county_id) {
          console.log('🏛️ Fetching county for ID:', profile.county_id);
          const { data: county } = await supabase.from('counties').select('name').eq('id', profile.county_id).single();
          console.log('   County name:', county?.name);

          if (county) {
            const { data: countyComm, error: countyError } = await supabase
              .from('communities')
              .select('*')
              .eq('type', 'location')
              .eq('location_type', 'county')
              .eq('location_value', county.name)
              .maybeSingle();
            console.log('   County community:', countyComm?.name, 'ID:', countyComm?.id, 'Error:', countyError);
            if (countyComm) fetchedCommunities.county = toCamelCase(countyComm);
          }
        }

        // Fetch Constituency
        if (profile.constituency_id) {
          console.log('🏢 Fetching constituency for ID:', profile.constituency_id);
          const { data: constituency } = await supabase.from('constituencies').select('name').eq('id', profile.constituency_id).single();
          console.log('   Constituency name:', constituency?.name);

          if (constituency) {
            const { data: constComm, error: constError } = await supabase
              .from('communities')
              .select('*')
              .eq('type', 'location')
              .eq('location_type', 'constituency')
              .eq('location_value', constituency.name)
              .maybeSingle();
            console.log('   Constituency community:', constComm?.name, 'ID:', constComm?.id, 'Error:', constError);
            if (constComm) fetchedCommunities.constituency = toCamelCase(constComm);
          }
        }

        // Fetch Ward
        if (profile.ward_id) {
          console.log('🏘️ Fetching ward for ID:', profile.ward_id);
          const { data: ward } = await supabase.from('wards').select('name').eq('id', profile.ward_id).single();
          console.log('   Ward name:', ward?.name);

          if (ward) {
            const { data: wardComm, error: wardError } = await supabase
              .from('communities')
              .select('*')
              .eq('type', 'location')
              .eq('location_type', 'ward')
              .eq('location_value', ward.name)
              .maybeSingle();
            console.log('   Ward community:', wardComm?.name, 'ID:', wardComm?.id, 'Error:', wardError);
            if (wardComm) fetchedCommunities.ward = toCamelCase(wardComm);
          }
        }
      }

      console.log('✅ Final fetchedCommunities:', {
        county: fetchedCommunities.county?.name,
        constituency: fetchedCommunities.constituency?.name,
        ward: fetchedCommunities.ward?.name
      });

      setGeoCommunities(fetchedCommunities);

      // 3. Fetch Joined Communities
      console.log('📥 Fetching joined communities...');
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community:communities(*)')
        .eq('user_id', user.id);

      console.log('   Raw memberships count:', memberships?.length);

      if (memberships) {
        const allJoined = memberships.map((m: any) => toCamelCase(m.community));
        console.log('   All joined communities (detailed):', allJoined.map(c => ({
          name: c.name,
          displayName: c.displayName,
          type: c.type,
          locationType: c.locationType,
          locationValue: c.locationValue,
          id: c.id
        })));

        const joined = allJoined.filter((c: CommunityProfile) => {
          // Exclude the geographic communities we just fetched
          const isExcluded = (
            c.id === fetchedCommunities.county?.id ||
            c.id === fetchedCommunities.constituency?.id ||
            c.id === fetchedCommunities.ward?.id
          );
          console.log(`   ${c.name} (${c.id}): ${isExcluded ? 'EXCLUDED' : 'INCLUDED'}`);
          return !isExcluded;
        });

        console.log('   Final secondary communities:', joined.map(c => c.name));
        setJoinedCommunities(joined);
      }

      console.log('🏁 === fetchGeographicCommunities END ===');
    } catch (error) {
      console.error('❌ Error fetching communities:', error);
    }
  };

  const fetchChannelData = async (channelId: string) => {
    if (!community?.id) return;

    try {
      // For text channels (general-chat, announcements, etc.), fetch posts
      if (['general-chat', 'announcements', 'faqs', 'town-hall'].includes(channelId)) {
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles(*),
            community:communities(*),
            post_media(*)
          `)
          .eq('community_id', community.id)
          .order('created_at', { ascending: false })
          .limit(20);
        const camelCasePosts = toCamelCase(postsData) || [];
        const mappedPosts = camelCasePosts.map((p: any) => ({
          ...p,
          media: p.postMedia
        }));
        setPosts(mappedPosts);
      }

      // For projects-watch, fetch projects
      if (channelId === 'projects-watch') {
        if (community.locationType && community.locationValue) {
          const { data: projectsData } = await supabase
            .from('government_projects')
            .select(`
              *,
              official:officials(id, name, position)
            `)
            .or(`${community.locationType}.eq.${community.locationValue}`)
            .order('created_at', { ascending: false })
            .limit(20);
          setProjects(toCamelCase(projectsData) || []);
        }
      }

      // For members sidebar, fetch members
      const { data: membersData } = await supabase
        .from('community_members')
        .select(`
          *,
          profiles (username, display_name, avatar_url, role)
        `)
        .eq('community_id', community.id);
      setMembers(toCamelCase(membersData) || []);
    } catch (error) {
      console.error('Error fetching channel data:', error);
    }
  };

  const handleJoinLeave = async () => {
    if (!user || !community) return;

    try {
      if (isMember) {
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', user.id);
        setIsMember(false);
      } else {
        await supabase
          .from('community_members')
          .insert({
            community_id: community.id,
            user_id: user.id
          });
        setIsMember(true);
      }
    } catch (error) {
      console.error('Error updating membership:', error);
    }
  };

  const handleChannelCreated = (newChannel: any) => {
    // Optimistically update or re-fetch
    setChannels(prev => [...prev, {
      id: newChannel.id,
      name: newChannel.name,
      category: newChannel.type === 'announcement' ? 'INFO' : 'ENGAGEMENT',
      type: newChannel.type
    }]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Community not found</h1>
          <p className="text-gray-600">The community you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background relative">

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="absolute inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Left Navigation (Level Rail + Channel List) */}
        <div className={`
          flex h-full z-40 transition-transform duration-300 ease-in-out bg-background
          md:relative md:translate-x-0
          absolute inset-y-0 left-0 shadow-2xl md:shadow-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Level Selector Rail */}
          <LevelSelector
            levels={levels}
          />

          {/* Channel List */}
          <ChannelList
            channels={channels}
            activeChannel={activeChannelId}
            onChange={(channelId) => {
              setActiveChannelId(channelId);
              setMobileMenuOpen(false);
            }}
            levelName={currentLevel.name}
            isAdmin={isAdmin}
            onAddChannel={() => setCreateChannelOpen(true)}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-background thin-scrollbar">
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h2 className="font-bold text-foreground">#{channels.find(c => c.id === activeChannelId)?.name}</h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Channel Content */}
          <ChannelContent
            channelId={activeChannelId}
            levelType={currentLevel.type}
            locationValue={currentLevel.name}
            posts={posts}
            projects={projects}
            postsLoading={false}
            projectsLoading={false}
          />
        </div>

        {/* Right Sidebar - Original CommunitySidebar */}
        <div className="hidden lg:block w-80 border-l border-sidebar-border bg-sidebar-background overflow-y-auto thin-scrollbar">
          <CommunitySidebar
            community={community}
            rules={rules}
            moderators={moderators}
            flairs={flairs}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Create Channel Dialog */}
      {community && (
        <CreateChannelDialog
          isOpen={createChannelOpen}
          onClose={() => setCreateChannelOpen(false)}
          communityId={community.id}
          onChannelCreated={handleChannelCreated}
        />
      )}
    </div>
  );
};

export default Community;
