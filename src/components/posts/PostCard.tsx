import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, MessageCircle, Share, Verified } from 'lucide-react';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onVote: (postId: string, vote: 'up' | 'down') => void;
  isDetailView?: boolean;
}

export const PostCard = ({ post, onVote, isDetailView = false }: PostCardProps) => {
  const getVoteScore = () => post.upvotes - post.downvotes;
  
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'official': return 'bg-civic-blue/10 text-civic-blue border-civic-blue/20';
      case 'expert': return 'bg-civic-green/10 text-civic-green border-civic-green/20';
      case 'journalist': return 'bg-civic-orange/10 text-civic-orange border-civic-orange/20';
      default: return 'bg-muted text-muted-foreground';
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
                <Badge variant="outline" className={`text-xs ${getRoleColor(post.author.role)}`}>
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
        {isDetailView ? (
          <div>
            <h3 className="font-semibold text-lg mb-2 leading-tight">{post.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {post.content}
            </p>
          </div>
        ) : (
          <Link to={`/post/${post.id}`} className="block hover:bg-accent/5 -m-4 p-4 rounded-lg transition-colors">
            <h3 className="font-semibold text-lg mb-2 leading-tight">{post.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {post.content}
            </p>
          </Link>
        )}
        
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
              className={`h-8 px-2 ${post.userVote === 'up' ? 'text-civic-green bg-civic-green/10' : ''}`}
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
              className={`h-8 px-2 ${post.userVote === 'down' ? 'text-civic-red bg-civic-red/10' : ''}`}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8" asChild>
            <Link to={`/post/${post.id}`}>
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.commentCount}
            </Link>
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