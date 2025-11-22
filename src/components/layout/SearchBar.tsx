import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import { SearchQuickResults } from './SearchQuickResults';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, filters: SearchFilters) => void;
  className?: string;
}

interface SearchFilters {
  type: 'all' | 'posts' | 'communities' | 'users';
  timeframe: 'all' | 'day' | 'week' | 'month' | 'year';
  sort: 'relevance' | 'recent' | 'popular';
  categories: string[];
}

const defaultFilters: SearchFilters = {
  type: 'all',
  timeframe: 'all',
  sort: 'relevance',
  categories: []
};

const CATEGORIES = [
  { id: 'governance', label: 'Governance', color: 'bg-civic-blue/10 text-civic-blue' },
  { id: 'accountability', label: 'Accountability', color: 'bg-civic-red/10 text-civic-red' },
  { id: 'civic-education', label: 'Civic Education', color: 'bg-civic-green/10 text-civic-green' },
  { id: 'discussion', label: 'Discussion', color: 'bg-civic-orange/10 text-civic-orange' }
];

export const SearchBar = ({ placeholder = "Search discussions, communities...", onSearch, className }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Use the new search hook for quick results
  const { data: quickResults, isLoading } = useSearch({
    query,
    type: 'all',
    limit: 5
  });

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (query.trim()) {
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);

      // Call optional callback
      onSearch?.(query, filters);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.timeframe !== 'all' ||
    filters.sort !== 'relevance' ||
    filters.categories.length > 0;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className="pl-10 pr-4"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setShowResults(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Search Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium mb-2 block">Content Type</label>
                <div className="flex gap-2">
                  {(['all', 'posts', 'communities', 'users'] as const).map(type => (
                    <Button
                      key={type}
                      variant={filters.type === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilter('type', type)}
                      className="text-xs"
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Time Range</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'day', 'week', 'month', 'year'] as const).map(time => (
                    <Button
                      key={time}
                      variant={filters.timeframe === time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilter('timeframe', time)}
                      className="text-xs"
                    >
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  {(['relevance', 'recent', 'popular'] as const).map(sort => (
                    <Button
                      key={sort}
                      variant={filters.sort === sort ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilter('sort', sort)}
                      className="text-xs"
                    >
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(category => (
                    <Badge
                      key={category.id}
                      variant={filters.categories.includes(category.id) ? 'default' : 'outline'}
                      className={`cursor-pointer text-xs ${filters.categories.includes(category.id)
                          ? 'bg-primary text-primary-foreground'
                          : category.color
                        }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={() => handleSearch()} size="sm">
          Search
        </Button>
      </div>

      {/* Quick Search Results Dropdown */}
      {showResults && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <SearchQuickResults
              results={quickResults}
              query={query}
              onClose={() => setShowResults(false)}
            />
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Type: {filters.type}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('type', 'all')}
              />
            </Badge>
          )}
          {filters.timeframe !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Time: {filters.timeframe}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('timeframe', 'all')}
              />
            </Badge>
          )}
          {filters.sort !== 'relevance' && (
            <Badge variant="secondary" className="text-xs">
              Sort: {filters.sort}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('sort', 'relevance')}
              />
            </Badge>
          )}
          {filters.categories.map(categoryId => {
            const category = CATEGORIES.find(c => c.id === categoryId);
            return category ? (
              <Badge key={categoryId} variant="secondary" className="text-xs">
                {category.label}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => toggleCategory(categoryId)}
                />
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};