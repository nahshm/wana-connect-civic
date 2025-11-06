import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CommunityProfile, Post, CommunityModerator, CommunityRule, CommunityFlair } from '@/types/index';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Users, Calendar, Shield, Settings, Plus, Minus, Crown, UserCheck, Flag, MessageSquare } from 'lucide-react';
import { PostCard } from '@/components/posts/PostCard';

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
          setPosts(toCamelCase(postsData) || []);
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
    <div className="container mx-auto px-4 py-8">
      {/* Community Header */}
      <Card className="mb-6">
        {community.bannerUrl && (
          <div className="h-32 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url(${community.bannerUrl})` }} />
        )}
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={(community as any).avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {community.name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{community.name}</h1>
                <p className="text-gray-600">c/{community.name}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{community.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Created {new Date((community as any).created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={community.sensitivityLevel === 'public' ? 'default' : 'secondary'}>
                {community.sensitivityLevel}
              </Badge>
              {user && (
                <Button
                  variant={isMember ? "outline" : "default"}
                  onClick={handleJoinLeave}
                >
                  {isMember ? (
                    <>
                      <Minus className="w-4 h-4 mr-2" />
                      Leave
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Join
                    </>
                  )}
                </Button>
              )}
              {(isModerator || isAdmin) && (
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {community.description && (
            <p className="text-gray-700 mb-4">{community.description}</p>
          )}
          {community.isNsfw && (
            <Badge variant="destructive" className="mb-4">NSFW</Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              {(isModerator || isAdmin) && <TabsTrigger value="moderation">Moderation</TabsTrigger>}
            </TabsList>

            <TabsContent value="posts" className="mt-6">
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} onVote={() => {}} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-600">No posts yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-6">
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

                    {rules.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Community Rules</h3>
                        <div className="space-y-2">
                          {rules.map((rule, index) => (
                            <div key={rule.id} className="flex items-start space-x-2">
                              <span className="font-medium text-gray-500">{index + 1}.</span>
                              <div>
                                <h4 className="font-medium">{rule.title}</h4>
                                <p className="text-sm text-gray-600">{rule.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
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
              <TabsContent value="moderation" className="mt-6">
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

                  <Card>
                    <CardHeader>
                      <CardTitle>Moderators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                         {moderators.map((mod: any) => (
                           <div key={mod.id} className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                               <Avatar className="w-8 h-8">
                                 <AvatarImage src={mod.profiles?.avatar_url || undefined} />
                                 <AvatarFallback>
                                   {mod.profiles?.display_name?.charAt(0) || mod.profiles?.username?.charAt(0)}
                                 </AvatarFallback>
                               </Avatar>
                               <div>
                                 <p className="font-medium">{mod.profiles?.display_name || mod.profiles?.username}</p>
                                 <p className="text-sm text-gray-600">@{mod.profiles?.username}</p>
                               </div>
                             </div>
                            <Badge variant={mod.role === 'admin' ? 'default' : 'secondary'}>
                              {mod.role === 'admin' ? <Crown className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                              {mod.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Community Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Moderators</h4>
                <div className="space-y-2">
                   {moderators.slice(0, 5).map((mod: any) => (
                     <div key={mod.id} className="flex items-center space-x-2">
                       <Avatar className="w-6 h-6">
                         <AvatarImage src={mod.profiles?.avatar_url || undefined} />
                         <AvatarFallback className="text-xs">
                           {mod.profiles?.display_name?.charAt(0) || mod.profiles?.username?.charAt(0)}
                         </AvatarFallback>
                       </Avatar>
                       <span className="text-sm">{mod.profiles?.display_name || mod.profiles?.username}</span>
                     </div>
                   ))}
                </div>
              </div>

              {rules.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Rules ({rules.length})</h4>
                  <div className="space-y-1">
                    {rules.slice(0, 3).map((rule, index) => (
                      <div key={rule.id} className="text-sm">
                        <span className="font-medium">{index + 1}.</span> {rule.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {flairs.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Flairs</h4>
                  <div className="flex flex-wrap gap-1">
                    {flairs.slice(0, 5).map((flair) => (
                      <Badge key={flair.id} variant="outline" className="text-xs">
                        {flair.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Community;
