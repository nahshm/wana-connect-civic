import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Post, Comment, CommunityFlair, CommentAward, CommentMedia } from '@/types';
import { getFlairById } from '@/config/flairs';

interface PostMediaRow { id: string; post_id: string; file_path: string; filename: string; file_type: string; file_size: number }
interface CommentMediaRow { id: string; file_path: string; filename: string; file_type: string; file_size: number; created_at: string }
interface AwardAssignment { 
  id: string; 
  awarded_at: string; 
  comment_awards: { id: string; name: string; display_name: string; description: string; icons?: string; icon: string; color: string; background_color: string; points: number; category: string; is_enabled: boolean; sort_order: number; created_at: string; updated_at: string };
  profiles: { id: string; display_name: string } | null;
}

export const usePostDetail = (postId: string | null, userId?: string) => {
  // Post Query
  const postQuery = useQuery({
    queryKey: ['post', postId, userId],
    queryFn: async () => {
      if (!postId) return null;

      const [postRes, voteRes] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey (
              id,
              username,
              display_name,
              avatar_url,
              is_verified,
              role,
              official_position
            ),
            community:communities!posts_community_id_fkey (*),
            post_media!post_media_post_id_fkey (*)
          `)
          .eq('id', postId)
          .single(),
        userId ? supabase
          .from('votes')
          .select('vote_type')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .maybeSingle() : Promise.resolve({ data: null, error: null })
      ]);

      if (postRes.error) throw postRes.error;
      const postData = postRes.data;
      const voteData = voteRes.data;

      let userVote: 'up' | 'down' | null = null;
      if (voteData) {
        userVote = voteData.vote_type as 'up' | 'down';
      }

      const flairs: CommunityFlair[] = (postData.tags || [])
        .map(t => getFlairById(t))
        .filter(Boolean)
        .map(cf => ({
          id: cf!.id,
          communityId: postData.community?.id || '',
          name: cf!.label,
          textColor: cf!.color,
          backgroundColor: cf!.bgColor,
          flairType: 'post' as const,
          isEnabled: true,
          createdAt: new Date()
        }));

      const flair: CommunityFlair | undefined = flairs.length > 0 ? flairs[0] : undefined;

      const transformedPost: Post = {
        id: postData.id,
        title: postData.title,
        content: postData.content,
        author: {
          id: postData.author?.id || '',
          username: postData.author?.username || 'anonymous',
          displayName: postData.author?.display_name || postData.author?.username || 'Anonymous User',
          avatar: postData.author?.avatar_url,
          isVerified: postData.author?.is_verified,
          role: postData.author?.role as any,
          officialPosition: postData.author?.official_position,
        },
        community: postData.community ? {
          id: postData.community.id,
          name: postData.community.name,
          displayName: postData.community.display_name || postData.community.name,
          description: postData.community.description || '',
          memberCount: postData.community.member_count || 0,
          category: postData.community.category as any,
          type: postData.community.type as any,
        } : undefined,
        upvotes: postData.upvotes || 0,
        downvotes: postData.downvotes || 0,
        commentCount: postData.comment_count || 0,
        tags: postData.tags || [],
        createdAt: new Date(postData.created_at),
        userVote,
        flair,
        flairs,
        contentSensitivity: (postData.content_sensitivity as any) || 'public',
        isNgoVerified: postData.is_ngo_verified || false,
        link_url: postData.link_url,
        link_title: postData.link_title,
        link_description: postData.link_description,
        link_image: postData.link_image,
        media: postData.post_media?.map((m: PostMediaRow) => ({
          id: m.id.toString(),
          post_id: m.post_id,
          file_path: m.file_path,
          filename: m.filename,
          file_type: m.file_type,
          file_size: m.file_size,
        })) || [],
      };

      return transformedPost;
    },
    enabled: !!postId,
    staleTime: 1000 * 60 * 5,
  });

  // Comments Query
  const commentsQuery = useQuery({
    queryKey: ['post-comments', postId, userId],
    queryFn: async () => {
      if (!postId) return [];

      const [commentsRes, votesRes] = await Promise.all([
        supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_author_id_fkey (id, username, display_name, avatar_url, is_verified, role),
            comment_media!comment_media_comment_id_fkey (id, file_path, filename, file_type, file_size, created_at),
            comment_award_assignments!comment_id (
              id,
              awarded_at,
              comment_awards!award_id (
                id, name, display_name, description, points, category, color, background_color, icon, is_enabled, sort_order, created_at, updated_at
              ),
              profiles!awarded_by (id, display_name)
            )
          `)
          .eq('post_id', postId)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: true }),
        userId ? supabase
          .from('votes')
          .select('comment_id, vote_type')
          .eq('user_id', userId)
          .not('comment_id', 'is', null) : Promise.resolve({ data: [], error: null })
      ]);

      if (commentsRes.error) throw commentsRes.error;
      const commentsData = commentsRes.data;
      const votesData = votesRes.data;

      const commentVotes: { [commentId: string]: 'up' | 'down' } = {};
      votesData?.forEach((vote: any) => {
        if (vote.comment_id) {
          commentVotes[vote.comment_id] = vote.vote_type as 'up' | 'down';
        }
      });

      const transformedComments: Comment[] = [];
      const commentMap = new Map<string, Comment>();

      commentsData?.forEach(commentData => {
        const userVote = commentVotes[commentData.id] || null;

        const awards: CommentAward[] = commentData.comment_award_assignments?.map((assignment: AwardAssignment) => ({
          id: assignment.comment_awards.id,
          name: assignment.comment_awards.name,
          displayName: assignment.comment_awards.display_name,
          description: assignment.comment_awards.description,
          icon: assignment.comment_awards.icon,
          color: assignment.comment_awards.color,
          backgroundColor: assignment.comment_awards.background_color,
          points: assignment.comment_awards.points,
          category: assignment.comment_awards.category as any,
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

        const mediaItems: CommentMedia[] = commentData.comment_media?.map((m: CommentMediaRow) => ({
          id: m.id,
          commentId: commentData.id,
          filePath: m.file_path,
          filename: m.filename,
          fileType: m.file_type,
          fileSize: m.file_size || 0,
          uploadedAt: new Date(m.created_at),
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
            role: commentData.profiles?.role as any,
          },
          postId: commentData.post_id,
          parentId: commentData.parent_id,
          createdAt: new Date(commentData.created_at),
          upvotes: commentData.upvotes || 0,
          downvotes: commentData.downvotes || 0,
          userVote,
          depth: commentData.depth || 0,
          isCollapsed: commentData.is_collapsed || false,
          moderationStatus: commentData.moderation_status as any,
          isDeleted: commentData.is_deleted || false,
          awards,
          media: mediaItems,
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

      return transformedComments;
    },
    enabled: !!postId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    post: postQuery.data,
    comments: commentsQuery.data,
    isLoading: postQuery.isLoading || commentsQuery.isLoading,
    isPostLoading: postQuery.isLoading,
    isCommentsLoading: commentsQuery.isLoading,
    isError: postQuery.isError || commentsQuery.isError,
    postError: postQuery.error,
    commentsError: commentsQuery.error,
    refetchPost: postQuery.refetch,
    refetchComments: commentsQuery.refetch,
  };
};
