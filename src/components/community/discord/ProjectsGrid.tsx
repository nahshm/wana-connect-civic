import React from 'react';
import { GovernmentProject } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, DollarSign, Calendar, PlusCircle, Hammer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectsGridProps {
    projects: GovernmentProject[];
    loading: boolean;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects, loading }) => {
    const navigate = useNavigate();

    const formatCurrency = (amount?: number) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'ongoing':
                return 'bg-blue-500';
            case 'delayed':
                return 'bg-yellow-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                        <div className="h-32 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Hammer className="mr-3 h-8 w-8 text-orange-500" />
                        Community-Reported Projects
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Track development projects in your area
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/projects/submit')}
                    className="bg-orange-600 hover:bg-orange-700"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Report Project
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Hammer className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold mb-2">No Projects Reported</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Be the first to report a development project in your area.
                    </p>
                    <Button onClick={() => navigate('/projects/submit')}>
                        Report First Project
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => navigate(`/projects/${project.id}`)}
                        >
                            {project.media_urls && project.media_urls.length > 0 && (
                                <img
                                    src={project.media_urls[0]}
                                    alt={project.title}
                                    className="w-full h-48 object-cover rounded-t-lg"
                                />
                            )}

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                                        {project.title}
                                    </h3>
                                    <Badge className={`${getStatusColor(project.status)} text-white text-xs`}>
                                        {project.status}
                                    </Badge>
                                </div>

                                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                                    {project.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded border border-slate-100">
                                    <div>
                                        <div className="text-slate-400 text-xs uppercase font-bold">Budget</div>
                                        <div className="font-mono text-slate-800">
                                            {formatCurrency(project.budget_allocated)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-xs uppercase font-bold">Location</div>
                                        <div className="text-slate-800 line-clamp-1">{project.location || project.ward}</div>
                                    </div>
                                </div>

                                {/* Progress */}
                                {project.progress_percentage !== undefined && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Progress</span>
                                            <span className="font-bold">{project.progress_percentage}%</span>
                                        </div>
                                        <Progress value={project.progress_percentage} className="h-2" />
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                                    {project.is_verified === false && (
                                        <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 text-xs">
                                            Community Report
                                        </Badge>
                                    )}
                                    <Button variant="ghost" size="sm" className="ml-auto">
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectsGrid;
