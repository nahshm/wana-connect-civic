import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Calendar, MapPin, Trophy, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { GoatBadge } from './GoatBadge';
import { TrustTier, TrustTierType } from './TrustTier';
import { useCivicImpact } from '../../hooks/useCivicImpact';
import { VerifiedBadge, OfficialPositionBadge } from '@/components/ui/verified-badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface ProfileIdentityCardProps {
    userId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    isVerified?: boolean;
    officialPosition?: string;
    location?: string;
    joinDate?: Date;
    frameAnimation?: string;
    accentColor?: string;
    className?: string;
}

// Skeleton loader
const IdentityCardSkeleton: React.FC = () => (
    <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-700" />
        <CardContent className="relative -mt-16 pb-4">
            <div className="flex gap-4">
                <Skeleton className="w-28 h-28 rounded-xl flex-shrink-0" />
                <div className="flex-1 pt-8 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        </CardContent>
    </Card>
);

// Error state
const IdentityCardError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <Card className="overflow-hidden border-destructive/50">
        <CardContent className="py-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Failed to load profile</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
            </Button>
        </CardContent>
    </Card>
);

// Frame animation styles
const getFrameStyle = (animation?: string): string => {
    switch (animation) {
        case 'ballot_spin':
            return 'ring-4 ring-blue-500 animate-pulse';
        case 'flag_wave':
            return 'ring-4 ring-green-500 ring-offset-red-500 ring-offset-2';
        case 'stars_glow':
            return 'ring-4 ring-yellow-500 shadow-lg shadow-yellow-500/50';
        case 'civic_pulse':
            return 'ring-4 ring-purple-500 animate-pulse';
        case 'verified_shine':
            return 'ring-4 ring-blue-400 shadow-lg shadow-blue-400/50';
        default:
            return 'ring-2 ring-background';
    }
};

// Get impact color
const getImpactColor = (rating: number): string => {
    if (rating >= 80) return 'text-green-500 bg-green-500/10';
    if (rating >= 60) return 'text-blue-500 bg-blue-500/10';
    if (rating >= 40) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-orange-500 bg-orange-500/10';
};

/**
 * ProfileIdentityCard - Compact trading card style identity display
 * Redesigned to minimize whitespace and maximize information density
 */
const ProfileIdentityCardContent: React.FC<ProfileIdentityCardProps> = ({
    userId,
    username,
    displayName,
    avatarUrl,
    bannerUrl,
    isVerified,
    officialPosition,
    location,
    joinDate,
    frameAnimation,
    accentColor = '#3B82F6',
    className,
}) => {
    const {
        impactScore,
        isLoading,
        isError,
        refetch,
        getXpProgress,
    } = useCivicImpact({ userId });

    if (isLoading) return <IdentityCardSkeleton />;
    if (isError) return <IdentityCardError onRetry={refetch} />;

    const xpProgress = getXpProgress();
    const trustTier: TrustTierType = impactScore?.trustTier ||
        (isVerified && officialPosition ? 'verified_official' :
            isVerified ? 'verified_user' : 'resident');

    const impactRating = impactScore?.impactRating || 0;

    return (
        <Card className={cn(
            'overflow-hidden border-0 shadow-lg',
            className
        )}>
            {/* Compact Banner with gradient overlay */}
            <div
                className="h-32 bg-cover bg-center relative"
                style={{
                    backgroundImage: bannerUrl
                        ? `url(${bannerUrl})`
                        : `linear-gradient(135deg, ${accentColor}20, ${accentColor}90, ${accentColor}60)`,
                }}
            >
                {/* Lighter gradient - only fade at bottom for card transition */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                {/* GOAT Badge positioned on banner */}
                <div className="absolute top-3 left-3 z-10">
                    <GoatBadge
                        level={impactScore?.goatLevel || 1}
                        title={impactScore?.goatTitle || 'Street Monitor'}
                        xp={impactScore?.goatXp}
                        size="md"
                    />
                </div>

                {/* XP Progress on banner */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-1 z-10">
                    <Progress value={xpProgress.percent} className="h-1.5 bg-white/30" />
                    <p className="text-[9px] text-white/90 mt-0.5 drop-shadow-sm">
                        {xpProgress.current}/{xpProgress.required} XP to next level
                    </p>
                </div>
            </div>

            <CardContent className="relative px-4 pb-4 pt-2">
                {/* Main Content Row - Avatar + Info + Stats */}
                <div className="flex gap-4">
                    {/* Avatar - Positioned to overlap banner */}
                    <div className="-mt-14 flex-shrink-0">
                        <Avatar className={cn(
                            'w-24 h-24 rounded-xl border-4 border-background shadow-xl',
                            getFrameStyle(frameAnimation)
                        )}>
                            <AvatarImage src={avatarUrl} alt={displayName || username} className="object-cover" />
                            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                                {(displayName || username)?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* User Info - Compact */}
                    <div className="flex-1 min-w-0 pt-1">
                        {/* Name Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold truncate">
                                {displayName || username}
                            </h2>
                            {isVerified && <VerifiedBadge size="sm" positionTitle={officialPosition} />}
                        </div>

                        {/* Username + Trust */}
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-muted-foreground">@{username}</span>
                            <TrustTier tier={trustTier} size="sm" showLabel={false} />
                        </div>

                        {/* Official Position */}
                        {officialPosition && (
                            <div className="mt-1">
                                <OfficialPositionBadge position={officialPosition} />
                            </div>
                        )}
                    </div>

                    {/* Impact Score - Right Side */}
                    <div className={cn(
                        'flex-shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-xl -mt-8',
                        getImpactColor(impactRating)
                    )}>
                        <span className="text-3xl font-bold">{impactRating}</span>
                        <span className="text-[10px] uppercase tracking-wide opacity-80">/100 Impact</span>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    {/* Left: Location + Join Date */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {location}
                            </span>
                        )}
                        {joinDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Joined {joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                        )}
                    </div>

                    {/* Right: Component Scores */}
                    {impactScore && (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] gap-1 py-0.5">
                                <Zap className="w-2.5 h-2.5" />
                                {impactScore.actionsScore} Actions
                            </Badge>
                            <Badge variant="outline" className="text-[10px] gap-1 py-0.5">
                                <Trophy className="w-2.5 h-2.5" />
                                {impactScore.resolutionScore} Resolved
                            </Badge>
                            <Badge variant="outline" className="text-[10px] gap-1 py-0.5">
                                <Award className="w-2.5 h-2.5" />
                                {impactScore.communityScore} Community
                            </Badge>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Wrap with Error Boundary
export const ProfileIdentityCard: React.FC<ProfileIdentityCardProps> = (props) => (
    <ErrorBoundary componentName="ProfileIdentityCard">
        <ProfileIdentityCardContent {...props} />
    </ErrorBoundary>
);

export default ProfileIdentityCard;
