import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, ShieldCheck, Vote, Calendar, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClaimPositionModal } from '@/components/governance/ClaimPositionModal';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useLeaderPositions, PositionWithHolder } from '@/hooks/useLeaderPositions';

interface LeadersGridProps {
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY';
    locationValue: string;
    communityId?: string;
}

// Skeleton loader component
const PositionSkeleton: React.FC = () => (
    <Card className="animate-pulse">
        <CardContent className="p-6">
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="flex gap-2 mt-2">
                        <div className="h-5 w-24 bg-muted rounded" />
                        <div className="h-5 w-28 bg-muted rounded" />
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);

// Error state component
const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Failed to load leaders</h3>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
            </Button>
        </CardContent>
    </Card>
);

// Empty state component
const EmptyState: React.FC<{ locationValue: string }> = ({ locationValue }) => (
    <div className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No Positions Found</h3>
        <p className="text-muted-foreground">
            No government positions defined for {locationValue} yet.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
            Positions will appear here once they are set up.
        </p>
    </div>
);

// Position Card component
const PositionCard: React.FC<{
    position: PositionWithHolder;
    onClaimClick: (position: PositionWithHolder) => void;
}> = ({ position, onClaimClick }) => {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-KE', {
            month: 'short',
            year: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (position.current_holder) {
        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <Avatar className="w-14 h-14 border-2 border-primary/20">
                            <AvatarImage src={position.current_holder.user?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {getInitials(position.current_holder.user?.display_name || 'UN')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">
                                {position.title}
                            </p>
                            <h3 className="font-bold text-lg truncate">
                                {position.current_holder.user?.display_name || 'Unknown'}
                            </h3>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {position.current_holder.verification_status === 'verified' ? (
                                    <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                        <ShieldCheck className="h-3 w-3 mr-1" />
                                        Verified Official
                                    </Badge>
                                ) : position.current_holder.verification_status === 'pending' ? (
                                    <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-600 dark:text-yellow-400">
                                        <ShieldCheck className="h-3 w-3 mr-1" />
                                        Pending Verification
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">
                                        <ShieldCheck className="h-3 w-3 mr-1" />
                                        Unverified
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px]">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(position.current_holder.term_start)} - {formatDate(position.current_holder.term_end)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Vacant position
    return (
        <Card className="border-dashed border-muted-foreground/40 bg-muted/30 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted/50 flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">
                            {position.title}
                        </p>
                        <h3 className="font-bold text-lg text-foreground/70">
                            Position Vacant
                        </h3>
                        <div className="flex gap-2 mt-2 flex-wrap items-center">
                            <Badge variant="outline" className="text-[10px] border-muted-foreground/40 text-muted-foreground">
                                Awaiting Claim
                            </Badge>
                            {position.next_election_date && (
                                <Badge variant="outline" className="text-[10px]">
                                    <Vote className="h-3 w-3 mr-1" />
                                    Next: {new Date(position.next_election_date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                                </Badge>
                            )}
                        </div>
                        <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => onClaimClick(position)}
                        >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Claim This Office
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Main LeadersGrid component (inner)
const LeadersGridContent: React.FC<LeadersGridProps> = ({ levelType, locationValue, communityId }) => {
    const navigate = useNavigate();
    const [claimModalOpen, setClaimModalOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<{
        id: string;
        title: string;
        governanceLevel: string;
        jurisdictionName: string;
        countryCode: string;
    } | null>(null);

    const {
        data: positions = [],
        isLoading,
        isError,
        error,
        refetch
    } = useLeaderPositions({ levelType, locationValue });

    const handleClaimClick = (position: PositionWithHolder) => {
        setSelectedPosition({
            id: position.id,
            title: position.title,
            governanceLevel: position.governance_level,
            jurisdictionName: position.jurisdiction_name,
            countryCode: position.country_code,
        });
        setClaimModalOpen(true);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-2">
                        <div className="h-7 w-40 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-60 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <PositionSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error instanceof Error ? error.message : 'Unknown error'}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    // Empty state
    if (positions.length === 0) {
        return <EmptyState locationValue={locationValue} />;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Our Leaders
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Government positions for <span className="font-semibold text-foreground">{locationValue}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positions.map((position) => (
                    <PositionCard
                        key={position.id}
                        position={position}
                        onClaimClick={handleClaimClick}
                    />
                ))}
            </div>

            {/* Claim Position Modal */}
            <ClaimPositionModal
                isOpen={claimModalOpen}
                onClose={() => setClaimModalOpen(false)}
                position={selectedPosition}
                communityId={communityId}
            />
        </div>
    );
};

// Exported component with Error Boundary wrapper
const LeadersGrid: React.FC<LeadersGridProps> = (props) => {
    return (
        <ErrorBoundary componentName="LeadersGrid">
            <LeadersGridContent {...props} />
        </ErrorBoundary>
    );
};

export default LeadersGrid;
