import React from 'react';
import { Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostInput } from '@/components/community/CreatePostInput';
import { Card, CardContent } from '@/components/ui/card';
import LeadersGrid from './LeadersGrid';
import ProjectsGrid from './ProjectsGrid';
import PromisesGrid from './PromisesGrid';
import ForumChannel from './ForumChannel';
import { GovernmentProject } from '@/types';
import { ChannelChatWindow } from '@/components/chat/ChannelChatWindow';
import { SectionErrorBoundary } from '@/components/community/CommunityErrorBoundary';

interface ChannelContentProps {
    channelId: string;
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY';
    locationValue: string;
    posts: Post[];
    projects: GovernmentProject[];
    postsLoading: boolean;
    projectsLoading: boolean;
    isAdmin?: boolean;
    communityId?: string; // For membership validation in LeadersGrid
    // New prop for full channel object
    channel?: {
        id: string;
        name: string;
        type: string;
        category: string;
        is_locked?: boolean;
    };
}

const ChannelContent: React.FC<ChannelContentProps> = ({
    channelId,
    levelType,
    locationValue,
    posts,
    projects,
    postsLoading,
    projectsLoading,
    isAdmin = false,
    communityId,
    channel
}) => {
    // Early return if channel data hasn't loaded yet
    if (!channel && channelId) {
        return (
            <div className="flex items-center justify-center p-8 h-full">
                <div className="text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading channel...</span>
                </div>
            </div>
        );
    }

    // 1. MONITORING CHANNELS (Grid Views)
    // We must check by NAME because channelId is now a UUID from the DB
    if (channel?.category === 'MONITORING' || ['our-leaders', 'projects-watch', 'promises-watch'].includes(channel?.name || '')) {
        if (channel?.name === 'our-leaders') {
            if (levelType === 'COMMUNITY') {
                return <div className="p-8 text-center text-muted-foreground">Global Identity features are only available for geographic communities (County/Constituency/Ward).</div>;
            }
            return (
                <SectionErrorBoundary section="Leaders Grid">
                    <LeadersGrid levelType={levelType} locationValue={locationValue} communityId={communityId} />
                </SectionErrorBoundary>
            );
        }
        if (channel?.name === 'projects-watch') {
            return (
                <SectionErrorBoundary section="Projects Watch">
                    <ProjectsGrid projects={projects} loading={projectsLoading} />
                </SectionErrorBoundary>
            );
        }
        if (channel?.name === 'promises-watch') {
            if (levelType === 'COMMUNITY') return null;
            return (
                <SectionErrorBoundary section="Promises Watch">
                    <PromisesGrid levelType={levelType} locationValue={locationValue} />
                </SectionErrorBoundary>
            );
        }
    }

    // 2. FORUM CHANNELS (Thread-based discussions)
    if (channel?.type === 'forum') {
        return (
            <ForumChannel
                channelId={channel.id}
                channelName={channel.name}
                communityId={communityId || ''}
            />
        );
    }

    // 3. CHAT CHANNELS (Text/Voice/Announcement)
    if (channel?.type === 'text' || channel?.type === 'announcement' || channel?.type === 'voice' || channel?.type === 'chat') {
        const isReadOnly = channel.type === 'announcement' && !isAdmin;
        return (
            <ChannelChatWindow
                channelId={channel.id}
                channelName={channel.name}
                isReadOnly={isReadOnly}
            />
        );
    }

    // 4. FALLBACK: POST FEED (Feed type or Legacy)
    return (
        <div className="p-4 md:p-6">
            <CreatePostInput />

            <div className="mt-4 space-y-4">
                {postsLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="h-32 bg-slate-200 rounded" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} onVote={() => { }} />
                    ))
                ) : (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-muted-foreground">
                                No posts yet in this channel. Be the first to post!
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ChannelContent;

