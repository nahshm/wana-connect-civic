import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast as toastSonner } from 'sonner';
import { UserProfile, Post, Comment } from '@/types/index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, MessageSquare, Heart, Bookmark, Settings, Edit, Share2, UserCog, Eye, UserPlus, UserMinus, Star, Shield, ExternalLink } from 'lucide-react';
import { VerifiedBadge, OfficialPositionBadge } from '@/components/ui/verified-badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PostCard } from '@/components/posts/PostCard';
import { CommentSection } from '@/components/posts/CommentSection';
import { ProfileDataDebug } from '@/components/debug/ProfileDataDebug';
import { BadgeShowcase } from '@/components/gamification/BadgeShowcase';
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload';

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

const ProfileEditForm = ({ profile, onSave, onCancel }: { profile: UserProfile; onSave: (p: UserProfile) => void; onCancel: () => void }) => {
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    location: profile.location || '',
    expertise: profile.expertise?.join(', ') || '',
    avatar: profile.avatar || '',
    bannerUrl: profile.bannerUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      displayName: formData.displayName,
      bio: formData.bio,
      location: formData.location,
      expertise: formData.expertise.split(',').map(s => s.trim()).filter(s => s),
      avatar: formData.avatar,
      bannerUrl: formData.bannerUrl,
    };
    onSave(updated);
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <ProfileImageUpload
              userId={profile.id}
              imageUrl={formData.bannerUrl}
              imageType="banner"
              onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
            />
            <ProfileImageUpload
              userId={profile.id}
              imageUrl={formData.avatar}
              imageType="avatar"
              onChange={(url) => setFormData({ ...formData, avatar: url })}
            />
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="expertise">Expertise (comma separated)</Label>
              <Input id="expertise" value={formData.expertise} onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
              <Button type="submit" className="w-full sm:w-auto">Save</Button>
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [savedItems, setSavedItems] = useState<(Post | Comment)[]>([]);
  const [historyItems, setHistoryItems] = useState<(Post | Comment)[]>([]);
  const [hiddenItems, setHiddenItems] = useState<(Post | Comment)[]>([]);
  const [upvotedItems, setUpvotedItems] = useState<(Post | Comment)[]>([]);
  const [downvotedItems, setDownvotedItems] = useState<(Post | Comment)[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingHidden, setLoadingHidden] = useState(false);
  const [loadingUpvoted, setLoadingUpvoted] = useState(false);
  const [loadingDownvoted, setLoadingDownvoted] = useState(false);

  const isOwnProfile = user?.id === profile?.id;

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) {
      authModal.open('login');
      return;
    }

    // Check Supabase authentication session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      authModal.open('login');
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote
          await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            post_id: postId,
            vote_type: voteType,
          });
      }

      // Refresh posts data to show updated vote counts
      if (activeTab === 'posts') {
        fetchTabData('posts');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (updatedProfile: UserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updatedProfile.displayName,
          bio: updatedProfile.bio,
          location: updatedProfile.location,
          expertise: updatedProfile.expertise,
          avatar_url: updatedProfile.avatar,
          banner_url: updatedProfile.bannerUrl,
        })
        .eq('id', profile?.id);

      if (error) throw error;
      setProfile(updatedProfile);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  useEffect(() => {
    if (profile?.id && activeTab !== 'overview') {
      fetchTabData(activeTab);
    }
  }, [profile?.id, activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Determine if username param is UUID or username string
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const queryField = uuidRegex.test(username || '') ? 'id' : 'username';

      // First, fetch basic profile to determine ownership
      const { data: basicData, error: basicError } = await supabase
        .from('profiles')
        .select('id')
        .eq(queryField, username)
        .single();

      if (basicError) throw basicError;

      // Check if this is the current user's profile
      const isOwner = user?.id === basicData.id;

      // Select fields based on ownership - sensitive fields only for owner
      // Public fields: basic identity, karma, badges, location regions
      // Private fields: social_links, website, expertise, location (precise), privacy_settings
      const selectFields = isOwner 
        ? '*, user_privacy_settings (*)'
        : `id, username, display_name, avatar_url, banner_url, bio, role, is_verified, 
           karma, post_karma, comment_karma, badges, created_at, updated_at,
           official_position, official_position_id, county, constituency, ward,
           followers_count, following_count, user_privacy_settings (*)`;

      const { data, error } = await supabase
        .from('profiles')
        .select(selectFields)
        .eq(queryField, username)
        .single();

      if (error) throw error;

      // Convert to camelCase and map avatar_url to avatar for consistency
      const profileData = toCamelCase(data);
      if (profileData.avatarUrl && !profileData.avatar) {
        profileData.avatar = profileData.avatarUrl;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab: string) => {
    if (!profile?.id) return;

    try {
      switch (tab) {
        case 'posts':
          setLoadingPosts(true);
          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select(`
              *,
              author:profiles(*),
              communities!posts_community_id_fkey(*),
              post_media!post_media_post_id_fkey(*)
            `)
            .eq('author_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(20);
          console.log('Posts data:', postsData);
          console.log('Posts error:', postsError);
          const camelPosts = toCamelCase(postsData) || [];
          console.log('Posts after camelCase:', camelPosts);
          setPosts(camelPosts);
          setLoadingPosts(false);
          break;

        case 'comments':
          setLoadingComments(true);
          const { data: commentsData } = await supabase
            .from('comments')
            .select(`
              *,
              author:profiles(*),
              post:posts(id, title, community:communities(name))
            `)
            .eq('author_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(20);
          setComments(toCamelCase(commentsData) || []);
          setLoadingComments(false);
          break;

        case 'saved':
          setLoadingSaved(true);
          // Fetch saved posts and comments
          try {
            // Fetch saved post items
            const { data: savedPostItems } = await supabase
              .from('saved_items')
              .select('id, item_id, created_at')
              .eq('user_id', profile.id)
              .eq('item_type', 'post')
              .order('created_at', { ascending: false })
              .limit(10);

            // Fetch saved comment items
            const { data: savedCommentItems } = await supabase
              .from('saved_items')
              .select('id, item_id, created_at')
              .eq('user_id', profile.id)
              .eq('item_type', 'comment')
              .order('created_at', { ascending: false })
              .limit(10);

            const items = [];

            // Fetch posts
            if (savedPostItems && savedPostItems.length > 0) {
              const postIds = savedPostItems.map(item => item.item_id);
              const { data: posts } = await supabase
                .from('posts')
                .select(`
                  *,
                  author:profiles(*),
                  communities!posts_community_id_fkey(*),
                  post_media!post_media_post_id_fkey(*)
                `)
                .in('id', postIds);

              if (posts) {
                items.push(...posts.map(post => toCamelCase(post)));
              }
            }

            // Fetch comments
            if (savedCommentItems && savedCommentItems.length > 0) {
              const commentIds = savedCommentItems.map(item => item.item_id);
              const { data: comments } = await supabase
                .from('comments')
                .select(`
                  *,
                  author:profiles(*),
                  post:posts(id, title, community:communities(name))
                `)
                .in('id', commentIds);

              if (comments) {
                items.push(...comments.map(comment => toCamelCase(comment)));
              }
            }

            // Sort by created_at (saved time)
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setSavedItems(items.slice(0, 20));
            setLoadingSaved(false);
          } catch (error) {
            console.error('Error fetching saved items:', error);
            setSavedItems([]);
            setLoadingSaved(false);
          }
          break;

        case 'history':
          setLoadingHistory(true);
          // Fetch user activity history
          try {
            // Fetch activity log entries
            const { data: activities } = await supabase
              .from('user_activity_log')
              .select('id, entity_type, entity_id, created_at')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(20);

            if (!activities || activities.length === 0) {
              setHistoryItems([]);
              setLoadingHistory(false);
              break;
            }

            const items = [];

            // Separate post and comment activities
            const postActivities = activities.filter(a => a.entity_type === 'post');
            const commentActivities = activities.filter(a => a.entity_type === 'comment');

            // Fetch posts
            if (postActivities.length > 0) {
              const postIds = postActivities.map(a => a.entity_id);
              const { data: posts } = await supabase
                .from('posts')
                .select(`
                  *,
                  author:profiles(*),
                  communities!posts_community_id_fkey(*),
                  post_media!post_media_post_id_fkey(*)
                `)
                .in('id', postIds);

              if (posts) {
                items.push(...posts.map(post => toCamelCase(post)));
              }
            }

            // Fetch comments
            if (commentActivities.length > 0) {
              const commentIds = commentActivities.map(a => a.entity_id);
              const { data: comments } = await supabase
                .from('comments')
                .select(`
                  *,
                  author:profiles(*),
                  post:posts(id, title, community:communities(name))
                `)
                .in('id', commentIds);

              if (comments) {
                items.push(...comments.map(comment => toCamelCase(comment)));
              }
            }

            // Sort by activity created_at
            items.sort((a, b) => {
              const aActivity = activities.find(act => act.entity_id === a.id);
              const bActivity = activities.find(act => act.entity_id === b.id);
              return new Date(bActivity?.created_at || 0).getTime() - new Date(aActivity?.created_at || 0).getTime();
            });

            setHistoryItems(items.slice(0, 20));
            setLoadingHistory(false);
          } catch (error) {
            console.error('Error fetching history items:', error);
            setHistoryItems([]);
            setLoadingHistory(false);
          }
          break;

        case 'hidden':
          setLoadingHidden(true);
          // Fetch hidden posts and comments
          try {
            const { data: hiddenPosts } = await supabase
              .from('hidden_items')
              .select(`
                id,
                item_type,
                created_at,
                post:posts(
                  *,
                  author:profiles(*),
                  communities!posts_community_id_fkey(*),
                  post_media!post_media_post_id_fkey(*)
                ),
                comment:comments(
                  *,
                  author:profiles(*),
                  post:posts(id, title, community:communities(name))
                )
              `)
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(20);

            const items = (hiddenPosts || []).map(item => {
              if (item.item_type === 'post' && item.post) {
                return toCamelCase(item.post);
              } else if (item.item_type === 'comment' && item.comment) {
                return toCamelCase(item.comment);
              }
              return null;
            }).filter(Boolean);

            setHiddenItems(items);
            setLoadingHidden(false);
          } catch (error) {
            console.error('Error fetching hidden items:', error);
            setHiddenItems([]);
            setLoadingHidden(false);
          }
          break;

        case 'upvoted':
          setLoadingUpvoted(true);
          // Fetch posts and comments that the user has upvoted
          try {
            // Fetch user's upvote records
            const { data: userUpvotes } = await supabase
              .from('votes')
              .select('post_id, comment_id')
              .eq('user_id', profile.id)
              .eq('vote_type', 'up')
              .order('created_at', { ascending: false })
              .limit(20);

            const items = [];

            if (userUpvotes && userUpvotes.length > 0) {
              // Separate post and comment upvotes
              const postUpvotes = userUpvotes.filter(v => v.post_id && !v.comment_id);
              const commentUpvotes = userUpvotes.filter(v => v.comment_id);

              // Fetch posts that user upvoted
              if (postUpvotes.length > 0) {
                const postIds = postUpvotes.map(v => v.post_id);
                const { data: posts } = await supabase
                  .from('posts')
                  .select(`
                    *,
                    author:profiles(*),
                    communities!posts_community_id_fkey(*),
                    post_media!post_media_post_id_fkey(*)
                  `)
                  .in('id', postIds);

                if (posts) {
                  items.push(...posts.map(post => toCamelCase(post)));
                }
              }

              // Fetch comments that user upvoted
              if (commentUpvotes.length > 0) {
                const commentIds = commentUpvotes.map(v => v.comment_id);
                const { data: comments } = await supabase
                  .from('comments')
                  .select(`
                    *,
                    author:profiles(*),
                    post:posts(id, title, community:communities(name))
                  `)
                  .in('id', commentIds);

                if (comments) {
                  items.push(...comments.map(comment => toCamelCase(comment)));
                }
              }
            }

            setUpvotedItems(items);
            setLoadingUpvoted(false);
          } catch (error) {
            console.error('Error fetching upvoted items:', error);
            setUpvotedItems([]);
            setLoadingUpvoted(false);
          }
          break;

        case 'downvoted':
          setLoadingDownvoted(true);
          // Fetch user's posts and comments that have received downvotes
          try {
            // Fetch user's posts with downvotes > 0
            const { data: downvotedPosts } = await supabase
              .from('posts')
              .select(`
                *,
                author:profiles(*),
                communities!posts_community_id_fkey(*),
                post_media!post_media_post_id_fkey(*)
              `)
              .eq('author_id', profile.id)
              .gt('downvotes', 0)
              .order('downvotes', { ascending: false })
              .limit(20);

            // Fetch user's comments with downvotes > 0
            const { data: downvotedComments } = await supabase
              .from('comments')
              .select(`
                *,
                author:profiles(*),
                post:posts(id, title, community:communities(name))
              `)
              .eq('author_id', profile.id)
              .gt('downvotes', 0)
              .order('downvotes', { ascending: false })
              .limit(20);

            const items = [];

            // Add posts
            if (downvotedPosts) {
              items.push(...downvotedPosts.map(post => toCamelCase(post)));
            }

            // Add comments
            if (downvotedComments) {
              items.push(...downvotedComments.map(comment => toCamelCase(comment)));
            }

            // Sort by downvotes (highest first)
            items.sort((a, b) => {
              const aVotes = 'downvotes' in a ? a.downvotes : 0;
              const bVotes = 'downvotes' in b ? b.downvotes : 0;
              return bVotes - aVotes;
            });

            setDownvotedItems(items.slice(0, 20));
            setLoadingDownvoted(false);
          } catch (error) {
            console.error('Error fetching downvoted items:', error);
            setDownvotedItems([]);
            setLoadingDownvoted(false);
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching tab data:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return <ProfileEditForm profile={profile} onSave={handleSave} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-screen-xl">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Profile Banner & Header */}
        <div className="w-full bg-card border border-border rounded-lg overflow-hidden mb-4 sm:mb-6">
          {/* Banner */}
          <div className="h-16 sm:h-20 md:h-24 lg:h-28 w-full bg-muted relative">
            {profile.bannerUrl ? (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${profile.bannerUrl})` }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-400" />
            )}
          </div>

          {/* Header Content */}
          <div className="px-4 sm:px-6">
            <div className="relative flex flex-col sm:flex-row items-start sm:items-end pb-4 -mt-8 sm:-mt-12 mb-2">
              {/* Avatar */}
              <div className="relative mr-0 sm:mr-4 mb-4 sm:mb-0">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 border-4 border-card rounded-full">
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback className="text-2xl sm:text-3xl lg:text-4xl bg-primary text-primary-foreground">
                    {(profile.displayName || profile.username || '?')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Title and Actions */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">{profile.displayName || profile.username}</h1>
                    {profile.isVerified && (
                      <VerifiedBadge size="lg" positionTitle={profile.officialPosition} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground text-sm sm:text-base truncate">@{profile.username}</p>
                    {profile.officialPosition && (
                      <OfficialPositionBadge position={profile.officialPosition} />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{profile.activityStats?.postsCreated || 0} posts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{profile.activityStats?.commentsCreated || 0} comments</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">
                        Joined {profile.activityStats?.joinDate ?
                          new Date(profile.activityStats.joinDate).toLocaleDateString() :
                          'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:flex-shrink-0">
                  {isOwnProfile && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="w-full sm:w-auto rounded-full">
                      <Edit className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio and Additional Info */}
          <CardContent className="pt-0 px-4 sm:px-6 pb-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {profile.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.expertise && profile.expertise.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span>Expertise:</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.expertise.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {profile.badges && profile.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.badges.map((badge, index) => (
                  <Badge key={index} variant="default">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </div>
        {/* Removed debug component as it has served its purpose */}

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-9 h-auto p-1 gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="hidden">Hidden</TabsTrigger>
            <TabsTrigger value="upvoted">Upvoted</TabsTrigger>
            <TabsTrigger value="downvoted">Downvoted</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Posts</span>
                      <span className="font-semibold">{profile.activityStats?.postsCreated || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Comments</span>
                      <span className="font-semibold">{profile.activityStats?.commentsCreated || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Upvotes Given</span>
                      <span className="font-semibold">{profile.activityStats?.upvotesGiven || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Karma</span>
                      <span className="font-semibold">{profile.karma || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Last active: {profile.lastActivity ?
                      new Date(profile.lastActivity).toLocaleDateString() :
                      'Unknown'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="mt-6">
            <BadgeShowcase userId={profile.id} />
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <div className="space-y-4">
              {loadingPosts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} onVote={handleVote} />
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

          <TabsContent value="comments" className="mt-6">
            <div className="space-y-4">
              {loadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.author.avatar || undefined} />
                          <AvatarFallback>
                            {(comment.author.displayName || comment.author.username || '?')[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <span className="font-medium">{comment.author.displayName || comment.author.username}</span>
                            <span>•</span>
                            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>in {comment.post?.community?.name || 'Unknown'}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{comment.content}</p>
                          <div className="text-sm text-gray-600">
                            on: {comment.post?.title || 'Unknown post'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600">No comments yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <div className="space-y-4">
              {loadingSaved ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading saved items...</p>
                </div>
              ) : savedItems.length > 0 ? (
                savedItems.map((item) => {
                  if ('title' in item) {
                    // It's a post
                    return <PostCard key={item.id} post={item as Post} onVote={() => { }} />;
                  } else {
                    // It's a comment
                    return (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={(item as Comment).author.avatar || undefined} />
                              <AvatarFallback>
                                {((item as Comment).author.displayName || (item as Comment).author.username || '?')[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <span className="font-medium">{(item as Comment).author.displayName || (item as Comment).author.username}</span>
                                <span>•</span>
                                <span>{new Date((item as Comment).createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>in {(item as Comment).post?.community?.name || 'Unknown'}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{(item as Comment).content}</p>
                              <div className="text-sm text-gray-600">
                                on: {(item as Comment).post?.title || 'Unknown post'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No saved items yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading history...</p>
                </div>
              ) : historyItems.length > 0 ? (
                historyItems.map((item) => {
                  if ('title' in item) {
                    // It's a post
                    return <PostCard key={item.id} post={item as Post} onVote={() => { }} />;
                  } else {
                    // It's a comment
                    return (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={(item as Comment).author.avatar || undefined} />
                              <AvatarFallback>
                                {((item as Comment).author.displayName || (item as Comment).author.username || '?')[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <span className="font-medium">{(item as Comment).author.displayName || (item as Comment).author.username}</span>
                                <span>•</span>
                                <span>{new Date((item as Comment).createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>in {(item as Comment).post?.community?.name || 'Unknown'}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{(item as Comment).content}</p>
                              <div className="text-sm text-gray-600">
                                on: {(item as Comment).post?.title || 'Unknown post'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Star className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No activity history yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hidden" className="mt-6">
            <div className="space-y-4">
              {hiddenItems.length > 0 ? (
                hiddenItems.map((item) => {
                  if ('title' in item) {
                    // It's a post
                    return <PostCard key={item.id} post={item as Post} onVote={() => { }} />;
                  } else {
                    // It's a comment
                    return (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={(item as Comment).author.avatar || undefined} />
                              <AvatarFallback>
                                {((item as Comment).author.displayName || (item as Comment).author.username || '?')[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <span className="font-medium">{(item as Comment).author.displayName || (item as Comment).author.username}</span>
                                <span>•</span>
                                <span>{new Date((item as Comment).createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>in {(item as Comment).post?.community?.name || 'Unknown'}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{(item as Comment).content}</p>
                              <div className="text-sm text-gray-600">
                                on: {(item as Comment).post?.title || 'Unknown post'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No hidden items yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upvoted" className="mt-6">
            <div className="space-y-4">
              {upvotedItems.length > 0 ? (
                upvotedItems.map((item) => {
                  if ('title' in item) {
                    // It's a post
                    return <PostCard key={item.id} post={item as Post} onVote={() => { }} />;
                  } else {
                    // It's a comment
                    return (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={(item as Comment).author.avatar || undefined} />
                              <AvatarFallback>
                                {((item as Comment).author.displayName || (item as Comment).author.username || '?')[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <span className="font-medium">{(item as Comment).author.displayName || (item as Comment).author.username}</span>
                                <span>•</span>
                                <span>{new Date((item as Comment).createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>in {(item as Comment).post?.community?.name || 'Unknown'}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{(item as Comment).content}</p>
                              <div className="text-sm text-gray-600">
                                on: {(item as Comment).post?.title || 'Unknown post'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No upvoted items yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="downvoted" className="mt-6">
            <div className="space-y-4">
              {downvotedItems.length > 0 ? (
                downvotedItems.map((item) => {
                  if ('title' in item) {
                    // It's a post
                    return <PostCard key={item.id} post={item as Post} onVote={() => { }} />;
                  } else {
                    // It's a comment
                    return (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={(item as Comment).author.avatar || undefined} />
                              <AvatarFallback>
                                {((item as Comment).author.displayName || (item as Comment).author.username || '?')[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <span className="font-medium">{(item as Comment).author.displayName || (item as Comment).author.username}</span>
                                <span>•</span>
                                <span>{new Date((item as Comment).createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>in {(item as Comment).post?.community?.name || 'Unknown'}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{(item as Comment).content}</p>
                              <div className="text-sm text-gray-600">
                                on: {(item as Comment).post?.title || 'Unknown post'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No downvoted items yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 sticky top-24 space-y-6">
        <Card>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24 relative">
                <AvatarImage src={profile.avatar || undefined} />
                <AvatarFallback className="text-4xl">
                  {(profile.displayName || profile.username || '?')[0]?.toUpperCase()}
                </AvatarFallback>
                {isOwnProfile && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full p-1"
                    aria-label="Update Avatar"
                    onClick={() => alert('Avatar update functionality to be implemented')}
                  >
                    <UserPlus className="w-5 h-5" />
                  </Button>
                )}
              </Avatar>
              <h2 className="text-xl font-semibold">{profile.displayName || profile.username}</h2>
              <Button variant="outline" size="sm" className="w-full" onClick={() => alert('Share profile functionality to be implemented')}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">{profile.followersCount || 0} followers</span>
              </div>
              {profile.bio && (
                <div className="text-sm text-gray-700">
                  <p>{profile.bio.length > 200 ? `${profile.bio.substring(0, 200)}...` : profile.bio}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <div>Post Karma</div>
                  <div className="font-semibold">{profile.postKarma !== undefined ? profile.postKarma : 0}</div>
                </div>
                <div>
                  <div>Comment Karma</div>
                  <div className="font-semibold">{profile.commentKarma !== undefined ? profile.commentKarma : 0}</div>
                </div>
                <div>
                  <div>Total Karma</div>
                  <div className="font-semibold">{(profile.postKarma !== undefined && profile.commentKarma !== undefined) ? (profile.postKarma + profile.commentKarma) : profile.karma || 0}</div>
                </div>
                <div>
                  <div>Contributions</div>
                  <div className="font-semibold">{profile.contributionsCount || 0}</div>
                </div>
                <div>
                  <div>Account Age</div>
                  <div className="font-semibold">
                    {profile.createdAt ? (() => {
                      const now = new Date();
                      const created = new Date(profile.createdAt);
                      const diffMs = now.getTime() - created.getTime();
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      if (diffDays < 7) {
                        return diffDays + (diffDays === 1 ? ' day' : ' days');
                      }
                      const diffWeeks = Math.floor(diffDays / 7);
                      if (diffWeeks < 4) {
                        return diffWeeks + (diffWeeks === 1 ? ' week' : ' weeks');
                      }
                      const diffMonths = Math.floor(diffDays / 30);
                      if (diffMonths < 12) {
                        return diffMonths + (diffMonths === 1 ? ' month' : ' months');
                      }
                      const diffYears = Math.floor(diffDays / 365);
                      return diffYears + (diffYears === 1 ? ' year' : ' years');
                    })() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div>Active in</div>
                  <div className="font-semibold">{profile.activeIn || 'N/A'}</div>
                </div>
                <div>
                  <div>Gold earned</div>
                  <div className="font-semibold">{profile.goldEarned || 0}</div>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-semibold mb-2">ACHIEVEMENTS</h3>
              <div className="flex items-center space-x-2">
                {/* Example achievement icons */}
                <img src="/achievements/hometown-hero.png" alt="Hometown Hero" className="w-8 h-8" />
                <img src="/achievements/banana-baby.png" alt="Banana Baby" className="w-8 h-8" />
                <img src="/achievements/banana-beginner.png" alt="Banana Beginner" className="w-8 h-8" />
                <span className="text-sm">+4 more</span>
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => alert('View all achievements functionality to be implemented')}>
                View All
              </Button>
            </div>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-semibold mb-2">SETTINGS</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <UserCog className="w-5 h-5" />
                    <span>Profile</span>
                  </div>
                  <Button size="sm" onClick={() => alert('Customize profile functionality to be implemented')}>Update</Button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Curate your profile</span>
                  </div>
                  <Button size="sm" onClick={() => alert('Curate profile functionality to be implemented')}>Update</Button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Avatar</span>
                  </div>
                  <Button size="sm" onClick={() => alert('Style your avatar functionality to be implemented')}>Update</Button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Mod Tools</span>
                  </div>
                  <Button size="sm" onClick={() => alert('Moderate your profile functionality to be implemented')}>Update</Button>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-semibold mb-2">SOCIAL LINKS</h3>
              <Button variant="outline" size="sm" className="w-full" onClick={() => alert('Add social link functionality to be implemented')}>
                + Add Social Link
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="text-xs text-gray-500 text-center">
              <p>ama Rules | Privacy Policy | User Agreement | Accessibility</p>
              <p>ama, Inc. © 2025. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
