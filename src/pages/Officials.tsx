import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Share2, MapPin, Users, Target, MessageSquare, Calculator, Vote, TrendingUp, TrendingDown } from 'lucide-react';

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
  official_id: string;
}

interface OfficialWithPromises extends Official {
  promises: DevelopmentPromise[];
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

const Officials = () => {
  const navigate = useNavigate();
  const [officials, setOfficials] = useState<OfficialWithPromises[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedParty, setSelectedParty] = useState('all');
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'promises'>('name');
  const [selectedTab, setSelectedTab] = useState('officials');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: officialsData, error: officialsError } = await supabase
        .from('officials')
        .select('*')
        .order('name');

      if (officialsError) throw officialsError;

      const { data: promisesData, error: promisesError } = await supabase
        .from('development_promises')
        .select('*');

      if (promisesError) throw promisesError;

      const officialsWithPromises: OfficialWithPromises[] = (officialsData || []).map(official => {
        const officialPromises = (promisesData || []).filter(promise => promise.official_id === official.id);
        const completedPromises = officialPromises.filter(p => p.status === 'completed').length;

        return {
          ...official,
          promises: officialPromises,
          completedPromises,
          totalPromises: officialPromises.length
        };
      });

      setOfficials(officialsWithPromises);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueParties = () => {
    const parties = [...new Set(officials.map(o => o.party).filter(Boolean))];
    return parties.sort();
  };

  const getUniqueCounties = () => {
    const counties = [...new Set(officials.map(o => o.county).filter(Boolean))];
    return counties.sort();
  };

  const filteredOfficials = officials.filter(official => {
    const matchesLevel = selectedLevel === 'all' || official.level === selectedLevel;
    const matchesParty = selectedParty === 'all' || official.party === selectedParty;
    const matchesCounty = selectedCounty === 'all' || official.county === selectedCounty;
    const matchesSearch = searchQuery === '' ||
      official.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (official.position && official.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (official.county && official.county.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesLevel && matchesParty && matchesCounty && matchesSearch;
  });

  const sortedOfficials = [...filteredOfficials].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        const aPerf = a.totalPromises > 0 ? (a.completedPromises / a.totalPromises) : 0;
        const bPerf = b.totalPromises > 0 ? (b.completedPromises / b.totalPromises) : 0;
        return bPerf - aPerf;
      case 'promises':
        return b.totalPromises - a.totalPromises;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Select value={selectedParty} onValueChange={setSelectedParty}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Parties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Parties</SelectItem>
                          {getUniqueParties().map(party => (
                            <SelectItem key={party} value={party!}>{party}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Counties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Counties</SelectItem>
                          {getUniqueCounties().map(county => (
                            <SelectItem key={county} value={county!}>{county}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
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
                        Showing {sortedOfficials.length} of {officials.length} officials
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Level Tabs */}
              <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                  {levelTabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-xs lg:text-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={selectedLevel} className="mt-6">
                  {sortedOfficials.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <div className="text-muted-foreground">
                          No officials found matching your criteria.
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedOfficials.map((official) => {
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
                <p className="text-muted-foreground">Track government budget allocation and spending</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="elections" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <Vote className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Elections Center</h3>
                <p className="text-muted-foreground">Information and resources for elections</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Officials;