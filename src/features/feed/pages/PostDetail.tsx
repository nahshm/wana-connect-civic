import { useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostCard } from '@/components/posts/PostCard';
import { CommentSection } from '@/components/posts/CommentSection';
import { CommunityInfoCard } from '@/components/posts/CommunityInfoCard';
import { RelatedPostsCard } from '@/components/posts/RelatedPostsCard';
import { useCommunityData } from '@/hooks/useCommunityData';
import { usePostDetail } from '@/hooks/usePostDetail';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useVerification } from '@/hooks/useVerification';
import { SafeContentRenderer } from '@/components/posts/SafeContentRenderer';
import type { Comment, Post, CommentAward, CommentMedia } from '@/types';
import type { UploadedMedia } from '@/components/posts/CommentInput';


// PostDetail handles the detailed view of a single post and its discussion
const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  // Resolve ID from URL if missing from params (PrefixRouter context)
  const resolvedId = useMemo(() => {
    if (id) return id;
    const parts = location.pathname.split('/');
    // Handle /c/:community/post/:id
    if (parts[1] === 'c' && parts[3] === 'post' && parts[4]) return parts[4];
    // Handle /r/:community/post/:id
    if (parts[1] === 'r' && parts[3] === 'post' && parts[4]) return parts[4];
    return null;
  }, [id, location.pathname]);

  const { communities, toggleCommunityFollow } = useCommunityData();
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    post, 
    comments, 
    isPostLoading, 
    isCommentsLoading,
    refetchPost,
    refetchComments
  } = usePostDetail(resolvedId, user?.id);

  const loading = isCommentsLoading;
  const postLoading = isPostLoading;

  const { verification } = useVerification({
    contentId: resolvedId || '',
    contentType: 'post'
  });

  useEffect(() => {
    const previousTitle = document.title;
    if (post?.title) {
      document.title = post.title;
    } else {
      document.title = 'Post Detail';
    }
    return () => { document.title = previousTitle; };
  }, [post?.title]);



  const handleAddComment = async (content: string, parentId?: string, mediaFiles?: UploadedMedia[]) => {
    if (!user) {
      authModal.open('login');
      return;
    }

    try {
      let depth = 0;
      if (parentId) {
        const findDepth = (comments: Comment[]): number => {
          for (const c of comments) {
            if (c.id === parentId) return c.depth + 1;
            if (c.replies) {
              const d = findDepth(c.replies);
              if (d > 0) return d;
            }
          }
          return 0;
        };
        depth = findDepth(comments);
      }

      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: resolvedId,
          parent_id: parentId || null,
          content,
          author_id: user.id,
          depth,
          moderation_status: 'approved',
          upvotes: 0,
          downvotes: 0,
          is_collapsed: false
        })
        .select('id')
        .single();

      if (error) throw error;

      // Insert comment media records if any
      if (mediaFiles && mediaFiles.length > 0 && newComment) {
        const mediaRecords = mediaFiles.map(m => ({
          comment_id: newComment.id,
          file_path: m.filePath,
          filename: m.filename,
          original_filename: m.filename,
          file_type: m.fileType.startsWith('image/') ? 'image' : m.fileType.startsWith('video/') ? 'video' : 'document',
          mime_type: m.fileType,
          file_size: m.fileSize,
        }));
        await supabase.from('comment_media').insert(mediaRecords);
      }

      if (error) throw error;

      // Update comment count
      await supabase
        .from('posts')
        .update({ comment_count: (post?.commentCount || 0) + 1 })
        .eq('id', id);

      refetchPost();

      // Invalidate feed cache so it reflects the new count
      queryClient.invalidateQueries({ queryKey: ['unified-feed'] });

      // Refetch comments
      const { data: commentsData, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
          comment_media!comment_media_comment_id_fkey (id, file_path, filename, file_type, file_size, created_at),
          comment_award_assignments!comment_id (
            id, awarded_at,
            comment_awards!award_id (id, name, display_name, description, points, category, color, background_color, icon, is_enabled, sort_order, created_at, updated_at),
            profiles!awarded_by (id, display_name)
          )
        `)
        .eq('post_id', resolvedId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

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

      // Update comment count
      await supabase
        .from('posts')
        .update({ comment_count: (post?.commentCount || 0) + 1 })
        .eq('id', resolvedId);

      // Invalidate queries so UI reflects new data
      queryClient.invalidateQueries({ queryKey: ['post', resolvedId] });
      queryClient.invalidateQueries({ queryKey: ['post-comments', resolvedId] });
      queryClient.invalidateQueries({ queryKey: ['unified-feed'] });

      toast({ title: "Comment posted" });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  const handleVoteComment = async (commentId: string, vote: 'up' | 'down') => {
    if (!user) {
      authModal.open('login');
      return;
    }

    try {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === vote) {
          await supabase.from('votes').delete().eq('id', existingVote.id);
        } else {
          await supabase.from('votes').update({ vote_type: vote }).eq('id', existingVote.id);
        }
      } else {
        await supabase.from('votes').insert({
          user_id: user.id,
          comment_id: commentId,
          vote_type: vote,
        });
      }

      // Invalidate comments query to refresh votes/counts
      queryClient.invalidateQueries({ queryKey: ['post-comments', resolvedId] });
    } catch (error) {
      console.error('Error voting on comment:', error);
      toast({ title: "Error", description: "Failed to vote", variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true, content: '[deleted]' })
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['post-comments', resolvedId] });
      toast({ title: "Comment deleted" });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('author_id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['post-comments', resolvedId] });
      toast({ title: "Comment updated" });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({ title: "Error", description: "Failed to edit comment", variant: "destructive" });
    }
  };

  // PostCard handles DB calls for voting — this only updates parent state for sidebar stats
  const handleVote = (_postId: string, _voteType: 'up' | 'down') => {
    // PostCard manages optimistic UI + Supabase calls internally.
  };

  // Loading skeleton
  if (postLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-8 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">Post Not Found</h1>
        <p className="text-sm text-muted-foreground mb-4">
          This post doesn't exist or has been removed.
        </p>
        <Button asChild size="sm">
          <Link to="/">Return to Feed</Link>
        </Button>
      </div>
    );
  }

  const voteScore = post.upvotes - post.downvotes;
  const upvoteRatio = post.upvotes + post.downvotes > 0
    ? Math.round((post.upvotes / (post.upvotes + post.downvotes)) * 100)
    : 0;

  return (
    <div className="h-full bg-background">
      <div className="flex h-full">
        {/* Main content - scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link
                to={post.community ? `/c/${post.community.name}` : "/"}
                className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{post.community ? `c/${post.community.name}` : 'Feed'}</span>
              </Link>
            </div>

            {/* Post content rendered by PostCard in detail mode */}
            <div className="mb-4">
              <PostCard
                post={post}
                onVote={handleVote}
                isDetailView={true}
              />
            </div>


            <Separator className="mb-6" />

            {/* Comments */}
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <CommentSection
                postId={post.id}
                comments={comments}
                onAddComment={handleAddComment}
                onVoteComment={handleVoteComment}
                onDeleteComment={handleDeleteComment}
                onEditComment={handleEditComment}
              />
            )}

            {/* Bottom spacer */}
            <div className="h-12" />
          </div>
        </div>

        {/* Right sidebar - desktop only */}
        <aside className="hidden xl:block w-80 flex-shrink-0 border-l border-border">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Compact post stats */}
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Stats</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className={`text-lg font-bold ${voteScore > 0 ? 'text-primary' : voteScore < 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {voteScore > 0 ? '+' : ''}{voteScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{post.commentCount}</p>
                    <p className="text-[10px] text-muted-foreground">Comments</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{upvoteRatio}%</p>
                    <p className="text-[10px] text-muted-foreground">Upvoted</p>
                  </div>
                </div>
              </div>

              {/* Community Info Card */}
              {post.community && (
                <CommunityInfoCard community={post.community} />
              )}

              {/* Related Posts */}
              <RelatedPostsCard
                postId={post.id}
                communityId={post.community?.id}
                tags={post.tags}
              />
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
};

export default PostDetail;
