import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Calendar, DollarSign, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { GovernmentProject, ProjectWithContractors, Contractor } from '@/types';

const statusConfig = {
  planned: { color: 'bg-gray-500', icon: Clock, label: 'Planned' },
  ongoing: { color: 'bg-blue-500', icon: TrendingUp, label: 'Ongoing' },
  completed: { color: 'bg-green-500', icon: CheckCircle, label: 'Completed' },
  cancelled: { color: 'bg-red-500', icon: XCircle, label: 'Cancelled' },
  delayed: { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Delayed' }
};

const priorityConfig = {
  low: { color: 'bg-gray-400', label: 'Low' },
  medium: { color: 'bg-blue-400', label: 'Medium' },
  high: { color: 'bg-orange-400', label: 'High' },
  critical: { color: 'bg-red-400', label: 'Critical' }
};

const Projects = () => {
  const [projects, setProjects] = useState<ProjectWithContractors[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('government_projects')
        .select(`
          *,
          contractors:project_contractors(
            id,
            role,
            contract_value,
            contract_start_date,
            contract_end_date,
            performance_rating,
            notes,
            contractor:contractors(*)
          ),
          updates:project_updates(
            id,
            update_type,
            title,
            description,
            status,
            upvotes,
            downvotes,
            community_verified,
            created_at
          ),
          official:officials(id, name, position)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        // Fallback to mock data if query fails
        const mockProjects: ProjectWithContractors[] = [
          {
            id: '1',
            title: 'Standard Gauge Railway Phase 2A',
            description: 'Extension of SGR from Nairobi to Naivasha',
            category: 'Transport',
            status: 'ongoing',
            priority: 'high',
            budget_allocated: 150000000000,
            funding_source: 'Government of Kenya & China',
            location: 'Nairobi-Naivasha corridor',
            county: 'Nairobi',
            constituency: 'Various',
            latitude: -1.2864,
            longitude: 36.8172,
            planned_start_date: '2023-01-01',
            planned_completion_date: '2025-12-31',
            progress_percentage: 65,
            contractors: [],
            updates: []
          },
          {
            id: '2',
            title: 'Nairobi Expressway',
            description: 'Construction of elevated expressway through Nairobi CBD',
            category: 'Transport',
            status: 'ongoing',
            priority: 'critical',
            budget_allocated: 100000000000,
            funding_source: 'Kenya Roads Board',
            location: 'Nairobi Central Business District',
            county: 'Nairobi',
            constituency: 'Westlands',
            latitude: -1.2864,
            longitude: 36.8172,
            planned_start_date: '2022-06-01',
            planned_completion_date: '2026-05-31',
            progress_percentage: 40,
            contractors: [],
            updates: []
          }
        ];
        setProjects(mockProjects);
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Fallback to mock data
      const mockProjects: ProjectWithContractors[] = [
        {
          id: '1',
          title: 'Standard Gauge Railway Phase 2A',
          description: 'Extension of SGR from Nairobi to Naivasha',
          category: 'Transport',
          status: 'ongoing',
          priority: 'high',
          budget_allocated: 150000000000,
          funding_source: 'Government of Kenya & China',
          location: 'Nairobi-Naivasha corridor',
          county: 'Nairobi',
          constituency: 'Various',
          latitude: -1.2864,
          longitude: 36.8172,
          planned_start_date: '2023-01-01',
          planned_completion_date: '2025-12-31',
          progress_percentage: 65,
          contractors: [],
          updates: []
        },
        {
          id: '2',
          title: 'Nairobi Expressway',
          description: 'Construction of elevated expressway through Nairobi CBD',
          category: 'Transport',
          status: 'ongoing',
          priority: 'critical',
          budget_allocated: 100000000000,
          funding_source: 'Kenya Roads Board',
          location: 'Nairobi Central Business District',
          county: 'Nairobi',
          constituency: 'Westlands',
          latitude: -1.2864,
          longitude: 36.8172,
          planned_start_date: '2022-06-01',
          planned_completion_date: '2026-05-31',
          progress_percentage: 40,
          contractors: [],
          updates: []
        }
      ];
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesCounty = selectedCounty === 'all' || project.county === selectedCounty;

    return matchesSearch && matchesStatus && matchesCounty;
  });

  const getCounties = () => {
    const counties = [...new Set(projects.map(p => p.county).filter(Boolean))];
    return counties.sort();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Government Projects Monitor</h1>
        <p className="text-muted-foreground">
          Track government projects, budgets, and contractor performance across Kenya
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by name, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
                aria-label="Filter by project status"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="delayed">Delayed</option>
              </select>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
                aria-label="Filter by county"
              >
                <option value="all">All Counties</option>
                {getCounties().map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const StatusIcon = statusConfig[project.status]?.icon || Clock;

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 line-clamp-2">{project.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${statusConfig[project.status]?.color} text-white`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[project.status]?.label}
                      </Badge>
                      <Badge variant="outline" className={priorityConfig[project.priority]?.color}>
                        {priorityConfig[project.priority]?.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                )}

                {/* Location */}
                {project.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{project.location}</span>
                  </div>
                )}

                {/* Budget */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span>Budget: {formatCurrency(project.budget_allocated)}</span>
                  </div>
                  {project.budget_used && project.budget_allocated && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round((project.budget_used / project.budget_allocated) * 100)}% used
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{project.progress_percentage}%</span>
                  </div>
                  <Progress value={project.progress_percentage} className="h-2" />
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Start: {formatDate(project.planned_start_date)}
                  </div>
                  <div>
                    <Calendar className="w-3 h-3 inline mr-1" />
                    End: {formatDate(project.planned_completion_date)}
                  </div>
                </div>

                {/* Contractors */}
                {project.contractors && project.contractors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span>Contractors ({project.contractors.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.contractors.slice(0, 2).map((pc, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {pc.contractor?.name || 'Unknown'}
                        </Badge>
                      ))}
                      {project.contractors.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.contractors.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Updates Count */}
                {project.updates && project.updates.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>{project.updates.length} citizen updates</span>
                  </div>
                )}

                {/* Action Button */}
                <Button className="w-full" variant="outline">
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedStatus !== 'all' || selectedCounty !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No government projects available at the moment'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Projects;
