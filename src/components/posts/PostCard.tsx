import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, MessageCircle, Share, MoreHorizontal, Bookmark, Edit, Trash2, MessageSquare, AlertTriangle, AlertOctagon, BadgeCheck, Shield, ChevronDown, ChevronUp, Smile, Eye, ThumbsUp, ThumbsDown, Play, Pause, Volume2, VolumeX, Maximize2, Image as ImageIcon, Film, FileText, ExternalLink, Bell, EyeOff, X, Flag } from 'lucide-react';
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
  DropdownMenuSeparator,
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
  isMember?: boolean; // NEW: Is user a member of this post's community?
  onJoinCommunity?: (communityId: string, communityName: string) => void; // NEW: Callback to join community
}

export const PostCard = ({ 
  post, 
  onVote, 
  isDetailView = false, 
  viewMode = 'card',
  isMember = true, // Default true for backwards compatibility
  onJoinCommunity
}: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [isContentExpanded, setIsContentExpanded] = useState(isDetailView)
  const videoRef = useRef<HTMLVideoElement>(null)
  const secondVideoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSecondPlaying, setIsSecondPlaying] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showSavedTooltip, setShowSavedTooltip] = useState(false)

  // Handle bookmark/save with tooltip
  const handleSave = () => {
    setIsSaved(true)
    setShowSavedTooltip(true)
    setTimeout(() => setShowSavedTooltip(false), 2000)
    
    toast({
      title: '🔖 Saved!',
      description: 'Post saved to your collection.',
      duration: 2000,
    })
  }

  // Safe date formatting helper to prevent "Invalid time value" errors
