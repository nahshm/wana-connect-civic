import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, Image as ImageIcon, FileText, Rocket, MapPin, TrendingUp, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTimelineTheme, UPDATE_TYPE_STYLES } from '@/constants/timelineThemes';

interface TimelineUpdate {
    id: string;
    title: string;
    description: string;
    update_type: string;
    created_at: string;
    media_urls: string[] | null;
    community_verified: boolean;
    author: {
        id: string;
        username: string;
        avatar_url: string | null;
    } | null;
}

interface ProjectTimelineProps {
    updates: TimelineUpdate[];
    projectCreatedAt: string;
    projectTitle: string;
    projectDescription: string;
    projectLocation?: string;
    projectBudget?: number;
    projectCategory?: string;
    projectProgress?: number;
    onMediaClick?: (urls: string[]) => void;
}

const updateTypeConfig = {
    progress: { color: 'bg-blue-500', label: 'Progress Update', icon: TrendingUp },
    milestone: { color: 'bg-green-500', label: 'Milestone', icon: CheckCircle2 },
    issue: { color: 'bg-red-500', label: 'Issue Reported', icon: AlertTriangle },
    completion: { color: 'bg-purple-500', label: 'Completion', icon: CheckCircle2 },
    delay: { color: 'bg-yellow-500', label: 'Delay', icon: Clock },
    created: { color: 'bg-primary', label: 'Project Created', icon: Rocket }
};

// Infrastructure Roadmap Component
function InfrastructureRoadmap({ updates, progress }: { updates: TimelineUpdate[], progress: number }) {
    const milestones = updates.filter(u => u.update_type === 'milestone' || u.update_type === 'created').slice(0, 5);

    return (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 dark:from-blue-950/20 dark:via-sky-950/20 dark:to-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Project Roadmap
            </h4>

            {/* Horizontal Timeline */}
            <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-blue-200 dark:bg-blue-800 rounded-full">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Milestone Dots */}
                <div className="relative flex justify-between items-start pt-1">
                    {milestones.map((milestone, idx) => {
                        const isCompleted = idx / (milestones.length - 1) * 100 <= progress;

                        return (
                            <div key={milestone.id} className="flex flex-col items-center space-y-2" style={{ flex: 1 }}>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 transition-all z-10",
                                    isCompleted
                                        ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                                        : "bg-gray-300 dark:bg-gray-700"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                                <div className="text-center max-w-[100px]">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                                        {milestone.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        {format(new Date(milestone.created_at), 'MMM yyyy')}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function ProjectTimeline({
    updates,
    projectCreatedAt,
    projectTitle,
    projectDescription,
    projectLocation,
    projectBudget,
    projectCategory,
    projectProgress = 0,
    onMediaClick
}: ProjectTimelineProps) {
    const theme = getTimelineTheme(projectCategory);

    // Create initial project creation entry
    const creationEntry: TimelineUpdate = {
        id: 'creation',
        title: 'Project Announced',
        description: projectDescription,
        update_type: 'created',
        created_at: projectCreatedAt,
        media_urls: null,
        community_verified: true,
        author: null
    };

    // Combine creation entry with updates
    const allEntries = [creationEntry, ...updates];

    return (
        <div>
            {/* Progress Header */}
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
                    <span className="text-sm font-bold text-primary">{projectProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                        className={cn("h-2.5 rounded-full bg-gradient-to-r", theme.colors.gradient)}
                        style={{ width: `${projectProgress}%` }}
                    />
                </div>
            </div>

            {/* Infrastructure Roadmap (Special Feature) */}
            {theme.showRoadmap && (
                <InfrastructureRoadmap updates={allEntries} progress={projectProgress} />
            )}

            {/* Timeline Entries */}
            <div className="space-y-4">
                {allEntries.map((update, index) => {
                    const config = updateTypeConfig[update.update_type as keyof typeof updateTypeConfig] || {
                        color: 'bg-gray-500',
                        label: 'Update',
                        icon: FileText
                    };
                    const Icon = config.icon;
                    const isCreation = update.id === 'creation';

                    return (
                        <Card key={update.id} className={cn(
                            "relative transition-all duration-200 hover:shadow-lg",
                            "border-l-4",
                            index === 0 && "shadow-md"
                        )} style={{ borderLeftColor: theme.colors.primary }}>
                            {/* Timeline connector */}
                            {index < allEntries.length - 1 && (
                                <div
                                    className="absolute left-6 top-16 bottom-0 w-0.5 -mb-4 z-0"
                                    style={{ backgroundColor: theme.colors.accent + '40' }}
                                />
                            )}

                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-4">
                                    {/* Timeline Icon with Gradient */}
                                    <div className={cn(
                                        "relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg",
                                        `bg-gradient-to-br`,
                                        config.color
                                    )} style={{
                                        backgroundImage: index === 0
                                            ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                                            : undefined
                                    }}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <Badge
                                                variant="outline"
                                                className="text-white border-0 shadow-sm"
                                                style={{
                                                    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                                                }}
                                            >
                                                {config.label}
                                            </Badge>
                                            {update.community_verified && (
                                                <Badge variant="default" className="bg-green-600 gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Verified
                                                </Badge>
                                            )}
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(update.created_at), 'MMM d, yyyy · h:mm a')}
                                            </span>
                                        </div>

                                        <CardTitle className="text-lg mb-2">{update.title}</CardTitle>

                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {update.description}
                                        </p>

                                        {/* Project details for creation entry */}
                                        {isCreation && (
                                            <div className={cn(
                                                "mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg",
                                                "bg-gradient-to-br opacity-90"
                                            )} style={{
                                                backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.accent}15)`
                                            }}>
                                                {projectLocation && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4" style={{ color: theme.colors.primary }} />
                                                        <span className="font-medium">{projectLocation}</span>
                                                    </div>
                                                )}
                                                {projectBudget && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        <span className="font-medium">
                                                            KES {projectBudget >= 1e6 ? `${(projectBudget / 1e6).toFixed(1)}M` : projectBudget.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Media thumbnails */}
                                        {update.media_urls && update.media_urls.length > 0 && (
                                            <div className="mt-3 flex gap-2 flex-wrap">
                                                {update.media_urls.slice(0, 4).map((url, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => onMediaClick?.(update.media_urls!)}
                                                        className="relative w-24 h-24 rounded overflow-hidden bg-muted hover:ring-2 transition-all group"
                                                        style={{ outlineColor: theme.colors.primary }}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Update media ${idx + 1}`}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    </button>
                                                ))}
                                                {update.media_urls.length > 4 && (
                                                    <div className="w-24 h-24 rounded bg-muted flex items-center justify-center text-sm font-medium border-2 border-dashed">
                                                        <div className="text-center">
                                                            <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                                            +{update.media_urls.length - 4}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Author */}
                                        {update.author && (
                                            <div className="mt-3 flex items-center gap-2 text-sm">
                                                <Avatar className="w-6 h-6">
                                                    <AvatarImage src={update.author.avatar_url || undefined} />
                                                    <AvatarFallback>
                                                        {update.author.username.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-muted-foreground">
                                                    Posted by <span className="font-medium text-foreground">{update.author.username}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
