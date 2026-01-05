import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft, MapPin, DollarSign, Calendar, TrendingUp,
    AlertTriangle, CheckCircle, Clock, XCircle, Users,
    Building2, FileText, Image as ImageIcon, Share2
} from 'lucide-react';
import { GovernmentProject, ProjectContractor, ProjectUpdate, Contractor } from '@/types';
import { SubmitProjectUpdate } from '@/components/projects/SubmitProjectUpdate';

interface ProjectWithDetails extends GovernmentProject {
    contractors: (ProjectContractor & { contractor: Contractor })[];
    updates: ProjectUpdate[];
    official?: {
        id: string;
        name: string;
        position: string;
    };
}

const ProjectDetail = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [project, setProject] = useState<ProjectWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [updateModalOpen, setUpdateModalOpen] = useState(false);

    useEffect(() => {
        if (projectId) {
            fetchProjectData();
        }
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);

            const { data: projectData, error: projectError } = await supabase
                .from('government_projects')
                .select(`
          *,
          contractors:project_contractors(
            *,
            contractor:contractors(*)
          ),
          updates:project_updates(*),
          official:officials(id, name, position)
        `)
                .eq('id', projectId)
                .single();

            if (projectError) throw projectError;

            setProject(projectData as ProjectWithDetails);
        } catch (error) {
            console.error('Error fetching project data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load project data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'ongoing': return <Clock className="w-5 h-5 text-blue-600" />;
            case 'planned': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'delayed': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
            case 'cancelled': return <XCircle className="w-5 h-5 text-red-600" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string, isVerified?: boolean) => {
        const variants: Record<string, { label: string; className: string }> = {
            completed: { label: 'Completed', className: 'bg-green-500 text-white' },
            ongoing: { label: 'Ongoing', className: 'bg-blue-500 text-white' },
            planned: { label: 'Planned', className: 'bg-yellow-500 text-white' },
            delayed: { label: 'Delayed', className: 'bg-orange-500 text-white' },
            cancelled: { label: 'Cancelled', className: 'bg-red-500 text-white' }
        };
        const variant = variants[status] || variants.planned;

        return (
            <div className="flex gap-2">
                <Badge className={variant.className}>{variant.label}</Badge>
                {isVerified === false && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">
                        Unverified Report
                    </Badge>
                )}
            </div>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            critical: { label: 'Critical', className: 'bg-red-600 text-white' },
            high: { label: 'High', className: 'bg-orange-500 text-white' },
            medium: { label: 'Medium', className: 'bg-blue-500 text-white' },
            low: { label: 'Low', className: 'bg-gray-500 text-white' }
        };
        const variant = variants[priority] || variants.medium;
        return <Badge className={variant.className}>{variant.label}</Badge>;
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
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleShare = () => {
        const url = `${window.location.origin}/p/${projectId}`;
        navigator.clipboard.writeText(url);
        toast({
            title: 'Link copied!',
            description: 'Project link copied to clipboard'
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading project data...</div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Project Not Found</h3>
                        <p className="text-muted-foreground mb-4">
                            The project you're looking for doesn't exist or has been removed.
                        </p>
                        <Button onClick={() => navigate('/projects')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Projects
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const budgetUsedPercentage = project.budget_allocated && project.budget_used
        ? Math.round((project.budget_used / project.budget_allocated) * 100)
        : 0;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/projects')}
                className="mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
            </Button>

            {/* Project Header Card */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                                {getStatusIcon(project.status)}
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                                    <p className="text-muted-foreground">{project.description}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {getStatusBadge(project.status, project.is_verified)}
                                {getPriorityBadge(project.priority)}
                                {project.category && (
                                    <Badge variant="outline">{project.category}</Badge>
                                )}
                            </div>
                        </div>

                        <Button variant="outline" onClick={handleShare}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Project
                        </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Progress</div>
                            <div className="text-2xl font-bold">{project.progress_percentage}%</div>
                            <Progress value={project.progress_percentage} className="mt-2 h-2" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Budget Allocated</div>
                            <div className="text-2xl font-bold">{formatCurrency(project.budget_allocated)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Budget Used</div>
                            <div className="text-2xl font-bold">{formatCurrency(project.budget_used)}</div>
                            <div className="text-xs text-muted-foreground mt-1">{budgetUsedPercentage}% of budget</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Location</div>
                            <div className="flex items-center gap-1 mt-2">
                                <MapPin className="w-4 h-4" />
                                <span className="font-semibold">{project.county || 'N/A'}</span>
                            </div>
                            {project.constituency && (
                                <div className="text-sm text-muted-foreground">{project.constituency}</div>
                            )}
                            {project.ward && (
                                <div className="text-sm text-muted-foreground">{project.ward} Ward</div>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="contractors">
                        Contractors ({project.contractors?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="updates">
                        Updates ({project.updates?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="evidence">Evidence</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Project Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Funding Source</div>
                                    <div className="font-semibold">{project.funding_source || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Responsible Official</div>
                                    <div className="font-semibold">
                                        {project.official ? (
                                            <button
                                                onClick={() => navigate(`/officials/${project.official!.id}`)}
                                                className="text-primary hover:underline"
                                            >
                                                {project.official.name} - {project.official.position}
                                            </button>
                                        ) : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Planned Start Date</div>
                                    <div className="font-semibold flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(project.planned_start_date)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Planned Completion</div>
                                    <div className="font-semibold flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(project.planned_completion_date)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Budget Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Budget Transparency</CardTitle>
                            <CardDescription>Track how public funds are being spent</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Budget Utilization</span>
                                        <span className="font-semibold">{budgetUsedPercentage}%</span>
                                    </div>
                                    <Progress value={budgetUsedPercentage} className="h-3" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Allocated</div>
                                        <div className="text-xl font-bold text-blue-600">
                                            {formatCurrency(project.budget_allocated)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Used</div>
                                        <div className="text-xl font-bold text-green-600">
                                            {formatCurrency(project.budget_used)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Remaining</div>
                                        <div className="text-xl font-bold text-orange-600">
                                            {formatCurrency((project.budget_allocated || 0) - (project.budget_used || 0))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contractors Tab */}
                <TabsContent value="contractors" className="space-y-6">
                    {project.contractors && project.contractors.length > 0 ? (
                        project.contractors.map((pc) => (
                            <Card key={pc.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <Building2 className="w-8 h-8 text-primary" />
                                            <div>
                                                <CardTitle>{pc.contractor.name}</CardTitle>
                                                <CardDescription>{pc.role || 'Contractor'}</CardDescription>
                                            </div>
                                        </div>
                                        {pc.performance_rating && (
                                            <Badge variant="secondary">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                {pc.performance_rating}/5 Rating
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Contract Value</div>
                                            <div className="font-semibold text-lg">
                                                {formatCurrency(pc.contract_value)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Contract Period</div>
                                            <div className="font-semibold">
                                                {formatDate(pc.contract_start_date)} - {formatDate(pc.contract_end_date)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Registration Number</div>
                                            <div className="font-semibold">{pc.contractor.registration_number || 'N/A'}</div>
                                        </div>
                                    </div>
                                    {pc.notes && (
                                        <div className="mt-4 p-3 bg-muted rounded-lg">
                                            <div className="text-sm text-muted-foreground mb-1">Notes</div>
                                            <div className="text-sm">{pc.notes}</div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">No contractors assigned to this project yet.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Updates Tab */}
                <TabsContent value="updates" className="space-y-6">
                    {project.updates && project.updates.length > 0 ? (
                        project.updates.map((update) => (
                            <Card key={update.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {update.update_type === 'progress' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                                {update.update_type === 'issue' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
                                                {update.update_type === 'delay' && <Clock className="w-5 h-5 text-red-600" />}
                                                {update.title}
                                            </CardTitle>
                                            <CardDescription>
                                                {formatDate(update.created_at)} • Reported by {update.reporter_name || 'Anonymous'}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={update.status === 'verified' ? 'default' : 'secondary'}>
                                            {update.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm mb-4">{update.description}</p>

                                    {update.photos && update.photos.length > 0 && (
                                        <div className="flex gap-2 mb-4">
                                            {update.photos.map((photo, idx) => (
                                                <div key={idx} className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            👍 {update.upvotes || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            👎 {update.downvotes || 0}
                                        </span>
                                        {update.community_verified && (
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                ✓ Community Verified
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">No updates reported for this project yet.</p>
                                <Button
                                    className="mt-4"
                                    variant="outline"
                                    onClick={() => setUpdateModalOpen(true)}
                                >
                                    Submit Project Update
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Timeline Tab */}
                {/* Evidence Tab */}
                <TabsContent value="evidence" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Evidence</CardTitle>
                            <CardDescription>
                                Photos, videos, and documents submitted by the community and officials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Media Gallery */}
                            {project.media_urls && project.media_urls.length > 0 ? (
                                <div className="mb-8">
                                    <h3 className="font-semibold mb-4">Photos & Videos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {project.media_urls.map((url, idx) => (
                                            <div key={idx} className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                                                <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                                                    View Full Size
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8 text-center py-8 bg-muted/30 rounded-lg">
                                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">No photos or videos uploaded yet.</p>
                                </div>
                            )}

                            <Separator className="my-6" />

                            {/* Documents */}
                            <div>
                                <h3 className="font-semibold mb-4">Documents</h3>
                                {project.documents_urls && project.documents_urls.length > 0 ? (
                                    <div className="space-y-2">
                                        {project.documents_urls.map((url, idx) => (
                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                                                <FileText className="w-5 h-5 mr-3 text-primary" />
                                                <span className="flex-1 truncate">Document {idx + 1}</span>
                                                <span className="text-xs text-muted-foreground">View</span>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No documents available (Plans, Gazetted Notices, etc).</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Timeline</CardTitle>
                            <CardDescription>Key milestones and dates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <div className="w-0.5 h-full bg-border"></div>
                                    </div>
                                    <div className="pb-8">
                                        <div className="font-semibold">Project Planned</div>
                                        <div className="text-sm text-muted-foreground">
                                            {formatDate(project.planned_start_date)}
                                        </div>
                                    </div>
                                </div>

                                {project.actual_start_date && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <div className="w-0.5 h-full bg-border"></div>
                                        </div>
                                        <div className="pb-8">
                                            <div className="font-semibold">Project Started</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(project.actual_start_date)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${project.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <div>
                                        <div className="font-semibold">
                                            {project.status === 'completed' ? 'Project Completed' : 'Expected Completion'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {project.actual_completion_date
                                                ? formatDate(project.actual_completion_date)
                                                : formatDate(project.planned_completion_date)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submit Update Modal */}
            {project && (
                <SubmitProjectUpdate
                    projectId={project.id}
                    open={updateModalOpen}
                    onOpenChange={setUpdateModalOpen}
                    onSuccess={() => fetchProjectData()}
                />
            )}
        </div>
    );
};

export default ProjectDetail;
