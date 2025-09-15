import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, MessageCircle, Share, Verified, MoreHorizontal, Bookmark } from 'lucide-react';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
  post: Post;
  onVote: (postId: string, vote: 'up' | 'down') => void;
  isDetailView?: boolean;
  viewMode?: 'card' | 'compact';
}

export const PostCard = ({ post, onVote, isDetailView = false, viewMode = 'card' }: PostCardProps) => {
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
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (viewMode === 'compact') {
    return (
      <div className="flex hover:bg-sidebar-accent/50 transition-colors border-b border-sidebar-border/50">
        {/* Vote Column */}
        <div className="flex flex-col items-center p-2 w-12 bg-sidebar-background/50">
          <Button
            variant="ghost"
            size="sm"
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
            onClick={() => onVote(post.id, 'down')}
            className={`h-6 w-6 p-0 ${post.userVote === 'down' ? 'text-civic-red bg-civic-red/10' : 'text-sidebar-muted-foreground hover:text-civic-red'}`}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          <div className="flex items-center space-x-2 text-xs text-sidebar-muted-foreground mb-1">
            <Link to={`/c/${post.community.name}`} className="hover:underline font-medium">
              c/{post.community.name}
            </Link>
            <span>•</span>
            <span>Posted by</span>
            <Link to={`/u/${post.author.displayName}`} className="hover:underline">
              u/{post.author.displayName}
            </Link>
            <span>•</span>
            <span>{formatDistanceToNow(post.createdAt)} ago</span>
          </div>
          
          <Link to={`/post/${post.id}`} className="block group">
            <h3 className="font-medium text-sidebar-foreground group-hover:text-primary line-clamp-2 mb-1">
              {post.title}
            </h3>
          </Link>

          <div className="flex items-center space-x-4 mt-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-sidebar-muted-foreground hover:bg-sidebar-accent" asChild>
              <Link to={`/post/${post.id}`}>
                <MessageCircle className="w-3 h-3 mr-1" />
                {post.commentCount} comments
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
    <Card className="mb-2 bg-sidebar-background border-sidebar-border hover:border-sidebar-ring transition-colors">
      <div className="flex">
        {/* Vote Column */}
        <div className="flex flex-col items-center p-3 w-12 bg-sidebar-background/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(post.id, 'up')}
            className={`h-8 w-8 p-0 ${post.userVote === 'up' ? 'text-civic-green bg-civic-green/10' : 'text-sidebar-muted-foreground hover:text-civic-green hover:bg-civic-green/10'}`}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-sidebar-foreground py-1">
            {formatNumber(getVoteScore())}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(post.id, 'down')}
            className={`h-8 w-8 p-0 ${post.userVote === 'down' ? 'text-civic-red bg-civic-red/10' : 'text-sidebar-muted-foreground hover:text-civic-red hover:bg-civic-red/10'}`}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content */}
        <CardContent className="flex-1 p-3">
          {/* Header */}
          <div className="flex items-center space-x-2 text-xs text-sidebar-muted-foreground mb-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="text-xs">{post.author.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <Link to={`/c/${post.community.name}`} className="hover:underline font-medium">
              c/{post.community.name}
            </Link>
            <span>•</span>
            <span>Posted by</span>
            <Link to={`/u/${post.author.displayName}`} className="hover:underline">
              u/{post.author.displayName}
            </Link>
            {post.author.isVerified && (
              <Verified className="w-3 h-3 text-blue-500" />
            )}
            {post.author.role && (
              <Badge variant="outline" className={`text-xs px-1 py-0 ${getRoleColor(post.author.role)}`}>
                {post.author.role}
              </Badge>
            )}
            <span>•</span>
            <span>{formatDistanceToNow(post.createdAt)} ago</span>
          </div>
          
          {/* Title and Content */}
          {isDetailView ? (
            <div>
              <h1 className="font-semibold text-xl mb-3 text-sidebar-foreground leading-tight">{post.title}</h1>
              <div className="text-sidebar-foreground mb-4">
                {post.content}
              </div>
            </div>
          ) : (
            <Link to={`/post/${post.id}`} className="block group">
              <h2 className="font-semibold text-lg mb-2 text-sidebar-foreground group-hover:text-primary leading-tight line-clamp-3">
                {post.title}
              </h2>
              {post.content && (
                <p className="text-sm text-sidebar-muted-foreground mb-3 line-clamp-3">
                  {post.content}
                </p>
              )}
            </Link>
          )}
          
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs bg-sidebar-accent/50 text-sidebar-accent-foreground border-sidebar-border">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sidebar-muted-foreground hover:bg-sidebar-accent" asChild>
              <Link to={`/post/${post.id}`}>
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.commentCount} Comments
              </Link>
            </Button>
            
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sidebar-muted-foreground hover:bg-sidebar-accent">
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>
            
            <Button variant="ghost" size="sm" className="h-8 px-2 text-sidebar-muted-foreground hover:bg-sidebar-accent">
              <Bookmark className="w-4 h-4 mr-1" />
              Save
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-sidebar-muted-foreground hover:bg-sidebar-accent">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-sidebar-background border-sidebar-border">
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