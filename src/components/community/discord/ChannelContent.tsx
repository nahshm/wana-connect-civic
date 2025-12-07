import React from 'react';
import { Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostInput } from '@/components/community/CreatePostInput';
import { Card, CardContent } from '@/components/ui/card';
import LeadersGrid from './LeadersGrid';
import ProjectsGrid from './ProjectsGrid';
import PromisesGrid from './PromisesGrid';
import { GovernmentProject } from '@/types';

interface ChannelContentProps {
    channelId: string;
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY';
    locationValue: string;
    posts: Post[];
    projects: GovernmentProject[];
    postsLoading: boolean;
    projectsLoading: boolean;
}

const ChannelContent: React.FC<ChannelContentProps> = ({
    channelId,
    levelType,
    locationValue,
    posts,
    projects,
    postsLoading,
    projectsLoading,
}) => {
    // Specialized channel views
    if (channelId === 'our-leaders') {
        if (levelType === 'COMMUNITY') {
            return (
                <div className="p-6 text-center text-muted-foreground">
                    This feature is only available for geographic communities.
                </div>
            );
        }
        return <LeadersGrid levelType={levelType} locationValue={locationValue} />;
    }

    if (channelId === 'projects-watch') {
        return <ProjectsGrid projects={projects} loading={projectsLoading} />;
    }

    if (channelId === 'promises-watch') {
        if (levelType === 'COMMUNITY') {
            return (
                <div className="p-6 text-center text-muted-foreground">
                    This feature is only available for geographic communities.
                </div>
            );
        }
        return <PromisesGrid levelType={levelType} locationValue={locationValue} />;
    }

    // Default post feed for text channels
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
