import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, ArrowDown, MessageSquare, MoreHorizontal, Reply, Flag, Share2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CommentAwardDisplay } from './CommentAwardDisplay';
import { CommentAwardButton } from './CommentAwardButton';
import { useAuth } from '@/contexts/AuthContext';
import { SafeContentRenderer } from './SafeContentRenderer';
import type { Comment, User } from '@/types';

interface CommentSectionProps {
  postId: string;
  comments?: Comment[];
  onAddComment?: (content: string, parentId?: string) => void;
  onVoteComment?: (commentId: string, vote: 'up' | 'down') => void;
}

interface CommentItemProps {
  comment: Comment;
  onReply?: (content: string, parentId: string) => void;
  onVote?: (commentId: string, vote: 'up' | 'down') => void;
  depth?: number;
}

const CommentItem = ({ comment, onReply, onVote, depth = 0 }: CommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply?.(replyContent, comment.id);
      setReplyContent('');
      setIsReplying(false);
      toast({
        title: "Reply Posted",
        description: "Your reply has been added.",
      });
    }
  };

  const handleVote = (vote: 'up' | 'down') => {
    onVote?.(comment.id, vote);
  };

  const getVoteScore = () => comment.upvotes - comment.downvotes;

  const maxDepth = 6;
  const shouldShowReplies = depth < maxDepth && comment.replies && comment.replies.length > 0;

  return (
    <div className={`relative ${depth > 0 ? 'ml-6' : ''}`}>
      {/* Thread line with BOLD collapse button for nested comments */}
      {depth > 0 && (
        <>
          {/* Vertical line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

          {/* Horizontal connector curve */}
          <div className="absolute left-0 top-4 w-3 h-px bg-border" />

          {/* BOLD Collapse button ON the line */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute left-[-5px] top-[10px] w-4 h-4 bg-background border-2 border-foreground/40 rounded-sm flex items-center justify-center text-xs font-bold leading-none text-foreground hover:border-foreground hover:bg-accent z-10 shadow-sm"
          >
            {isCollapsed ? '+' : '−'}
          </button>
        </>
      )}

      <div className={`py-2 ${depth > 0 ? 'pl-4' : 'pl-2'} pr-2 hover:bg-accent/30 rounded-sm transition-colors`}>
        {/* Compact Header - Avatar + Username + Time */}
        <div className="flex items-center gap-1.5 text-xs mb-1.5">
          <Avatar className="h-5 w-5">
            <AvatarImage src={comment.author.avatar} />
            <AvatarFallback>{(comment.author.displayName || comment.author.username || '?')[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{comment.author.displayName || comment.author.username}</span>
          {comment.author.isVerified && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] leading-none">
              {comment.author.role === 'official' ? 'Official' : '✓'}
            </Badge>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true }).replace('about ', '').replace(' ago', '')}
          </span>

          {/* BOLD Collapse button for top-level comments (no thread line) */}
          {depth === 0 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-foreground hover:text-primary px-1 text-xs font-bold border-2 border-foreground/40 rounded-sm w-5 h-4 flex items-center justify-center leading-none hover:border-foreground"
            >
              {isCollapsed ? '+' : '−'}
            </button>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Comment Content */}
            <SafeContentRenderer
              content={comment.content || ''}
              className="mb-1.5 text-sm leading-snug"
            />

            {/* Comment Awards Display */}
            {comment.awards && comment.awards.length > 0 && (
              <div className="mb-1">
                <CommentAwardDisplay awards={comment.awards} size="sm" />
              </div>
            )}

            {/* Inline Actions - Vote + Reply + Award + Share */}
            <div className="flex items-center gap-1 mt-1">
              {/* Upvote */}
              <button
                onClick={() => handleVote('up')}
                className={`p-0.5 hover:bg-accent rounded transition-colors ${comment.userVote === 'up' ? 'text-civic-green' : 'text-muted-foreground hover:text-civic-green'
                  }`}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>

              {/* Vote Score */}
              <span className={`text-xs font-medium min-w-[24px] text-center ${comment.userVote === 'up' ? 'text-civic-green' :
                comment.userVote === 'down' ? 'text-civic-red' :
                  'text-foreground'
                }`}>
                {getVoteScore()}
              </span>

              {/* Downvote */}
              <button
                onClick={() => handleVote('down')}
                className={`p-0.5 hover:bg-accent rounded transition-colors ${comment.userVote === 'down' ? 'text-civic-red' : 'text-muted-foreground hover:text-civic-red'
                  }`}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>

              {/* Reply */}
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs px-1.5 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded transition-colors font-medium"
              >
                <Reply className="h-3 w-3 inline mr-0.5" />
                Reply
              </button>

              {/* Award */}
              <div className="flex items-center">
                <CommentAwardButton
                  commentId={comment.id}
                  userRole={user?.role as any}
                  size="sm"
                />
              </div>

              {/* Share */}
              <button className="text-xs px-1.5 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded transition-colors font-medium">
                <Share2 className="h-3 w-3 inline mr-0.5" />
                Share
              </button>

              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded transition-colors ml-auto">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Reply Form */}
            {isReplying && (
              <div className="mt-2 space-y-2 pl-2 border-l-2 border-border">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                    className="h-7"
                  >
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                    className="h-7"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nested Replies */}
      {shouldShowReplies && !isCollapsed && (
        <div>
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onVote={onVote}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentSection = ({ postId, comments = [], onAddComment, onVoteComment }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'best' | 'top' | 'new'>('best');
  const { toast } = useToast();

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment?.(newComment);
      setNewComment('');
      toast({
        title: "Comment Added",
        description: "Your comment has been posted.",
      });
    }
  };

  const handleReply = (content: string, parentId: string) => {
    onAddComment?.(content, parentId);
  };

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'new':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'best':
      default:
        // Wilson score interval for "best" sorting
        const scoreA = a.upvotes + a.downvotes > 0 ? a.upvotes / (a.upvotes + a.downvotes) : 0;
        const scoreB = b.upvotes + b.downvotes > 0 ? b.upvotes / (b.upvotes + b.downvotes) : 0;
        return scoreB - scoreA;
    }
  });

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts?"
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {newComment.length}/10,000 characters
              </div>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort Options */}
      {comments.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <div className="flex gap-1">
            {(['best', 'top', 'new'] as const).map((option) => (
              <Button
                key={option}
                variant={sortBy === option ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSortBy(option)}
                className="h-7 px-3 text-xs"
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Comments List */}
      <div>
        {sortedComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-semibold mb-1">No comments yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to share your thoughts on this post.
            </p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onVote={onVoteComment}
            />
          ))
        )}
      </div>
    </div>
  );
};