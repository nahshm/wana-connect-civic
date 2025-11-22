import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PostCard } from '@/components/posts/PostCard';
import { CommentSection } from '@/components/posts/CommentSection';
import { useCommunityData } from '@/hooks/useCommunityData';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Shield, Calendar, Share, Bookmark, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Comment, Post, CommentAward } from '@/types';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { communities, toggleCommunityFollow } = useCommunityData();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch post data from Supabase
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        setPostLoading(true);

        // Fetch post with author, community, and official information
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
            communities!posts_community_id_fkey (id, name, display_name, description, member_count, category),
            officials!posts_official_id_fkey (id, name, position),
            post_media!post_media_post_id_fkey (*)
          `)
          .eq('id', id)
          .single();

        if (postError) {
          if (postError.code === 'PGRST116') {
            // Post not found
            setPost(null);
          } else {
            throw postError;
          }
          return;
        }

        // Fetch user vote if authenticated
        let userVote: 'up' | 'down' | null = null;
        if (user) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('user_id', user.id)
            .eq('post_id', id)
            .maybeSingle();

          if (voteData) {
            userVote = voteData.vote_type as 'up' | 'down';
          }
        }

        // Transform the data to match our interface
        const transformedPost: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          author: {
            id: postData.profiles?.id || '',
            username: postData.profiles?.username || 'anonymous',
            displayName: postData.profiles?.display_name || postData.profiles?.username || 'Anonymous User',
            avatar: postData.profiles?.avatar_url,
            isVerified: postData.profiles?.is_verified,
            role: postData.profiles?.role as 'citizen' | 'official' | 'expert' | 'journalist',
          },
          community: postData.communities ? {
            id: postData.communities.id,
            name: postData.communities.name,
            displayName: postData.communities.display_name,
            description: postData.communities.description || '',
            memberCount: postData.communities.member_count || 0,
            category: postData.communities.category as 'governance' | 'civic-education' | 'accountability' | 'discussion',
          } : undefined,
          upvotes: postData.upvotes || 0,
          downvotes: postData.downvotes || 0,
          commentCount: postData.comment_count || 0,
          tags: postData.tags || [],
          createdAt: new Date(postData.created_at),
          userVote,
          contentSensitivity: (postData.content_sensitivity as 'public' | 'sensitive' | 'crisis') || 'public',
          isNgoVerified: postData.is_ngo_verified || false,
          media: postData.post_media?.map(m => ({
            id: m.id.toString(),
            post_id: m.post_id,
            file_path: m.file_path,
            filename: m.filename,
            file_type: m.file_type,
            file_size: m.file_size,
          })) || [],
        };

        setPost(transformedPost);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching post:', error);
        toast({
          title: "Error",
          description: `Failed to load post: ${errorMessage}`,
          variant: "destructive",
        });
        setPost(null);
      } finally {
        setPostLoading(false);
      }
    };

    fetchPost();
  }, [id, user, toast]);

  // Set page title when post is loaded
  useEffect(() => {
    if (post?.title) {
      document.title = post.title;
    } else {
      document.title = 'Post Detail';
    }
  }, [post?.title]);

  // Fetch comments from Supabase
  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch comments with nested replies and awards
        const { data: commentsData, error } = await supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
            comment_award_assignments!comment_id (
              id,
              awarded_at,
              comment_awards!award_id (
                id,
                name,
                display_name,
                description,
                points,
                category,
                color,
                background_color,
                icon,
                is_enabled,
                sort_order,
                created_at,
                updated_at
              ),
              profiles!awarded_by (
                id,
                display_name
              )
            )
          `)
          .eq('post_id', id)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Fetch user votes for comments if authenticated
        const commentVotes: { [commentId: string]: 'up' | 'down' } = {};
        if (user && commentsData && commentsData.length > 0) {
          const commentIds = commentsData.map(c => c.id);
          const { data: votesData } = await supabase
            .from('votes')
            .select('comment_id, vote_type')
            .eq('user_id', user.id)
            .in('comment_id', commentIds);

          votesData?.forEach(vote => {
            if (vote.comment_id) {
              commentVotes[vote.comment_id] = vote.vote_type as 'up' | 'down';
            }
          });
        }

        // Transform comments data
        const transformedComments: Comment[] = [];
        const commentMap = new Map<string, Comment>();

        commentsData?.forEach(commentData => {
          // Get user vote for this comment
          const userVote = commentVotes[commentData.id] || null;

          // Transform awards data
          const awards: CommentAward[] = commentData.comment_award_assignments?.map((assignment: any) => ({
            id: assignment.comment_awards.id,
            name: assignment.comment_awards.name,
            displayName: assignment.comment_awards.display_name,
            description: assignment.comment_awards.description,
            icon: assignment.comment_awards.icon,
            color: assignment.comment_awards.color,
            backgroundColor: assignment.comment_awards.background_color,
            points: assignment.comment_awards.points,
            category: assignment.comment_awards.category,
            isEnabled: assignment.comment_awards.is_enabled,
            sortOrder: assignment.comment_awards.sort_order,
            createdAt: new Date(assignment.comment_awards.created_at),
            updatedAt: new Date(assignment.comment_awards.updated_at),
            assignedBy: assignment.profiles ? {
              id: assignment.profiles.id,
              username: '',
              displayName: assignment.profiles.display_name,
            } : undefined,
            assignedAt: new Date(assignment.awarded_at),
          })) || [];

          const comment: Comment = {
            id: commentData.id,
            content: commentData.content,
            author: {
              id: commentData.profiles?.id || '',
              username: commentData.profiles?.username || 'anonymous',
              displayName: commentData.profiles?.display_name || commentData.profiles?.username || 'Anonymous User',
              avatar: commentData.profiles?.avatar_url,
              isVerified: commentData.profiles?.is_verified,
              role: commentData.profiles?.role as 'citizen' | 'official' | 'expert' | 'journalist',
            },
            postId: commentData.post_id,
            parentId: commentData.parent_id,
            createdAt: new Date(commentData.created_at),
            upvotes: commentData.upvotes || 0,
            downvotes: commentData.downvotes || 0,
            userVote,
            depth: commentData.depth || 0,
            isCollapsed: commentData.is_collapsed || false,
            moderationStatus: commentData.moderation_status as 'approved' | 'pending' | 'removed',
            awards,
            replies: []
          };

          commentMap.set(comment.id, comment);

          if (comment.parentId) {
            // This is a reply
            const parentComment = commentMap.get(comment.parentId);
            if (parentComment) {
              parentComment.replies = parentComment.replies || [];
              parentComment.replies.push(comment);
            }
          } else {
            // This is a top-level comment
            transformedComments.push(comment);
          }
        });

        setComments(transformedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [id, user, toast]);

  // Check if post is saved or hidden
  useEffect(() => {
    const checkSavedHiddenStatus = async () => {
      if (!user || !id) return;

      try {
        // Check if saved
        const { data: savedData } = await supabase
          .from('saved_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_type', 'post')
          .eq('item_id', id)
          .maybeSingle();

        setIsSaved(!!savedData);

        // Check if hidden
        const { data: hiddenData } = await supabase
          .from('hidden_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_type', 'post')
          .eq('item_id', id)
          .maybeSingle();

        setIsHidden(!!hiddenData);
      } catch (error) {
        console.error('Error checking saved/hidden status:', error);
      }
    };

    checkSavedHiddenStatus();
  }, [user, id]);

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment on posts",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate depth for the new comment
      let depth = 0;
      if (parentId) {
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment) {
          depth = parentComment.depth + 1;
        }
      }

      // Insert comment into Supabase
      const { data: commentData, error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          parent_id: parentId || null,
          content,
          author_id: user.id,
          depth,
          moderation_status: 'approved',
          upvotes: 0,
          downvotes: 0,
          is_collapsed: false
        })
        .select(`
          *,
          profiles!comments_author_id_fkey (id, username, display_name, avatar_url, is_verified, role)
        `)
        .single();

      if (error) throw error;

      // Update post's comment count
      await supabase
        .from('posts')
        .update({
          comment_count: (post?.commentCount || 0) + 1
        })
        .eq('id', id);

      // Update local post state
      setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);

      // Refetch comments to ensure UI consistency
      const { data: commentsData, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
          comment_award_assignments!comment_id (
            id,
            awarded_at,
            comment_awards!award_id (
              id,
              name,
              display_name,
              description,
              points,
              category,
              color,
              background_color,
              icon,
              is_enabled,
              sort_order,
              created_at,
              updated_at
            ),
            profiles!awarded_by (
              id,
              display_name
            )
          )
        `)
        .eq('post_id', id)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch user votes for comments
      const commentVotes: { [commentId: string]: 'up' | 'down' } = {};
      if (commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map(c => c.id);
        const { data: votesData } = await supabase
          .from('votes')
          .select('comment_id, vote_type')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        votesData?.forEach(vote => {
          if (vote.comment_id) {
            commentVotes[vote.comment_id] = vote.vote_type as 'up' | 'down';
          }
        });
      }

      // Transform comments data
      const transformedComments: Comment[] = [];
      const commentMap = new Map<string, Comment>();

      commentsData?.forEach(commentData => {
        const userVote = commentVotes[commentData.id] || null;

        // Transform awards data
        const awards: CommentAward[] = commentData.comment_award_assignments?.map((assignment: any) => ({
          id: assignment.comment_awards.id,
          name: assignment.comment_awards.name,
          displayName: assignment.comment_awards.display_name,
          description: assignment.comment_awards.description,
          icon: assignment.comment_awards.icon,
          color: assignment.comment_awards.color,
          backgroundColor: assignment.comment_awards.background_color,
          points: assignment.comment_awards.points,
          category: assignment.comment_awards.category,
          isEnabled: assignment.comment_awards.is_enabled,
          sortOrder: assignment.comment_awards.sort_order,
          createdAt: new Date(assignment.comment_awards.created_at),
          updatedAt: new Date(assignment.comment_awards.updated_at),
          assignedBy: assignment.profiles ? {
            id: assignment.profiles.id,
            username: '',
            displayName: assignment.profiles.display_name,
          } : undefined,
          assignedAt: new Date(assignment.awarded_at),
        })) || [];

        const comment: Comment = {
          id: commentData.id,
          content: commentData.content,
          author: {
            id: commentData.profiles?.id || '',
            username: commentData.profiles?.username || 'anonymous',
            displayName: commentData.profiles?.display_name || commentData.profiles?.username || 'Anonymous User',
            avatar: commentData.profiles?.avatar_url,
            isVerified: commentData.profiles?.is_verified,
            role: commentData.profiles?.role as 'citizen' | 'official' | 'expert' | 'journalist',
          },
          postId: commentData.post_id,
          parentId: commentData.parent_id,
          createdAt: new Date(commentData.created_at),
          upvotes: commentData.upvotes || 0,
          downvotes: commentData.downvotes || 0,
          userVote,
          depth: commentData.depth || 0,
          isCollapsed: commentData.is_collapsed || false,
          moderationStatus: commentData.moderation_status as 'approved' | 'pending' | 'removed',
          awards,
          replies: []
        };

        commentMap.set(comment.id, comment);

        if (comment.parentId) {
          const parentComment = commentMap.get(comment.parentId);
          if (parentComment) {
            parentComment.replies = parentComment.replies || [];
            parentComment.replies.push(comment);
          }
        } else {
          transformedComments.push(comment);
        }
      });

      setComments(transformedComments);

      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVoteComment = async (commentId: string, vote: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on comments",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user already voted on this comment
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === vote) {
          // Remove vote
          await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote
          await supabase
            .from('votes')
            .update({ vote_type: vote })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            comment_id: commentId,
            vote_type: vote,
          });
      }

      // Update local comment state
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === commentId) {
            const currentVote = comment.userVote;
            let newUpvotes = comment.upvotes;
            let newDownvotes = comment.downvotes;
            let newUserVote: 'up' | 'down' | null = vote;

            // Remove previous vote
            if (currentVote === 'up') newUpvotes--;
            if (currentVote === 'down') newDownvotes--;

            // Add new vote (or remove if same)
            if (currentVote === vote) {
              newUserVote = null;
            } else {
              if (vote === 'up') newUpvotes++;
              if (vote === 'down') newDownvotes++;
            }

            return {
              ...comment,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              userVote: newUserVote
            };
          }

          // Handle nested replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? (() => {
                    const currentVote = reply.userVote;
                    let newUpvotes = reply.upvotes;
                    let newDownvotes = reply.downvotes;
                    let newUserVote: 'up' | 'down' | null = vote;

                    if (currentVote === 'up') newUpvotes--;
                    if (currentVote === 'down') newDownvotes--;

                    if (currentVote === vote) {
                      newUserVote = null;
                    } else {
                      if (vote === 'up') newUpvotes++;
                      if (vote === 'down') newDownvotes++;
                    }

                    return {
                      ...reply,
                      upvotes: newUpvotes,
                      downvotes: newDownvotes,
                      userVote: newUserVote
                    };
                  })()
                  : reply
              )
            };
          }

          return comment;
        })
      );
    } catch (error) {
      console.error('Error voting on comment:', error);
      toast({
        title: "Error",
        description: "Failed to vote on comment",
        variant: "destructive",
      });
    }
  };

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on posts",
        variant: "destructive",
      });
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

      // Update local post state
      setPost(prev => {
        if (!prev) return prev;
        const currentVote = prev.userVote;
        let upvotes = prev.upvotes;
        let downvotes = prev.downvotes;
        let newVote: 'up' | 'down' | null = voteType;

        // Remove previous vote
        if (currentVote === 'up') upvotes--;
        if (currentVote === 'down') downvotes--;

        // If clicking same vote, remove it
        if (currentVote === voteType) {
          newVote = null;
        } else {
          // Add new vote
          if (voteType === 'up') upvotes++;
          if (voteType === 'down') downvotes++;
        }

        return { ...prev, upvotes, downvotes, userVote: newVote };
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
      });
    }
  };

  // Show loading skeleton while post is being fetched
  if (postLoading) {
    return (
      <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex-1 max-w-2xl">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show error only when loading is complete and post is not found
  if (!post) {
    return (
      <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex-1 max-w-4xl">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">Return to Feed</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
      {/* Main Content */}
      <div className="flex-1 max-w-2xl">
        {/* Back Navigation */}
        <Button variant="ghost" asChild className="mb-4 text-muted-foreground hover:text-foreground">
          <Link to={post.community ? `/c/${post.community.name}` : "/"} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {post.community ? `Back to r/${post.community.name}` : "Back to Feed"}
          </Link>
        </Button>

        {/* Post */}
        <div className="mb-6">
          <PostCard
            post={post}
            onVote={handleVote}
            isDetailView={true}
          />
        </div>

        {/* Comments */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full ml-6" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <CommentSection
            postId={post.id}
            comments={comments}
            onAddComment={handleAddComment}
            onVoteComment={handleVoteComment}
          />
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-80">
        <div className="sticky top-24 space-y-4">
          {/* Community Info Card */}
          {post.community && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  About Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold">r/{post.community.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {post.community.description}
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{post.community.memberCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Created 2y ago</span>
                  </div>
                </div>
                <Button
                  onClick={() => toggleCommunityFollow(post.community.id)}
                  className="w-full"
                  variant={post.community.isFollowing ? "outline" : "default"}
                >
                  {post.community.isFollowing ? 'Following' : 'Join Community'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Community Rules */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Community Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Be respectful and civil',
                'No harassment or hate speech',
                'Stay on topic',
                'No spam or self-promotion',
                'Follow factual reporting standards'
              ].map((rule, index) => (
                <div key={index} className="text-sm text-muted-foreground p-2 bg-accent/20 rounded">
                  {index + 1}. {rule}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Other Sidebar Content */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default PostDetail;