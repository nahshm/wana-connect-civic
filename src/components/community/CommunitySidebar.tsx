import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Mail, Shield, Cake } from 'lucide-react';
import { CommunityProfile, CommunityRule, CommunityModerator, CommunityFlair } from '@/types/index';
import { format } from 'date-fns';
import { CommunityGuideModal } from './CommunityGuideModal';
import { UserFlairSelector } from './UserFlairSelector';
import { CommunityBookmarks } from './CommunityBookmarks';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ModMailDialog } from './ModMailDialog';
import { RelatedCommunities } from './RelatedCommunities';

interface CommunitySidebarProps {
    community: CommunityProfile;
    rules: CommunityRule[];
    moderators: CommunityModerator[];
    flairs: CommunityFlair[];
}

export const CommunitySidebar = ({
    community,
    rules,
    moderators,
    flairs
}: CommunitySidebarProps) => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isModMailOpen, setIsModMailOpen] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('user_flair')
                .eq('id', user.id)
                .single();
            if (data) setUserProfile(data);
        };

        fetchUserProfile();
    }, [user]);

    return (
        <div className="space-y-0">
            {/* Banner and Avatar - matching Profile page pattern */}
            <div className="relative mb-4">
                {/* Banner */}
                <div
                    className="h-24 w-full bg-cover bg-center"
                    style={{
                        backgroundImage: community.bannerUrl
                            ? `url(${community.bannerUrl})`
                            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--civic-blue)) 100%)',
                    }}
                />

                {/* Avatar and Name - overlapping banner */}
                <div className="px-4">
                    <div className="relative flex items-end gap-3 -mt-12">
                        <Avatar className="w-20 h-20 border-4 border-sidebar-background">
                            <AvatarImage src={community.avatarUrl || undefined} />
                            <AvatarFallback className="text-2xl">{community.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 pb-1">
                            <a href={`/c/${community.name}`} className="font-bold text-xl hover:underline block text-sidebar-foreground">
                                c/{community.name}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content with sticky positioning */}
            <div className="space-y-4 sticky top-20 px-4">
                {/* About Community Widget */}
                <Card className="bg-sidebar-background border-sidebar-border overflow-hidden">
                    <CardHeader className="bg-sidebar-accent/50 pb-3">
                        <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground flex items-center justify-between">
                            About Community
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">

                        {(() => {
                            const [isExpanded, setIsExpanded] = React.useState(false);
                            const description = community.description || '';
                            const maxLength = 150;
                            const shouldCollapse = description.length > maxLength;
                            const displayText = shouldCollapse && !isExpanded
                                ? description.slice(0, maxLength) + '...'
                                : description;

                            return (
                                <div className="mb-4">
                                    <p className="text-sm text-sidebar-foreground leading-relaxed">
                                        {displayText}
                                    </p>
                                    {shouldCollapse && (
                                        <button
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="text-xs text-primary hover:underline mt-1"
                                        >
                                            {isExpanded ? 'See less' : 'See more'}
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="flex items-center gap-2 text-sm text-sidebar-muted-foreground mb-4">
                            <Cake className="w-4 h-4" />
                            <span>Created {(community as any).created_at || (community as any).createdAt ? format(new Date((community as any).created_at || (community as any).createdAt), 'MMM d, yyyy') : 'Unknown Date'}</span>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-lg font-bold text-sidebar-foreground">
                                    {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format((community as any).member_count || 0)}
                                </div>
                                <div className="text-xs text-sidebar-muted-foreground">Members</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-sidebar-foreground flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                                    {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format((community as any).online_count || 0)}
                                </div>
                                <div className="text-xs text-sidebar-muted-foreground">Online</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Button className="w-full rounded-full" asChild>
                                <a href="/create-post">Create Post</a>
                            </Button>
                            <CommunityGuideModal community={community} />
                        </div>
                    </CardContent>
                </Card>

                {/* User Flair Widget */}
                {user && (
                    <Card className="bg-sidebar-background border-sidebar-border">
                        <CardContent className="pt-4">
                            <UserFlairSelector
                                communityId={community.id}
                                currentFlair={userProfile?.user_flair}
                                onFlairUpdate={(flair) => setUserProfile({ ...userProfile, user_flair: flair })}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Bookmarks Widget */}
                <CommunityBookmarks />

                {/* Rules Widget */}
                {rules.length > 0 && (
                    <Card className="bg-sidebar-background border-sidebar-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground">
                                c/{community.name} Rules
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-1">
                                {rules.map((rule, index) => (
                                    <div key={rule.id} className="py-2 border-b border-sidebar-border last:border-0">
                                        <div className="flex items-start gap-2">
                                            <span className="font-medium text-sm min-w-[20px]">{index + 1}.</span>
                                            <div className="text-sm font-medium">{rule.title}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Flairs Widget */}
                {flairs.length > 0 && (
                    <Card className="bg-sidebar-background border-sidebar-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground">
                                Filter by Flair
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-2">
                                {flairs.map((flair) => (
                                    <Badge
                                        key={flair.id}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-sidebar-accent transition-colors rounded-full px-3"
                                    >
                                        {flair.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Related Communities Widget */}
                <RelatedCommunities />

                {/* Moderators Widget */}
                <Card className="bg-sidebar-background border-sidebar-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground">
                            Moderators
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3 mb-4">
                            <Button
                                variant="outline"
                                className="w-full text-primary border-primary hover:bg-primary/10"
                                onClick={() => setIsModMailOpen(true)}
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Message Mods
                            </Button>
                            {moderators.slice(0, 5).map((mod: any) => (
                                <div key={mod.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={mod.profiles?.avatar_url || undefined} />
                                            <AvatarFallback className="text-[10px]">
                                                {mod.profiles?.display_name?.charAt(0) || mod.profiles?.username?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-primary hover:underline cursor-pointer">
                                            u/{mod.profiles?.username}
                                        </span>
                                    </div>
                                    {mod.role === 'admin' && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1">Admin</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-sidebar-muted-foreground text-center">
                            <a href="#" className="hover:underline">View All Moderators</a>
                        </div>
                    </CardContent>
                </Card>

                <ModMailDialog
                    isOpen={isModMailOpen}
                    onClose={() => setIsModMailOpen(false)}
                    communityId={community.id}
                    communityName={community.name}
                />
            </div>
        </div>
    );
};
