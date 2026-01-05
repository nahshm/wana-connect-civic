import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, RefreshCw, Settings, User, Award, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Import profile components
import { ProfileIdentityCard } from '../components/identity';
import { OfficialScorecard } from '../components/scorecard';
import { ExpertiseGrid } from '../components/expertise';
import { TrophyCase } from '../components/trophy';
import { ProfileStudio } from '../components/studio';
import { ActionCenter } from './ActionCenter';
import { ActivityTimeline } from '../components/activity/ActivityTimeline';
import { StatsOverview } from '../components/stats/StatsOverview';
import { ProfileSettings } from '../components/settings/ProfileSettings';

interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string | null;
    isVerified: boolean;
    officialPosition: string | null;
    officialPositionId: string | null;
    county: string | null;
    constituency: string | null;
    ward: string | null;
    createdAt: string;
}

interface ProfileV2Props {
    className?: string;
}

// Skeleton loader for the full profile
const ProfileSkeleton: React.FC = () => (
    <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-32" />
            </div>
            <div className="space-y-6">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
        </div>
    </div>
);

/**
 * ProfileV2 - New Civic Resume profile page
 * Displays Identity Card, Scorecard (for officials), Expertise, and Trophy Case
 */
const ProfileV2Content: React.FC<ProfileV2Props> = ({ className }) => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();

    // Fetch profile data
    const {
        data: profile,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['profile-v2', username],
        queryFn: async (): Promise<UserProfile | null> => {
            if (!username) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            return {
                id: data.id,
                username: data.username,
                displayName: data.display_name || data.username,
                avatarUrl: data.avatar_url,
                bannerUrl: data.banner_url,
                bio: data.bio,
                isVerified: data.is_verified,
                officialPosition: data.official_position,
                officialPositionId: data.official_position_id,
                county: data.county,
                constituency: data.constituency,
                ward: data.ward,
                createdAt: data.created_at,
            };
        },
        enabled: !!username,
        staleTime: 5 * 60 * 1000,
    });

    const isOwnProfile = currentUser?.id === profile?.id;
    const isOfficial = profile?.isVerified && profile?.officialPosition;
    const location = [profile?.ward, profile?.constituency, profile?.county]
        .filter(Boolean)
        .join(', ') || undefined;

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (isError) {
        return (
            <div className={cn('text-center py-16', className)}>
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Failed to load profile</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    {(error as Error)?.message || 'An error occurred'}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={cn('text-center py-16', className)}>
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">User not found</h2>
                <p className="text-sm text-muted-foreground">
                    The user @{username} doesn't exist
                </p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4 max-w-5xl mx-auto', className)}>
            {/* Hero: Identity Card */}
            <ProfileIdentityCard
                userId={profile.id}
                username={profile.username}
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl || undefined}
                bannerUrl={profile.bannerUrl || undefined}
                isVerified={profile.isVerified}
                officialPosition={profile.officialPosition || undefined}
                location={location}
                joinDate={new Date(profile.createdAt)}
            />

            {/* Main Content - 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Official Scorecard (only for verified officials) */}
                    {isOfficial && (
                        <OfficialScorecard userId={profile.id} />
                    )}

                    {/* Expertise Grid */}
                    <ExpertiseGrid userId={profile.id} />

                    {/* Bio section */}
                    {profile.bio && (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                            <h4 className="text-sm font-medium mb-2">About</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {profile.bio}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Trophy Case */}
                    <TrophyCase userId={profile.id} />

                    {/* Owner-only: Action Center */}
                    {isOwnProfile && (
                        <ActionCenter />
                    )}

                    {/* Owner-only: Customization Studio */}
                    {isOwnProfile && (
                        <ProfileStudio userId={profile.id} />
                    )}
                </div>
            </div>

            {/* Owner-only: Settings Tab (collapsible) */}
            {isOwnProfile && (
                <div className="border-t pt-6">
                    <Tabs defaultValue="activity">
                        <TabsList>
                            <TabsTrigger value="activity" className="gap-1">
                                <Zap className="w-4 h-4" />
                                Activity
                            </TabsTrigger>
                            <TabsTrigger value="stats" className="gap-1">
                                <BarChart3 className="w-4 h-4" />
                                Stats
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="gap-1">
                                <Settings className="w-4 h-4" />
                                Settings
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="activity" className="pt-4">
                            <ActivityTimeline userId={profile.id} />
                        </TabsContent>
                        <TabsContent value="stats" className="pt-4">
                            <StatsOverview userId={profile.id} />
                        </TabsContent>
                        <TabsContent value="settings" className="pt-4">
                            <ProfileSettings userId={profile.id} />
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
};

// Wrap with Error Boundary
export const ProfileV2: React.FC<ProfileV2Props> = (props) => (
    <ErrorBoundary componentName="ProfileV2">
        <ProfileV2Content {...props} />
    </ErrorBoundary>
);

export default ProfileV2;
