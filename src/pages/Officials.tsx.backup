import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Eye, Share2, Users, Target, MessageSquare, Calculator, Vote, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

const PAGE_SIZE = 20;

interface Official {
  id: string;
  name: string;
  position: string;
  level: string;
  constituency?: string;
  county?: string;
  party?: string;
  photo_url?: string;
}

interface OfficialWithStats extends Official {
  completedPromises: number;
  totalPromises: number;
}

const mainTabs = [
  { value: 'officials', label: 'Officials', icon: Users },
  { value: 'promises', label: 'Promise Monitor', icon: Target },
  { value: 'projects', label: 'Active Projects', icon: MessageSquare },
  { value: 'budget', label: 'Budget Watch', icon: Calculator },
  { value: 'elections', label: 'Elections Center', icon: Vote }
];

const levelTabs = [
  { value: 'all', label: 'All Officials' },
  { value: 'executive', label: 'President' },
  { value: 'governor', label: 'Cabinet & Governors' },
  { value: 'senator', label: 'Senators' },
  { value: 'mp', label: 'MPs' },
  { value: 'women_rep', label: 'Women Representatives' },
  { value: 'mca', label: 'MCAs' }
];

// Fetch filter options (parties and counties) - separate query for dropdowns
const fetchFilterOptions = async () => {
  const [partiesResult, countiesResult] = await Promise.all([
    supabase.from('officials').select('party').not('party', 'is', null),
    supabase.from('officials').select('county').not('county', 'is', null)
  ]);

  const parties = [...new Set((partiesResult.data || []).map(o => o.party))].filter(Boolean).sort() as string[];
  const counties = [...new Set((countiesResult.data || []).map(o => o.county))].filter(Boolean).sort() as string[];

  return { parties, counties };
};

// Fetch officials with server-side filtering and pagination
const fetchOfficials = async (
  page: number,
  search: string,
  level: string,
  party: string,
  county: string,
  sortBy: string
) => {
  let query = supabase
    .from('officials')
    .select('*', { count: 'exact' });

  // Server-side filtering
  if (search) {
    query = query.or(`name.ilike.%${search}%,position.ilike.%${search}%,county.ilike.%${search}%`);
  }
  if (level !== 'all') {
    query = query.eq('level', level as 'executive' | 'governor' | 'mca' | 'mp' | 'senator' | 'women_rep');
  }
  if (party !== 'all') {
    query = query.eq('party', party);
  }
  if (county !== 'all') {
    query = query.eq('county', county);
  }

  // Server-side sorting
  if (sortBy === 'name') {
    query = query.order('name', { ascending: true });
  } else {
    query = query.order('name', { ascending: true });
  }

  // Pagination
  const from = 0;
  const to = (page + 1) * PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: officialsData, error, count } = await query;

  if (error) throw error;

  // Fetch promise stats for these officials
  const officialIds = (officialsData || []).map(o => o.id);
  
  if (officialIds.length === 0) {
    return { officials: [], totalCount: 0, hasMore: false };
  }

  const { data: promisesData } = await supabase
    .from('development_promises')
    .select('official_id, status')
    .in('official_id', officialIds);

  // Calculate stats per official
  const statsMap = new Map<string, { completed: number; total: number }>();
  (promisesData || []).forEach(promise => {
    const current = statsMap.get(promise.official_id) || { completed: 0, total: 0 };
    current.total++;
    if (promise.status === 'completed') current.completed++;
    statsMap.set(promise.official_id, current);
  });

  const officialsWithStats: OfficialWithStats[] = (officialsData || []).map(official => ({
    ...official,
    completedPromises: statsMap.get(official.id)?.completed || 0,
    totalPromises: statsMap.get(official.id)?.total || 0
  }));

  // Client-side sort by performance/promises if needed
  if (sortBy === 'performance') {
    officialsWithStats.sort((a, b) => {
      const aPerf = a.totalPromises > 0 ? (a.completedPromises / a.totalPromises) : 0;
      const bPerf = b.totalPromises > 0 ? (b.completedPromises / b.totalPromises) : 0;
      return bPerf - aPerf;
    });
  } else if (sortBy === 'promises') {
    officialsWithStats.sort((a, b) => b.totalPromises - a.totalPromises);
  }

  return {
    officials: officialsWithStats,
    totalCount: count || 0,
    hasMore: (count || 0) > (page + 1) * PAGE_SIZE
  };
};

