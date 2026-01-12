import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, MessageCircle, Share, MoreHorizontal, Bookmark, Edit, Trash2, MessageSquare, AlertTriangle, AlertOctagon, BadgeCheck, Shield } from 'lucide-react';
import { VerifiedBadge, OfficialPositionBadge } from '@/components/ui/verified-badge';
import { CIVIC_FLAIRS } from '@/config/flairs';
import { SafeContentRenderer } from './SafeContentRenderer';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { useVerification } from '@/hooks/useVerification';
import VerificationPanel from '@/components/verification/VerificationPanel';
import SentimentBar from '@/components/verification/SentimentBar';

interface PostCardProps {
  post: Post;
  onVote: (postId: string, vote: 'up' | 'down') => void;
  isDetailView?: boolean;
  viewMode?: 'card' | 'compact';
}

export const PostCard = ({ post, onVote, isDetailView = false, viewMode = 'card' }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const secondVideoRef = useRef<HTMLVideoElement>(null);

  // Verification system  
  const { verification, castVote, isCastingVote } = useVerification({
    contentId: post.id,
    contentType: 'post'
  });

  const isAuthor = user && post.author.id === user.id;

  // Helper to get the correct post link based on community context
  const getPostLink = () => {
    if (post.community?.name) {
      return `/c/${post.community.name}/post/${post.id}`;
    }
    return `/post/${post.id}`;
  };

  const handleDelete = async () => {
    if (!user || !isAuthor) return;

    setIsDeleting(true);
    try {
      // Delete associated media first
      if (post.media && post.media.length > 0) {
        const { error: mediaError } = await supabase
          .from('post_media')
          .delete()
          .eq('post_id', post.id);

        if (mediaError) {
          console.error('Error deleting media:', mediaError);
        }

        // Delete files from storage
        for (const media of post.media) {
          await supabase.storage.from('media').remove([media.file_path]);
        }
      }

      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('author_id', user.id); // Extra safety check

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
      });

      // Navigate away if on post detail page
      if (isDetailView) {
        navigate('/');
      } else {
        // Trigger a refresh of the parent component
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-pause videos when tab/window is not visible
  useEffect(() => {
    const videos = [videoRef.current, secondVideoRef.current].filter(Boolean) as HTMLVideoElement[]
    if (videos.length === 0) return

    const handleVisibilityChange = () => {
      videos.forEach(video => {
        if (document.hidden) {
          // Tab hidden - pause all videos
          if (!video.paused) {
            video.pause()
          }
        }
        // Note: Don't auto-resume on visible - let user click play
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Handle community data that might be under 'community' or 'community_id' alias
  const communityData = post.community || (post as any).community_id;

  const getVoteScore = () => post.upvotes - post.downvotes;

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'official': return 'bg-civic-blue/10 text-civic-blue border-civic-blue/20';
      case 'expert': return 'bg-civic-green/10 text-civic-green border-civic-green/20';
      case 'journalist': return 'bg-civic-orange/10 text-civic-orange border-civic-orange/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Helper to render badges for content sensitivity (matching form design)
  const renderSpecialBadges = () => {
    const badges = [];
    // Map content sensitivity to badges with icons matching the form
    if (post.contentSensitivity === 'crisis') {
      badges.push(
        <Badge key="crisis" variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1">
          <AlertOctagon className="w-3 h-3" />
          Crisis Report
        </Badge>
      );
    } else if (post.contentSensitivity === 'sensitive') {
      badges.push(
        <Badge key="sensitive" variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Sensitive Topic
        </Badge>
      );
    } else if (post.contentSensitivity === 'public') {
      badges.push(
        <Badge key="public" variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          Public Discussion
        </Badge>
      );
    }
    if (post.isNgoVerified) {
      badges.push(
        <Badge key="verified" variant="outline" className="flex items-center gap-1">
          <Verified className="w-3 h-3 text-blue-500" />
          NGO VERIFIED
        </Badge>
      );
    }
    return badges.length > 0 ? (
      <div className="flex flex-wrap gap-1 mb-2">
        {badges}
      </div>
    ) : null;
  };

  // Helper to render media (used in both views)
  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    return (
      <div className="mb-3">
        {post.media.length === 1 ? (
          <div className="rounded-lg overflow-hidden border border-sidebar-border">
            {post.media[0].file_type?.startsWith('image/') ? (
              <img
                src={supabase.storage.from('media').getPublicUrl(post.media[0].file_path).data.publicUrl}
                alt="Post media"
                loading="eager"
                fetchPriority="high"
                className="w-full h-auto max-h-96 object-cover"
              />
            ) : post.media[0].file_type?.startsWith('video/') ? (
              <video
                ref={videoRef}
                src={supabase.storage.from('media').getPublicUrl(post.media[0].file_path).data.publicUrl}
                controls
                className="w-full h-auto max-h-96"
              />
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {post.media.slice(0, 4).map((media, index) => (
              <div key={media.id} className="rounded-lg overflow-hidden border border-sidebar-border">
                {media.file_type?.startsWith('image/') ? (
                  <img
                    src={supabase.storage.from('media').getPublicUrl(media.file_path).data.publicUrl}
                    alt={`Post media ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                ) : media.file_type?.startsWith('video/') ? (
                  <video
                    ref={index === 0 ? secondVideoRef : undefined}
                    src={supabase.storage.from('media').getPublicUrl(media.file_path).data.publicUrl}
                    className="w-full h-32 object-cover"
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'compact') {
    return (
      <div className="flex hover:bg-sidebar-accent/50 transition-colors border-b border-sidebar-border">
        {/* Vote Column */}
        <div className="flex flex-col items-center p-2 w-12 bg-sidebar-background/50">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Upvote post: ${post.title}`}
            aria-pressed={post.userVote === 'up'}
            onClick={() => onVote(post.id, 'up')}
            className={`h-6 w-6 p-0 ${post.userVote === 'up' ? 'text-civic-green bg-civic-green/10' : 'text-sidebar-muted-foreground hover:text-civic-green'}`}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium text-sidebar-foreground py-1">
            {formatNumber(getVoteScore())}
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Downvote post"
            aria-pressed={post.userVote === 'down'}
            onClick={() => onVote(post.id, 'down')}
            className={`h-6 w-6 p-0 ${post.userVote === 'down' ? 'text-civic-red bg-civic-red/10' : 'text-sidebar-muted-foreground hover:text-civic-red'}`}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center space-x-2 text-xs text-sidebar-muted-foreground mb-1">
            {communityData ? (
              <Link to={`/c/${communityData.name}`} className="hover:underline font-medium">
                c/{communityData.name}
              </Link>
            ) : (
              <span className="font-medium">Profile Post</span>
            )}
            <span>•</span>
            <span>by</span>
            <Link to={`/u/${post.author.username || post.author.displayName || 'anonymous'}`} className="hover:underline">
              u/{post.author.displayName || post.author.username || 'Anonymous'}
            </Link>
            <span>•</span>
            <span>{formatDistanceToNow(post.createdAt)} ago</span>
          </div>

          {renderSpecialBadges()}

          <Link to={getPostLink()} className="block group">
            <h3 className="font-medium text-sidebar-foreground group-hover:text-primary line-clamp-2 mb-1">
              {post.title}
            </h3>
          </Link>

          <div className="flex items-center space-x-4 mt-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-sidebar-muted-foreground hover:bg-sidebar-accent" asChild>
              <Link to={getPostLink()}>
                <MessageCircle className="w-3 h-3 mr-1" />
                {post.commentCount}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-sidebar-muted-foreground hover:bg-sidebar-accent">
              <Share className="w-3 h-3 mr-1" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-sidebar-muted-foreground hover:bg-sidebar-accent">
              <Bookmark className="w-3 h-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-2 bg-sidebar-background border-sidebar-border hover:border-sidebar-ring transition-colors max-w-[640px] mx-auto">
      <div className="flex flex-col">
        {/* Main Content */}
        <CardContent className="flex-1 p-3 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 text-xs text-sidebar-muted-foreground mb-1.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="text-[10px]">{(post.author.displayName || post.author.username || '?')[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {communityData ? (
              <>
                <Link to={`/c/${communityData.name}`} className="hover:underline font-medium">
                  c/{communityData.name}
                </Link>
                <span>•</span>
                <span>by</span>
              </>
            ) : null}
            <Link
              to={`/${post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/${post.author.username || post.author.displayName || 'anonymous'}`}
              className="hover:underline"
            >
              {post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/{post.author.displayName || post.author.username || 'Anonymous'}
            </Link>
            {post.author.isVerified && (
              <VerifiedBadge
                size="xs"
                positionTitle={post.author.officialPosition}
              />
            )}
            {/* Show official position badge if verified and has position */}
            {post.author.isVerified && post.author.officialPosition && (
              <OfficialPositionBadge
                position={post.author.officialPosition}
                className="hidden sm:inline-flex"
              />
            )}
            {/* Show role badge only if NOT a verified official (to avoid redundancy) */}
            {post.author.role && !post.author.isVerified && (
              <Badge variant="outline" className={`text-xs px-1 py-0 ${getRoleColor(post.author.role)}`}>
                {post.author.role}
              </Badge>
            )}
            <span>•</span>
            <span>{formatDistanceToNow(post.createdAt)} ago</span>
          </div>

          {renderSpecialBadges()}

          {/* Title and Content */}
          {isDetailView ? (
            <div>
              {/* Detail View: Title -> Media -> Description */}
              <h1 className="font-semibold text-xl mb-3 text-sidebar-foreground leading-tight">{post.title}</h1>

              {/* Media between title and description */}
              {renderMedia()}

              {/* Description */}
              <SafeContentRenderer
                content={post.content || ''}
                className="text-sidebar-foreground text-sm mb-4"
              />
            </div>
          ) : (
            <div>
              {/* Feed View: Title only, no description */}
              <Link to={getPostLink()} className="block group">
                <h2 className="font-semibold text-base mb-2 text-sidebar-foreground group-hover:text-primary leading-snug line-clamp-3">
                  {post.title}
                </h2>
              </Link>

              {/* Media shown in feed view - outside Link so it's clickable */}
              {renderMedia()}
            </div>
          )}

          {/* Flairs - Display with same colors as form */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map(tagId => {
                const flair = CIVIC_FLAIRS.find(f => f.id === tagId);
                if (!flair) return null;

                return (
                  <Badge
                    key={tagId}
                    variant="outline"
                    className={`text-xs ${flair.bgColor} ${flair.color} border-transparent`}
                  >
                    {flair.label}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Sentiment Bar - only show if available */}
          {(post as any).sentiment && (
            <SentimentBar sentiment={(post as any).sentiment} className="mb-3" />
          )}

          {/* Verification Panel */}
          <VerificationPanel
            verification={verification}
            onVote={castVote}
            isLoading={isCastingVote}
          />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Voting Buttons moved here */}
              <div className="flex items-center bg-sidebar-accent/50 rounded-full px-1.5 mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Upvote post: ${post.title}`}
                  aria-pressed={post.userVote === 'up'}
                  onClick={() => onVote(post.id, 'up')}
                  className={`h-8 w-8 p-0 rounded-full ${post.userVote === 'up' ? 'text-civic-green bg-civic-green/10' : 'text-sidebar-muted-foreground hover:text-civic-green hover:bg-civic-green/10'}`}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <span className="text-xs font-medium text-sidebar-foreground px-1.5 min-w-[1.5rem] text-center">
                  {formatNumber(getVoteScore())}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Downvote post"
                  aria-pressed={post.userVote === 'down'}
                  onClick={() => onVote(post.id, 'down')}
                  className={`h-8 w-8 p-0 rounded-full ${post.userVote === 'down' ? 'text-civic-red bg-civic-red/10' : 'text-sidebar-muted-foreground hover:text-civic-red hover:bg-civic-red/10'}`}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="h-8 px-3 text-sidebar-muted-foreground hover:bg-sidebar-accent rounded-full" asChild>
                <Link to={getPostLink()}>
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  <span className="text-xs">{post.commentCount}</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-sidebar-muted-foreground hover:bg-sidebar-accent rounded-full">
                <Share className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">Share</span>
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-sidebar-muted-foreground hover:bg-sidebar-accent rounded-full">
                <Bookmark className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">Save</span>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-sidebar-muted-foreground hover:bg-sidebar-accent rounded-full">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-sidebar-background border-sidebar-border">
                {isAuthor && (
                  <>
                    <DropdownMenuItem
                      className="text-sidebar-foreground hover:bg-sidebar-accent"
                      onClick={() => navigate(`/edit-post/${post.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit post
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive hover:bg-destructive/10"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete post
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-sidebar-background border-sidebar-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-sidebar-foreground">Delete Post</AlertDialogTitle>
                          <AlertDialogDescription className="text-sidebar-muted-foreground">
                            Are you sure you want to delete this post? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Hide post
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Block user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};