import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Check } from 'lucide-react';
import { Community } from '@/types';

interface CommunityCardProps {
  community: Community;
  onToggleFollow: (communityId: string) => void;
  showDescription?: boolean;
}

export const CommunityCard = ({ community, onToggleFollow, showDescription = true }: CommunityCardProps) => {
  const getCategoryColor = (category: Community['category']) => {
    switch (category) {
      case 'governance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'accountability': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'civic-education': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'discussion': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{community.displayName}</CardTitle>
            <Badge className={`mt-1 ${getCategoryColor(community.category)}`}>
              {community.category.replace('-', ' ')}
            </Badge>
          </div>
          <Button
            variant={community.isFollowing ? "secondary" : "default"}
            size="sm"
            onClick={() => onToggleFollow(community.id)}
            className="ml-2"
          >
            {community.isFollowing ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Following
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Follow
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showDescription && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {community.description}
          </p>
        )}
        <div className="flex items-center text-xs text-muted-foreground">
          <Users className="w-4 h-4 mr-1" />
          {community.memberCount.toLocaleString()} members
        </div>
      </CardContent>
    </Card>
  );
};