const formatPostDate = (dateInput: Date | string | undefined): string => {
  if (!dateInput) return 'Unknown time';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Unknown time';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Compact format like Reddit/Twitter
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'}`;
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'}`;
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    if (diffMonths < 12) return `${diffMonths} mo${diffMonths === 1 ? '' : 's'}`;
    return `${diffYears} yr${diffYears === 1 ? '' : 's'}`;
  } catch {
    return 'Unknown time';
  }
};

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

  // Auto-pause videos when scrolled out of view OR tab is hidden
  useEffect(() => {
    const videos = [
      { ref: videoRef, setPlaying: setIsPlaying },
      { ref: secondVideoRef, setPlaying: setIsSecondPlaying }
    ].filter(v => v.ref.current)

    if (videos.length === 0) return

    // Tab visibility handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videos.forEach(({ ref, setPlaying }) => {
          if (ref.current && !ref.current.paused) {
            ref.current.pause()
            setPlaying(false)
          }
        })
      }
    }

    // Intersection Observer - pause when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          videos.forEach(({ ref, setPlaying }) => {
            if (ref.current && ref.current.contains(entry.target as Node)) {
              if (!entry.isIntersecting && !ref.current.paused) {
                // Video scrolled out of view - pause it
                ref.current.pause()
                setPlaying(false)
              }
            }
          })
        })
      },
      { threshold: 0.5 } // Pause when less than 50% visible
    )

    // Observe all videos
    videos.forEach(({ ref }) => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Toggle play/pause on video click
  const toggleVideoPlay = (videoElement: HTMLVideoElement | null, setPlaying: (playing: boolean) => void) => {
    if (!videoElement) return

    if (videoElement.paused) {
      videoElement.play()
      setPlaying(true)
    } else {
      videoElement.pause()
      setPlaying(false)
    }
  }

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
          <BadgeCheck className="w-3 h-3 text-blue-500" />
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
                loading="lazy"
                className="w-full h-auto max-h-[512px] object-contain bg-black"
              />
            ) : post.media[0].file_type?.startsWith('video/') ? (
              <div className="relative cursor-pointer" onClick={() => toggleVideoPlay(videoRef.current, setIsPlaying)}>
                <video
                  ref={videoRef}
                  src={supabase.storage.from('media').getPublicUrl(post.media[0].file_path).data.publicUrl}
                  className="w-full h-auto max-h-[512px] object-contain bg-black"
                  playsInline
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-white/90 rounded-full p-4">
                      <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
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
                    loading="lazy"
                    className="w-full h-32 object-cover"
                  />
                ) : media.file_type?.startsWith('video/') ? (
                  <div className="relative cursor-pointer" onClick={() => toggleVideoPlay(secondVideoRef.current, setIsSecondPlaying)}>
                    <video
                      ref={index === 0 ? secondVideoRef : undefined}
                      src={supabase.storage.from('media').getPublicUrl(media.file_path).data.publicUrl}
                      className="w-full h-32 object-cover"
                      playsInline
                    />
                    {index === 0 && !isSecondPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-white/90 rounded-full p-2">
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
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
            <span>{formatPostDate(post.createdAt)} ago</span>
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
    <Card className="mb-2 bg-card/95 backdrop-blur-lg rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-200 max-w-[640px] mx-auto shadow-md shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:scale-[1.01]">
      <div className="flex flex-col">
        {/* Main Content */}
        <CardContent className="flex-1 p-5 min-w-0">
          {/* Clean Compact Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Left: Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={communityData?.icon || post.author.avatar} />
              <AvatarFallback className="text-sm bg-civic-green/10 text-civic-green font-semibold">
                {(communityData?.name || post.author.displayName || 'U')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Center: Content */}
            <div className="flex-1 min-w-0">
              {/* Community Post Layout */}
              {communityData ? (
                <div className="flex flex-col gap-0.5">
                  {/* Line 1: c/name */}
                  <Link 
                    to={`/c/${communityData.name}`} 
                    className="font-semibold text-sm hover:underline text-foreground"
                  >
                    c/{communityData.name}
                  </Link>
                  
                  {/* Line 2: Prefix/username • time • suggestion */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                    <Link
                      to={`/${post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/${post.author.username || 'anonymous'}`}
                      className="hover:underline"
                    >
                      {post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/{post.author.displayName || post.author.username || 'Anonymous'}
                    </Link>
                    <span>•</span>
                    <span>{formatPostDate(post.createdAt)} ago</span>
                    {/* Suggestion reason - example */}
                    <span className="hidden sm:inline">• Suggested for you</span>
                  </div>
                </div>
              ) : (
                /* User Post Layout (no community) */
                <div className="flex flex-col gap-0.5">
                  {/* Line 1: Prefix/username + verification */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/${post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/${post.author.username || 'anonymous'}`}
                      className="font-semibold text-sm hover:underline text-foreground"
                    >
                      {post.author.officialPosition ? 'g' : post.author.isVerified ? 'w' : 'u'}/{post.author.displayName || post.author.username || 'Anonymous'}
                    </Link>
                    
                    {/* Verified badge inline */}
                    {post.author.isVerified && (
                      <VerifiedBadge
                        size="xs"
                        positionTitle={post.author.officialPosition}
                      />
                    )}
                    
                    {/* Title icon with hover - if has position */}
                    {post.author.officialPosition && (
                      <Badge 
                        variant="outline"
                        className="text-xs px-1.5 py-0 border-civic-blue/30 text-civic-blue bg-civic-blue/5 max-w-[150px] truncate"
                        title={post.author.officialPosition}
                      >
                        {post.author.officialPosition}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Line 2: time • suggestion */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{formatPostDate(post.createdAt)} ago</span>
                    <span className="hidden sm:inline">• Popular near you</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Join Button + Three Dots Menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Join button - only for community posts and non-members */}
              {communityData && !isMember && onJoinCommunity && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onJoinCommunity(post.community!.id, post.community!.name);
                  }}
                  size="sm"
                  className="h-7 px-4 text-xs font-semibold bg-civic-blue hover:bg-civic-blue/90 text-white rounded-full"
                >
                  Join
                </Button>
              )}

              {/* Three dots menu */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 bg-sidebar-accent hover:bg-sidebar-accent/80 border border-border/50"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Follow post
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Show fewer posts like this
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSave}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    {isSaved ? 'Unsave' : 'Save'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <X className="mr-2 h-4 w-4" />
                    Hide
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Flag className="mr-2 h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Special Badges Row (Flair, Content Warning, etc.) */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {renderSpecialBadges()}
          </div>

          {/* Title and Content */}
          {isDetailView ? (
            <div>
              {/* Detail View: Title -> Media -> Description */}
              <h1 className="font-bold text-2xl mb-4 leading-tight hover:text-destructive transition-colors">{post.title}</h1>

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
              {/* Feed View: Title + Content Preview + Expand/Collapse */}
              <Link to={getPostLink()} className="block group">
                <h2 className="font-bold text-xl mb-3 group-hover:text-primary leading-tight">
                  {post.title}
                </h2>
              </Link>

              {/* Content Preview with Expand/Collapse */}
              {post.content && (
                <div className="mb-3">
                  <div className={`text-sm text-sidebar-muted-foreground ${!isContentExpanded ? 'line-clamp-3' : ''}`}>
                    <SafeContentRenderer content={post.content} />
                  </div>
                  {post.content.length > 300 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsContentExpanded(!isContentExpanded);
                      }}
                      className="text-primary hover:underline text-sm font-medium mt-1.5 inline-flex items-center gap-1"
                    >
                      {isContentExpanded ? (
                        <>
                          Show less
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          Read more
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Media shown in feed view */}
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
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              {/* Voting Buttons moved here */}
              <div className="flex items-center bg-sidebar-accent/30 rounded-full px-1.5 border border-border/30">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Upvote post: ${post.title}`}
                  aria-pressed={post.userVote === 'up'}
                  onClick={() => onVote(post.id, 'up')}
                  className={`h-9 w-9 p-0 rounded-full transition-all duration-300 ${
                    post.userVote === 'up' 
                      ? 'text-white bg-gradient-to-br from-civic-green to-civic-green/80 shadow-lg shadow-civic-green/30 animate-bounce-subtle' 
                      : 'hover:text-civic-green hover:bg-civic-green/10 hover:scale-110'
                  }`}
                >
                  <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
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
                  className={`h-9 w-9 p-0 rounded-full transition-all duration-300 ${
                    post.userVote === 'down' 
                      ? 'text-white bg-gradient-to-br from-civic-red to-civic-red/80 shadow-lg shadow-civic-red/30' 
                      : 'hover:text-civic-red hover:bg-civic-red/10 hover:scale-110'
                  }`}
                >
                  <ArrowDown className="w-5 h-5" strokeWidth={2.5} />
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="h-9 px-4 gap-2 text-muted-foreground hover:text-civic-blue hover:bg-civic-blue/10 rounded-lg transition-all duration-200 hover:scale-105" asChild>
                <Link to={getPostLink()}>
                  <MessageCircle className="w-5 h-5" strokeWidth={2} />
                  <span className="text-sm font-medium">{post.commentCount}</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" className="h-9 px-3 sm:px-4 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-105 group">
                <Share className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" strokeWidth={2} />
                <span className="hidden sm:inline text-sm font-medium">Share</span>
              </Button>
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-foreground bg-sidebar-accent hover:bg-sidebar-accent/80 rounded-lg transition-colors duration-200 border border-border/50">
                  <MoreHorizontal className="w-5 h-5" />
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