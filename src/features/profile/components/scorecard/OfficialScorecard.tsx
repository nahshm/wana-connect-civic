import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, BarChart3, Clock, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { PromiseMeter } from './PromiseMeter';
import { ProjectHealth } from './ProjectHealth';
import { useOfficialScorecard } from '../../hooks/useOfficialScorecard';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface OfficialScorecardProps {
    userId: string;
    className?: string;
}

// Skeleton loader
const ScorecardSkeleton: React.FC = () => (
    <Card>
        <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
            </div>
        </CardContent>
    </Card>
);

// Error state
const ScorecardError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <Card className="border-destructive/50">
        <CardContent className="py-8 text-center">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
                Failed to load scorecard data
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
            </Button>
        </CardContent>
    </Card>
);

// Empty state
const ScorecardEmpty: React.FC = () => (
    <Card className="border-dashed">
        <CardContent className="py-8 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
                No scorecard data available yet
            </p>
        </CardContent>
    </Card>
);

// Grade badge component
const GradeBadge: React.FC<{ grade: string | null; size?: 'sm' | 'md' | 'lg' }> = ({
    grade,
    size = 'md'
}) => {
    const getGradeStyle = (g: string | null): { color: string; bg: string } => {
        switch (g) {
            case 'A': return { color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' };
            case 'B': return { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' };
            case 'C': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' };
            case 'D': return { color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' };
            case 'F': return { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' };
            default: return { color: 'text-muted-foreground', bg: 'bg-muted' };
        }
    };

    const style = getGradeStyle(grade);
    const sizeClass = size === 'lg' ? 'text-4xl p-4' : size === 'md' ? 'text-2xl p-3' : 'text-lg p-2';

    return (
        <div className={cn(
            'inline-flex items-center justify-center rounded-xl font-bold border',
            style.color,
            style.bg,
            sizeClass
        )}>
            {grade || '—'}
        </div>
    );
};

/**
 * OfficialScorecard - Public Service Report Card for government officials
 * Shows promise delivery, project health, attendance, and responsiveness
 */
const OfficialScorecardContent: React.FC<OfficialScorecardProps> = ({
    userId,
    className,
}) => {
    const {
        scorecard,
        isLoading,
        isError,
        refetch,
    } = useOfficialScorecard({ userId });

    if (isLoading) {
        return <ScorecardSkeleton />;
    }

    if (isError) {
        return <ScorecardError onRetry={refetch} />;
    }

    if (!scorecard || (scorecard.promisesTotal === 0 && scorecard.projectsTotal === 0)) {
        return <ScorecardEmpty />;
    }

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="w-5 h-5" />
                        Public Service Scorecard
                    </CardTitle>
                    <GradeBadge grade={scorecard.overallGrade} />
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
                {/* Promise Meter */}
                {scorecard.promisesTotal > 0 && (
                    <PromiseMeter
                        total={scorecard.promisesTotal}
                        kept={scorecard.promisesKept}
                        broken={scorecard.promisesBroken}
                        inProgress={scorecard.promisesInProgress}
                    />
                )}

                {/* Project Health */}
                {scorecard.projectsTotal > 0 && (
                    <ProjectHealth
                        stalled={scorecard.projectsStalled}
                        active={scorecard.projectsActive}
                        completed={scorecard.projectsCompleted}
                        cancelled={scorecard.projectsCancelled}
                    />
                )}

                {/* Attendance & Responsiveness Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Attendance */}
                    {scorecard.attendanceSessionsTotal > 0 && (
                        <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Calendar className="w-4 h-4" />
                                <span>Attendance</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={cn(
                                    'text-2xl font-bold',
                                    scorecard.attendancePercent >= 80 ? 'text-green-500' :
                                        scorecard.attendancePercent >= 60 ? 'text-yellow-500' : 'text-red-500'
                                )}>
                                    {scorecard.attendancePercent}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({scorecard.attendanceSessionsPresent}/{scorecard.attendanceSessionsTotal})
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Responsiveness */}
                    {scorecard.avgResponseHours !== null && (
                        <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>Responsiveness</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={cn(
                                    'text-2xl font-bold',
                                    scorecard.avgResponseHours <= 24 ? 'text-green-500' :
                                        scorecard.avgResponseHours <= 72 ? 'text-yellow-500' : 'text-red-500'
                                )}>
                                    {scorecard.avgResponseHours < 24
                                        ? `${scorecard.avgResponseHours}h`
                                        : `${Math.round(scorecard.avgResponseHours / 24)}d`}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    avg reply
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Last Updated */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last calculated: {new Date(scorecard.lastCalculated).toLocaleDateString()}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => refetch()}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Wrap with Error Boundary
export const OfficialScorecard: React.FC<OfficialScorecardProps> = (props) => (
    <ErrorBoundary componentName="OfficialScorecard">
        <OfficialScorecardContent {...props} />
    </ErrorBoundary>
);

export default OfficialScorecard;
