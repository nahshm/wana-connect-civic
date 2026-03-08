import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MessageSquare, MoreHorizontal, Reply, Flag, Share2, LogIn } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CommentAwardDisplay } from './CommentAwardDisplay';
import { CommentAwardButton } from './CommentAwardButton';
import { CommentInput } from './CommentInput';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { SafeContentRenderer } from './SafeContentRenderer';
import type { Comment } from '@/types';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleReply = (content: string) => {
    onReply?.(content, comment.id);
    setIsReplying(false);
    toast({ title: "Reply posted" });
  };

  const handleVote = (vote: 'up' | 'down') => {
    onVote?.(comment.id, vote);
  };

  const getVoteScore = () => comment.upvotes - comment.downvotes;
  const maxDepth = 6;
  const shouldShowReplies = depth < maxDepth && comment.replies && comment.replies.length > 0;

  // Thread colors for visual depth
  const threadColors = [
    'border-primary/30',
    'border-blue-400/30',
    'border-green-400/30',
    'border-amber-400/30',
    'border-purple-400/30',
    'border-pink-400/30',
  ];
  const threadColor = threadColors[depth % threadColors.length];

  return (
    <div className={`relative ${depth > 0 ? 'ml-4 pl-3' : ''}`}>
      {/* Thread line for nested */}
      {depth > 0 && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full border-l-2 ${threadColor} hover:border-primary cursor-pointer transition-colors`}
          aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}
        />
      )}

      <div className="py-2">
        {/* Header */}
        <div className="flex items-center gap-1.5 text-xs mb-1">
          <Avatar className="h-5 w-5">
            <AvatarImage src={comment.author.avatar} />
            <AvatarFallback className="text-[10px]">
              {(comment.author.displayName || comment.author.username || '?')[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground hover:underline cursor-pointer">
            {comment.author.displayName || comment.author.username}
          </span>
          {comment.author.isVerified && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] leading-none">
              {comment.author.role === 'official' ? 'Official' : '✓'}
            </Badge>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true }).replace('about ', '')}
          </span>

          {/* Collapse for top-level */}
          {depth === 0 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-1 text-muted-foreground hover:text-foreground text-[10px] font-mono"
            >
              [{isCollapsed ? '+' : '−'}]
            </button>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Content */}
            <SafeContentRenderer
              content={comment.content || ''}
              className="text-sm leading-relaxed text-foreground/90 mb-1.5"
            />

            {/* Awards */}
            {comment.awards && comment.awards.length > 0 && (
              <div className="mb-1">
                <CommentAwardDisplay awards={comment.awards} size="sm" />
              </div>
            )}

            {/* Actions bar */}
            <div className="flex items-center gap-0.5 -ml-1">
              {/* Vote group */}
              <div className="flex items-center rounded-full bg-muted/50 hover:bg-muted transition-colors">
                <button
                  onClick={() => handleVote('up')}
                  className={`p-1 rounded-l-full transition-colors ${
                    comment.userVote === 'up' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <span className={`text-xs font-semibold min-w-[20px] text-center ${
                  comment.userVote === 'up' ? 'text-primary' :
                  comment.userVote === 'down' ? 'text-destructive' : 'text-foreground'
                }`}>
                  {getVoteScore()}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  className={`p-1 rounded-r-full transition-colors ${
                    comment.userVote === 'down' ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                  }`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Reply */}
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors font-medium"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>

              {/* Award */}
              <CommentAwardButton
                commentId={comment.id}
                userRole={user?.role as any}
                size="sm"
              />

              {/* Share */}
              <button className="flex items-center gap-1 text-xs px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors font-medium">
                <Share2 className="h-3 w-3" />
              </button>

              {/* More */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Inline reply input */}
            {isReplying && (
              <div className="mt-2 mb-1">
                <CommentInput
                  placeholder={`Reply to ${comment.author.displayName || comment.author.username}...`}
                  onSubmit={handleReply}
                  autoFocus
                  className="border-border/60"
                />
                <button
                  onClick={() => setIsReplying(false)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-1 ml-1"
                >
                  Cancel
                </button>
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
  const [sortBy, setSortBy] = useState<'best' | 'top' | 'new'>('best');
  const { user } = useAuth();
  const authModal = useAuthModal();

  const handleAddComment = (content: string) => {
    onAddComment?.(content);
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
        const scoreA = a.upvotes + a.downvotes > 0 ? a.upvotes / (a.upvotes + a.downvotes) : 0;
        const scoreB = b.upvotes + b.downvotes > 0 ? b.upvotes / (b.upvotes + b.downvotes) : 0;
        return scoreB - scoreA;
    }
  });

  return (
    <div className="space-y-3">
      {/* Minimalist comment input */}
      {!user ? (
        <button
          onClick={() => authModal.open('login')}
          className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:border-primary/30 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign in to comment
        </button>
      ) : (
        <CommentInput
          placeholder="Add a comment..."
          onSubmit={handleAddComment}
        />
      )}

      {/* Sort + count bar */}
      {comments.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-foreground">
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-0.5">
            {(['best', 'top', 'new'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  sortBy === option
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments list */}
      {!user ? (
        <div className="text-center py-8">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground mb-3">Sign in to view and join the discussion</p>
          <Button size="sm" onClick={() => authModal.open('login')}>
            <LogIn className="h-3.5 w-3.5 mr-1.5" />
            Sign In
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {sortedComments.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No comments yet. Be the first to share your thoughts.
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
      )}
    </div>
  );
};
