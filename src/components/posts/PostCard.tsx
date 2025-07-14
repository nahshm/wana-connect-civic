import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, MessageCircle, Share, Verified } from 'lucide-react';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onVote: (postId: string, vote: 'up' | 'down') => void;
}

export const PostCard = ({ post, onVote }: PostCardProps) => {
  const getVoteScore = () => post.upvotes - post.downvotes;
  
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'official': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'expert': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'journalist': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{post.author.displayName}</span>
              {post.author.isVerified && (
                <Verified className="w-4 h-4 text-blue-500" />
              )}
              {post.author.role && (
                <Badge className={`text-xs ${getRoleColor(post.author.role)}`}>
                  {post.author.role}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>c/{post.community.name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(post.createdAt)} ago</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <h3 className="font-semibold text-lg mb-2 leading-tight">{post.title}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{post.content}</p>
        
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVote(post.id, 'up')}
              className={`h-8 px-2 ${post.userVote === 'up' ? 'text-orange-500 bg-orange-50 dark:bg-orange-950' : ''}`}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <span className="font-medium text-sm min-w-[2rem] text-center">
              {getVoteScore()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVote(post.id, 'down')}
              className={`h-8 px-2 ${post.userVote === 'down' ? 'text-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8">
            <MessageCircle className="w-4 h-4 mr-1" />
            {post.commentCount}
          </Button>
          
          <Button variant="ghost" size="sm" className="h-8">
            <Share className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};