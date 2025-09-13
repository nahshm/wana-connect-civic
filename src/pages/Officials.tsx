import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Calendar, DollarSign, Users, Building } from 'lucide-react';

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

interface DevelopmentPromise {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'completed' | 'ongoing' | 'not_started' | 'cancelled';
  budget_allocated?: number;
  budget_used?: number;
  funding_source?: string;
  contractor?: string;
  progress_percentage: number;
  location?: string;
  beneficiaries_count?: number;
  official: Official;
}

const levelHierarchy = [
  { value: 'executive', label: 'Executive', icon: '🏛️' },
  { value: 'governor', label: 'Governors', icon: '🏢' },
  { value: 'senator', label: 'Senate', icon: '⚖️' },
  { value: 'mp', label: 'MPs', icon: '🏛️' },
  { value: 'women_rep', label: 'Women Reps', icon: '👩‍💼' },
  { value: 'mca', label: 'MCAs', icon: '🏘️' }
];

const statusColors = {
  completed: 'bg-green-500',
  ongoing: 'bg-blue-500',
  not_started: 'bg-gray-500',
  cancelled: 'bg-red-500'
};

const statusLabels = {
  completed: 'Completed',
  ongoing: 'Ongoing',
  not_started: 'Not Started',
  cancelled: 'Cancelled'
};

const Officials = () => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [promises, setPromises] = useState<DevelopmentPromise[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch officials
      const { data: officialsData, error: officialsError } = await supabase
        .from('officials')
        .select('*')
        .order('name');

      if (officialsError) throw officialsError;

      // Fetch promises with official data
      const { data: promisesData, error: promisesError } = await supabase
        .from('development_promises')
        .select(`
          *,
          official:officials(*)
        `)
        .order('created_at', { ascending: false });

      if (promisesError) throw promisesError;

      setOfficials(officialsData || []);
      setPromises(promisesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromises = promises.filter(promise => {
    const matchesLevel = selectedLevel === 'all' || promise.official.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || promise.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      promise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promise.official.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (promise.location && promise.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesLevel && matchesStatus && matchesSearch;
  });

  const getStatsByLevel = (level: string) => {
    const levelPromises = promises.filter(p => p.official.level === level);
    const completed = levelPromises.filter(p => p.status === 'completed').length;
    const ongoing = levelPromises.filter(p => p.status === 'ongoing').length;
    const notStarted = levelPromises.filter(p => p.status === 'not_started').length;
    const cancelled = levelPromises.filter(p => p.status === 'cancelled').length;
    
    return { total: levelPromises.length, completed, ongoing, notStarted, cancelled };
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading government officials data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">
            Kenya Government Officials Tracker
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Track development promises and progress from elected officials across all levels of government. 
            Promoting transparency and accountability in public service delivery.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {levelHierarchy.map(level => {
            const stats = getStatsByLevel(level.value);
            return (
              <Card key={level.value} className="text-center">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <span>{level.icon}</span>
                    {level.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Promises</div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>✅ {stats.completed}</span>
                      <span>🔄 {stats.ongoing}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search promises, officials, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levelHierarchy.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.icon} {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                  <SelectItem value="ongoing">🔄 Ongoing</SelectItem>
                  <SelectItem value="not_started">⏳ Not Started</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Promises List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Development Promises</h2>
            <div className="text-sm text-muted-foreground">
              Showing {filteredPromises.length} of {promises.length} promises
            </div>
          </div>

          {filteredPromises.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground">
                  No promises found matching your criteria.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredPromises.map(promise => (
                <Card key={promise.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{promise.title}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`${statusColors[promise.status]} text-white border-0`}
                          >
                            {statusLabels[promise.status]}
                          </Badge>
                        </div>
                        <CardDescription>{promise.description}</CardDescription>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>{promise.official.name} ({promise.official.position})</span>
                          </div>
                          {promise.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{promise.location}</span>
                            </div>
                          )}
                          {promise.beneficiaries_count && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{promise.beneficiaries_count.toLocaleString()} beneficiaries</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{promise.progress_percentage}%</span>
                        </div>
                        <Progress value={promise.progress_percentage} className="h-2" />
                      </div>

                      {/* Budget Information */}
                      {promise.budget_allocated && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                          <div>
                            <div className="text-sm text-muted-foreground">Budget Allocated</div>
                            <div className="font-semibold text-primary">
                              {formatCurrency(promise.budget_allocated)}
                            </div>
                          </div>
                          {promise.budget_used && (
                            <div>
                              <div className="text-sm text-muted-foreground">Budget Used</div>
                              <div className="font-semibold">
                                {formatCurrency(promise.budget_used)}
                              </div>
                            </div>
                          )}
                          {promise.funding_source && (
                            <div>
                              <div className="text-sm text-muted-foreground">Funding Source</div>
                              <div className="font-semibold">{promise.funding_source}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Additional Details */}
                      {(promise.contractor || promise.category) && (
                        <div className="flex flex-wrap gap-4 text-sm">
                          {promise.contractor && (
                            <div>
                              <span className="text-muted-foreground">Contractor: </span>
                              <span className="font-medium">{promise.contractor}</span>
                            </div>
                          )}
                          {promise.category && (
                            <div>
                              <span className="text-muted-foreground">Category: </span>
                              <Badge variant="secondary">{promise.category}</Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Officials;