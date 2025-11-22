import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommunityProfile } from '@/types/index';
import { useAuth } from '@/contexts/AuthContext';

interface CommunityGuideModalProps {
    community: CommunityProfile;
    trigger: React.ReactNode;
}

export const CommunityGuideModal = ({ community, trigger }: CommunityGuideModalProps) => {
    const { user } = useAuth();

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-sidebar-background border-sidebar-border text-sidebar-foreground">
                <DialogHeader>
                    <div className="h-24 w-full bg-gradient-to-r from-red-600 to-green-600 rounded-t-lg mb-4 relative">
                        <div className="absolute -bottom-6 left-6">
                            <Avatar className="w-16 h-16 border-4 border-sidebar-background">
                                <AvatarImage src={(community as any).avatar_url} />
                                <AvatarFallback>{community.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <DialogTitle className="mt-8 px-6 text-2xl font-bold">Welcome to r/{community.name}</DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 space-y-6">
                    <div className="space-y-2">
                        <p className="text-lg font-medium">Hey There u/{user?.user_metadata?.username || 'Guest'}!</p>
                        <p className="text-sidebar-muted-foreground leading-relaxed">
                            Welcome to r/{community.name}. Keep it respectful and decent. Check out our rules before posting.
                            Avoid NSFW Discussions and keep the topics relevant to {community.name}. Karibu!
                        </p>
                        <p className="font-medium mt-2">- r/{community.name} Mod Team</p>
                    </div>

                    <div className="bg-sidebar-accent/50 p-4 rounded-lg flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-medium text-sm">Set your flair</p>
                            <p className="text-xs text-sidebar-muted-foreground">Show us where you are from, within or outside</p>
                        </div>
                        <Button variant="secondary" size="sm">Edit Flair</Button>
                    </div>

                    <Button className="w-full rounded-full font-bold text-lg h-12">
                        Got It
                    </Button>

                    <p className="text-center text-xs text-sidebar-muted-foreground">
                        Access the community guide any time in the sidebar
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
