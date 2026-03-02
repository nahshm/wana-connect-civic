import React, { useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { ImpactSummaryCard } from '../components/resume/ImpactSummaryCard';
import { CivicExperienceList } from '../components/resume/CivicExperienceList';
import { SkillsEndorsementPanel } from '../components/resume/SkillsEndorsementPanel';
import { AchievementGallery } from '../components/resume/AchievementGallery';
import { LeaderboardRankCard } from '../components/resume/LeaderboardRankCard';
import { ActiveQuestsPanel } from '../components/resume/ActiveQuestsPanel';

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

const ResumeSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
                <Skeleton className="h-80 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
            <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-96 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    </div>
);

const CivicResumePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Fetch profile data
    const {
        data: profile,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['civic-resume', username],
        queryFn: async (): Promise<UserProfile | null> => {
            if (!username) return null;

            // Direct username lookup
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

    const handleShare = async () => {
        if (!profile) return;
        const url = window.location.href;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${profile.displayName}'s Civic Resume | WanaConnect`,
                    text: `Check out civic impact and engagement history.`,
                    url: url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('Resume link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <ResumeSkeleton />
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="container mx-auto px-4 py-16 text-center max-w-md">
                <div className="bg-destructive/10 text-destructive w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">!</span>
                </div>
                <h1 className="text-2xl font-bold mb-2">Resume Not Found</h1>
                <p className="text-muted-foreground mb-6">
                    We couldn't find a civic resume for the username <strong>@{username}</strong>.
                </p>
                <Button onClick={() => navigate(-1)} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header / Banner Area */}
            <div className="relative h-48 md:h-64 bg-muted overflow-hidden">
                {profile.bannerUrl ? (
                    <img 
                        src={profile.bannerUrl} 
                        alt="Profile Banner" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                )}
                
                {/* Overlay gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-background/80 backdrop-blur"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
                
                <div className="absolute top-4 right-4">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-background/80 backdrop-blur"
                        onClick={handleShare}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Resume
                    </Button>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl -mt-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6">
                    {/* LEFT COLUMN - Main Content */}
                    <div className="space-y-6">
                        {/* Summary & Identity (replaces traditional Profile header) */}
                        <ImpactSummaryCard profile={profile} isOwnProfile={isOwnProfile} />
                        
                        {/* Timeline of actions */}
                        <CivicExperienceList userId={profile.id} />
                        
                        {/* Achievements / Badges Gallery */}
                        <AchievementGallery userId={profile.id} />
                    </div>

                    {/* RIGHT COLUMN - Sidebar Metrics */}
                    <div className="space-y-6">
                        {/* Rank card */}
                        <LeaderboardRankCard userId={profile.id} />
                        
                        {/* Endorsements */}
                        <SkillsEndorsementPanel 
                            userId={profile.id} 
                            isOwnProfile={isOwnProfile} 
                        />

                        {/* Active Quests */}
                        <ActiveQuestsPanel userId={profile.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CivicResumePage;
