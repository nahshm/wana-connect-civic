import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  LayoutGrid,
  List,
  Check
} from 'lucide-react';

export type FeedFilter = 'all' | 'following' | 'governance' | 'accountability' | 'civic-education' | 'discussion';

interface FeedHeaderProps {
  sortBy: 'hot' | 'new' | 'top' | 'rising';
  onSortChange: (sort: 'hot' | 'new' | 'top' | 'rising') => void;
  viewMode: 'card' | 'compact';
  onViewModeChange: (mode: 'card' | 'compact') => void;
  // Included for compatibility, even if not displayed in simple mode
  filterBy?: FeedFilter;
  onFilterChange?: (filter: FeedFilter) => void;
  isVerifiedOnly?: boolean;
  onVerifiedOnlyChange?: (value: boolean) => void;
  className?: string;
}

export const FeedHeader = ({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  className
}: FeedHeaderProps) => {

  const sortOptions = [
    { value: 'hot', label: 'Best' },
    { value: 'new', label: 'New' },
    { value: 'top', label: 'Top' },
    { value: 'rising', label: 'Rising' },
  ] as const;

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Best';

  return (
    <div className={cn(
      "bg-background border-b border-border px-4 py-0 sticky top-0 z-40 w-full transition-all duration-200",
      className
    )}>
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto h-8">
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 gap-1 text-sm font-bold tracking-tight hover:bg-sidebar-accent transition-colors"
              >
                {currentSortLabel}
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32 bg-background border-border">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(
                    "flex items-center justify-between cursor-pointer",
                    sortBy === option.value && "font-bold text-foreground"
                  )}
                >
                  {option.label}
                  {sortBy === option.value && <Check className="w-4 h-4 ml-2" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange(viewMode === 'card' ? 'compact' : 'card')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            title={viewMode === 'card' ? "Switch to Compact View" : "Switch to Card View"}
          >
            {viewMode === 'card' ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <List className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};