const Officials = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedParty, setSelectedParty] = useState('all');
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'promises'>('name');
  const [selectedTab, setSelectedTab] = useState('officials');
  const [page, setPage] = useState(0);

  // Debounce search to prevent excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Reset page when filters change
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['officials-filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch officials with pagination
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['officials', page, debouncedSearch, selectedLevel, selectedParty, selectedCounty, sortBy],
    queryFn: () => fetchOfficials(page, debouncedSearch, selectedLevel, selectedParty, selectedCounty, sortBy),
    staleTime: 60 * 1000, // 1 minute
  });

  const officials = data?.officials || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = data?.hasMore || false;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getPerformanceRating = (percentage: number) => {
    if (percentage >= 75) return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-600', icon: TrendingUp };
    if (percentage >= 50) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600', icon: TrendingUp };
    if (percentage >= 25) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600', icon: TrendingDown };
    return { label: 'Poor', color: 'bg-red-500', textColor: 'text-red-600', icon: TrendingDown };
  };

  const formatLocation = (official: Official) => {
    if (official.level === 'executive') return 'Kenya';
    if (official.constituency) return `${official.constituency}, ${official.county}`;
    if (official.county) return official.county;
    return 'Kenya';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Government Tracker</h1>
          <p className="text-muted-foreground">Hold leaders accountable • Track promises • Monitor performance</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            {mainTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs lg:text-sm flex items-center gap-1">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="officials" className="mt-6">
            <div className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, position, or region..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(0);
                        }}
                        className="pl-10"
                      />
                      {isFetching && searchQuery !== debouncedSearch && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Select value={selectedParty} onValueChange={(v) => handleFilterChange(setSelectedParty, v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Parties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Parties</SelectItem>
                          {(filterOptions?.parties || []).map(party => (
                            <SelectItem key={party} value={party}>{party}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedCounty} onValueChange={(v) => handleFilterChange(setSelectedCounty, v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Counties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Counties</SelectItem>
                          {(filterOptions?.counties || []).map(county => (
                            <SelectItem key={county} value={county}>{county}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={(value: 'name' | 'performance' | 'promises') => {
                        setSortBy(value);
                        setPage(0);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name (A-Z)</SelectItem>
                          <SelectItem value="performance">Performance (High-Low)</SelectItem>
                          <SelectItem value="promises">Total Promises</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="text-sm text-muted-foreground flex items-center justify-center">
                        Showing {officials.length} of {totalCount} officials
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Level Tabs */}
              <Tabs value={selectedLevel} onValueChange={(v) => handleFilterChange(setSelectedLevel, v)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                  {levelTabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-xs lg:text-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={selectedLevel} className="mt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading officials...</span>
                    </div>
                  ) : officials.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <div className="text-muted-foreground">
                          No officials found matching your criteria.
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {officials.map((official) => {
                          const completionPercentage = getCompletionPercentage(official.completedPromises, official.totalPromises);
                          const performanceRating = getPerformanceRating(completionPercentage);
                          const PerformanceIcon = performanceRating.icon;

                          return (
                            <Card key={official.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                              <CardHeader className="pb-4">
                                <div className="flex items-start gap-4">
                                  <Avatar className="w-16 h-16">
                                    <AvatarImage src={official.photo_url} />
                                    <AvatarFallback className="text-lg">
                                      {getInitials(official.name)}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                                          {official.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{official.position}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {formatLocation(official)}
                                        </p>
                                      </div>
                                    </div>
                                    {/* Performance Badge */}
                                    {official.totalPromises > 0 && (
                                      <div className="mt-2">
                                        <Badge className={`${performanceRating.color} text-white text-xs`}>
                                          <PerformanceIcon className="w-3 h-3 mr-1" />
                                          {performanceRating.label}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0">
                                <div className="space-y-4">
                                  {/* Promises Stats */}
                                  <div>
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm text-muted-foreground">Promises Completed</span>
                                      <span className="font-bold text-lg">
                                        {official.completedPromises} / {official.totalPromises}
                                      </span>
                                    </div>
                                    <Progress
                                      value={completionPercentage}
                                      className="h-2"
                                    />
                                    <div className="text-xs text-muted-foreground mt-1 text-right">
                                      {completionPercentage}% completion rate
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => navigate(`/officials/${official.id}`)}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View Profile
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const url = `${window.location.origin}/g/${official.id}`;
                                        navigator.clipboard.writeText(url);
                                      }}
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Load More Button */}
                      {hasMore && (
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            onClick={() => setPage(p => p + 1)}
                            disabled={isFetching}
                          >
                            {isFetching ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              `Load More (${totalCount - officials.length} remaining)`
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="promises" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Promise Monitor</h3>
                <p className="text-muted-foreground">Track government promises and their progress</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
                <p className="text-muted-foreground">Monitor ongoing government projects</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Budget Watch</h3>
                <p className="text-muted-foreground">Track government spending</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="elections" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <Vote className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Elections Center</h3>
                <p className="text-muted-foreground">Stay informed about elections</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Officials;
