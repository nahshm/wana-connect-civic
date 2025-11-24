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
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (communityName) {
      fetchCommunity();
    }
  }, [communityName]);

  useEffect(() => {
    if (community?.id && activeTab !== 'about') {
      fetchTabData(activeTab);
    }
  }, [community?.id, activeTab]);

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
          .single();

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

  const fetchTabData = async (tab: string) => {
    if (!community?.id) return;

    try {
      switch (tab) {
        case 'posts':
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
          // Map postMedia to media to match Post interface
          const mappedPosts = camelCasePosts.map((p: any) => ({
            ...p,
            media: p.postMedia
          }));
          setPosts(mappedPosts);
          break;

        case 'members':
          const { data: membersData } = await supabase
            .from('community_members')
            .select(`
              *,
              profiles (username, display_name, avatar_url, role)
            `)
            .eq('community_id', community.id);
          setMembers(toCamelCase(membersData) || []);
          break;

        case 'projects':
          // Fetch projects matching community location
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
          break;
      }
    } catch (error) {
      console.error('Error fetching tab data:', error);
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Community Header (contains TabsList) */}
        <CommunityHeader
          community={community}
          isMember={isMember}
          onJoinLeave={handleJoinLeave}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isModerator={isModerator || isAdmin}
        />

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content (Feed) */}
            <div className="lg:col-span-2 space-y-4">
              {activeTab === 'posts' && <CreatePostInput />}

              <TabsContent value="posts" className="mt-0 space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} onVote={() => { }} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-600">No posts yet. Be the first to post!</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>About Community</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {community.descriptionHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(community.descriptionHtml) }} />
                      ) : (
                        <p className="text-gray-700">{community.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Local Projects ({projects.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {projects.length > 0 ? (
                      <div className="space-y-4">
                        {projects.map((project) => (
                          <div key={project.id} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold line-clamp-1">{project.title}</h4>
                              {project.is_verified === false && (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 text-xs">
                                  Community Report
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                              {project.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{project.location}</span>
                                </div>
                              )}
                              {project.status && (
                                <Badge variant="secondary" className="text-xs">{project.status}</Badge>
                              )}
                            </div>
                            {project.progress_percentage !== undefined && (
                              <div className="flex items-center gap-2 text-xs">
                                <span>Progress:</span>
                                <div className="flex-1 bg-muted rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: `${project.progress_percentage}%` }} />
                                </div>
                                <span>{project.progress_percentage}%</span>
                              </div>
                            )}
                            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => window.location.href = `/projects/${project.id}`}>
                              View Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No projects found in this location yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Members ({members.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.profiles?.avatarUrl || undefined} />
                              <AvatarFallback>
                                {member.profiles?.displayName?.charAt(0) || member.profiles?.username?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.profiles?.displayName || member.profiles?.username}</p>
                              <p className="text-sm text-gray-600">@{member.profiles?.username}</p>
                            </div>
                          </div>
                          {member.profiles?.role && (
                            <Badge variant="outline">{member.profiles.role}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {(isModerator || isAdmin) && (
                <TabsContent value="moderation" className="mt-0">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Moderation Tools</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button variant="outline" className="justify-start">
                            <Flag className="w-4 h-4 mr-2" />
                            Reported Posts
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <UserCheck className="w-4 h-4 mr-2" />
                            User Management
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Post Approval Queue
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Settings className="w-4 h-4 mr-2" />
                            Community Settings
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <CommunitySidebar
                community={community}
                rules={rules}
                moderators={moderators}
                flairs={flairs}
              />
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default Community;
