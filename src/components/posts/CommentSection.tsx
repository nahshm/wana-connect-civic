import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, ArrowDown, MessageSquare, MoreHorizontal, Reply, Flag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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

  const getVoteButtonVariant = (voteType: 'up' | 'down') => {
    if (comment.userVote === voteType) {
      return voteType === 'up' ? 'default' : 'destructive';
    }
    return 'ghost';
  };

  const maxDepth = 6;
  const shouldShowReplies = depth < maxDepth && comment.replies && comment.replies.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''}`}>
      <Card className="mb-3">
        <CardContent className="p-4">
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback>{comment.author.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author.displayName}</span>
                <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
                {comment.author.isVerified && (
                  <Badge variant="secondary" className="h-4 text-xs">
                    {comment.author.role === 'official' ? 'Official' : 'Verified'}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-6 px-2 text-xs"
              >
                [{isCollapsed ? '+' : '−'}]
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!isCollapsed && (
            <>
              {/* Comment Content */}
              <div className="mb-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>

              {/* Comment Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant={getVoteButtonVariant('up')}
                  size="sm"
                  onClick={() => handleVote('up')}
                  className="h-7 px-2"
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {comment.upvotes}
                </Button>
                <Button
                  variant={getVoteButtonVariant('down')}
                  size="sm"
                  onClick={() => handleVote('down')}
                  className="h-7 px-2"
                >
                  <ArrowDown className="h-3 w-3 mr-1" />
                  {comment.downvotes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="h-7 px-2"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              </div>

              {/* Reply Form */}
              {isReplying && (
                <div className="mt-3 space-y-2">
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
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {shouldShowReplies && !isCollapsed && (
        <div className="space-y-2">
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
      <div className="space-y-2">
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