import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Flame,
  TrendingUp,
  Clock,
  Star,
  Filter,
  MoreHorizontal,
  List,
  SquareIcon
} from 'lucide-react';
import { useState } from 'react';

interface FeedHeaderProps {
  sortBy: 'hot' | 'new' | 'top' | 'rising';
  onSortChange: (sort: 'hot' | 'new' | 'top' | 'rising') => void;
  viewMode: 'card' | 'compact';
  onViewModeChange: (mode: 'card' | 'compact') => void;
}

export const FeedHeader = ({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange
}: FeedHeaderProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    { value: 'hot', label: 'Hot', icon: Flame },
    { value: 'new', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: Star },
    { value: 'rising', label: 'Rising', icon: TrendingUp },
  ] as const;

  const getSortIcon = (sort: string) => {
    const option = sortOptions.find(opt => opt.value === sort);
    return option?.icon || Flame;
  };

  const SortIcon = getSortIcon(sortBy);

  return (
    <div className="bg-sidebar-background border-b border-sidebar-border px-4 py-3 sticky top-16 z-40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {/* Sort Buttons */}
          <div className="flex items-center space-x-1 bg-background rounded-lg p-1 min-w-max">
            {sortOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={sortBy === value ? "default" : "ghost"}
                size="sm"
                onClick={() => onSortChange(value)}
                className={`h-8 px-3 ${sortBy === value
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-background rounded-lg p-1">
            <Button
              variant={viewMode === 'card' ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange('card')}
              className={`h-8 px-2 ${viewMode === 'card'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-muted-foreground hover:text-sidebar-foreground'
                }`}
            >
              <SquareIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange('compact')}
              className={`h-8 px-2 ${viewMode === 'compact'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-muted-foreground hover:text-sidebar-foreground'
                }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-sidebar-muted-foreground hover:text-sidebar-foreground"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-sidebar-background border-sidebar-border">
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  All Communities
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Following Only
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Government
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Accountability
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Civic Education
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-sidebar-muted-foreground hover:text-sidebar-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-sidebar-background border-sidebar-border">
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Hide read posts
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Show NSFW content
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Customize feed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};