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

  // Discord-style state
  const [activeLevel, setActiveLevel] = useState('county');
  const [activeChannelId, setActiveChannelId] = useState('general-chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define hierarchy levels and channels
  const levels = [
    { id: 'county', name: community?.locationValue || 'County', type: 'COUNTY' as const, avatarUrl: community?.avatarUrl },
    { id: 'constituency', name: 'Constituency', type: 'CONSTITUENCY' as const, avatarUrl: community?.avatarUrl },
    { id: 'ward', name: 'Ward', type: 'WARD' as const, avatarUrl: community?.avatarUrl },
  ];

  const channels = [
    { id: 'announcements', name: 'announcements', category: 'INFO' as const },
    { id: 'faqs', name: 'faqs', category: 'INFO' as const },
    { id: 'our-leaders', name: 'our-leaders', category: 'MONITORING' as const },
    { id: 'projects-watch', name: 'projects-watch', category: 'MONITORING' as const },
    { id: 'promises-watch', name: 'promises-watch', category: 'MONITORING' as const },
    { id: 'general-chat', name: 'general-chat', category: 'ENGAGEMENT' as const },
    { id: 'town-hall', name: 'town-hall', category: 'ENGAGEMENT' as const },
  ];

  const currentLevel = levels.find(l => l.id === activeLevel) || levels[0];

  useEffect(() => {
    if (communityName) {
      fetchCommunity();
    }
  }, [communityName]);

  useEffect(() => {
    if (community?.id) {
      fetchChannelData(activeChannelId);
    }
  }, [community?.id, activeChannelId, activeLevel]);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
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
          community_flairs (*)
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
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
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

      {/* Main Layout: Discord-style 3-column - Fixed height for independent scrolling */}
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
          flex h-full z-40 transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          absolute inset-y-0 left-0 shadow-2xl md:shadow-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Level Selector Rail */}
          <LevelSelector
            levels={levels}
            activeLevel={activeLevel}
            onChange={setActiveLevel}
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
          />
        </div>
      </div>
    </div>
  );
};

export default Community;
