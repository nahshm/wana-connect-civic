import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, MoreHorizontal, Plus, Minus } from 'lucide-react';
import { CommunityProfile } from '@/types/index';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CommunityHeaderProps {
    community: CommunityProfile;
    isMember: boolean;
    onJoinLeave: () => void;
    activeTab: string;
    onTabChange: (value: string) => void;
    isModerator?: boolean;
}

export const CommunityHeader = ({
    community,
    isMember,
    onJoinLeave,
    activeTab,
    onTabChange,
    isModerator
}: CommunityHeaderProps) => {
    return (
        <div className="w-full bg-sidebar-background border-b border-sidebar-border mb-4">
            {/* Banner */}
            <div className="h-32 md:h-48 w-full bg-muted relative">
                {community.bannerUrl ? (
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${community.bannerUrl})` }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-emerald-400" />
                )}
            </div>

            {/* Header Content */}
            <div className="container mx-auto px-4">
                <div className="relative flex flex-col md:flex-row items-start md:items-end pb-4 -mt-4 md:-mt-8 mb-2">
                    {/* Avatar */}
                    <div className="relative mr-4 mb-4 md:mb-0">
                        <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-sidebar-background rounded-full">
                            <AvatarImage src={community.avatarUrl || undefined} />
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {community.name?.charAt(0) || 'C'}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Title and Actions */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-sidebar-foreground flex items-center gap-2">
                                {community.name}
                            </h1>
                            <p className="text-sidebar-muted-foreground text-sm font-medium">
                                c/{community.name}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant={isMember ? "outline" : "default"}
                                className={`rounded-full px-6 ${isMember ? '' : 'bg-sidebar-foreground text-sidebar-background hover:bg-sidebar-foreground/90'}`}
                                onClick={onJoinLeave}
                            >
                                {isMember ? (
                                    <>
                                        <Minus className="w-4 h-4 mr-2" />
                                        Joined
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Join
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full">
                                <Bell className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex overflow-x-auto no-scrollbar">
                    <TabsList className="bg-transparent p-0 h-auto space-x-2">
                        <TabsTrigger
                            value="posts"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent"
                        >
                            Posts
                        </TabsTrigger>
                        <TabsTrigger
                            value="about"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent"
                        >
                            About
                        </TabsTrigger>
                        <TabsTrigger
                            value="projects"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent"
                        >
                            Projects
                        </TabsTrigger>
                        <TabsTrigger
                            value="members"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent"
                        >
                            Members
                        </TabsTrigger>
                        {isModerator && (
                            <TabsTrigger
                                value="moderation"
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent"
                            >
                                Moderation
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>
            </div>
        </div>
    );
};
