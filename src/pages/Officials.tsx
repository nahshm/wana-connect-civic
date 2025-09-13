import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, FileText, Share2, MapPin, Users } from 'lucide-react';

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
  const [officials, setOfficials] = useState<OfficialWithPromises[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOfficial, setSelectedOfficial] = useState<OfficialWithPromises | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch officials with their promises
      const { data: officialsData, error: officialsError } = await supabase
        .from('officials')
        .select('*')
        .order('name');

      if (officialsError) throw officialsError;

      // Fetch all promises
      const { data: promisesData, error: promisesError } = await supabase
        .from('development_promises')
        .select('*');

      if (promisesError) throw promisesError;

      // Combine officials with their promises and calculate stats
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

  const filteredOfficials = officials.filter(official => {
    const matchesLevel = selectedLevel === 'all' || official.level === selectedLevel;
    const matchesSearch = searchQuery === '' || 
      official.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (official.position && official.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (official.county && official.county.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesLevel && matchesSearch;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
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

  if (selectedOfficial) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedOfficial(null)}
          className="mb-6"
        >
          ← Back to Officials
        </Button>
        
        <div className="space-y-6">
          {/* Official Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={selectedOfficial.photo_url} />
                  <AvatarFallback className="text-xl">
                    {getInitials(selectedOfficial.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold">{selectedOfficial.name}</h1>
                      <p className="text-xl text-muted-foreground">{selectedOfficial.position}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {formatLocation(selectedOfficial)}
                        </span>
                        {selectedOfficial.party && (
                          <Badge variant="secondary">{selectedOfficial.party}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        {selectedOfficial.completedPromises} / {selectedOfficial.totalPromises}
                      </div>
                      <div className="text-sm text-muted-foreground">Promises Completed</div>
                      <div className="mt-2">
                        <Progress 
                          value={getCompletionPercentage(selectedOfficial.completedPromises, selectedOfficial.totalPromises)} 
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Promises List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Development Promises</h2>
            
            {selectedOfficial.promises.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-muted-foreground">
                    No promises recorded for this official yet.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {selectedOfficial.promises.map(promise => (
                  <Card key={promise.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{promise.title}</CardTitle>
                            <Badge 
                              variant={promise.status === 'completed' ? 'default' : 'secondary'}
                              className={promise.status === 'completed' ? 'bg-green-500' : ''}
                            >
                              {promise.status === 'completed' ? '✅ Completed' : 
                               promise.status === 'ongoing' ? '🔄 Ongoing' : 
                               promise.status === 'not_started' ? '⏳ Not Started' : '❌ Cancelled'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{promise.description}</p>
                          
                          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                            {promise.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {promise.location}
                              </span>
                            )}
                            {promise.beneficiaries_count && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {promise.beneficiaries_count.toLocaleString()} beneficiaries
                              </span>
                            )}
                            {promise.category && (
                              <Badge variant="outline">{promise.category}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{promise.progress_percentage}%</span>
                          </div>
                          <Progress value={promise.progress_percentage} className="h-2" />
                        </div>

                        {promise.budget_allocated && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted rounded-lg text-sm">
                            <div>
                              <div className="text-muted-foreground">Budget Allocated</div>
                              <div className="font-semibold">
                                KES {(promise.budget_allocated / 1000000).toFixed(0)}M
                              </div>
                            </div>
                            {promise.budget_used && (
                              <div>
                                <div className="text-muted-foreground">Budget Used</div>
                                <div className="font-semibold">
                                  KES {(promise.budget_used / 1000000).toFixed(0)}M
                                </div>
                              </div>
                            )}
                            {promise.funding_source && (
                              <div>
                                <div className="text-muted-foreground">Funding Source</div>
                                <div className="font-semibold">{promise.funding_source}</div>
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
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Government Officials</h1>
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

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
            {filteredOfficials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-muted-foreground">
                    No officials found matching your criteria.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOfficials.map((official) => (
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
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
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
                            value={getCompletionPercentage(official.completedPromises, official.totalPromises)} 
                            className="h-2"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedOfficial(official)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Progress
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <FileText className="w-4 h-4 mr-1" />
                            Manifesto
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Officials;