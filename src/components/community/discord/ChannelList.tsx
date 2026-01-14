import { useState, useEffect } from 'react';
import { Hash, ChevronDown, ChevronRight, Users, Shield, FileText, Hammer, Plus, Megaphone, MessageSquare, Lock, Radio, Video, Rss } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChannelContextMenu } from './ChannelContextMenu';

interface Channel {
    id: string;
    name: string;
    type: string;
    category: 'FEED' | 'INFO' | 'MONITORING' | 'ENGAGEMENT';
    is_locked?: boolean;
    description?: string;
    emoji_prefix?: string | null;
}

interface ChannelListProps {
    channels: Channel[];
    activeChannel: string;
    onChange: (channelId: string) => void;
    levelName: string;
    isAdmin?: boolean;
    isModerator?: boolean;
    communityId?: string;
    onAddChannel?: () => void;
    onChannelUpdate?: () => void;
}

const ChannelList: React.FC<ChannelListProps> = ({
    channels,
    activeChannel,
    onChange,
    levelName,
    isAdmin = false,
    isModerator = false,
    communityId = '',
    onAddChannel,
    onChannelUpdate,
}) => {
    // Track collapsed categories (persist in localStorage)
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('collapsed_categories');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        localStorage.setItem('collapsed_categories', JSON.stringify([...collapsedCategories]));
    }, [collapsedCategories]);

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    // Order matters: FEED first, then INFO, MONITORING, ENGAGEMENT
    const categories = {
        FEED: { label: 'Feed', icon: Rss },
        INFO: { label: 'Information', icon: FileText },
        MONITORING: { label: 'Civic Watch', icon: Shield },
        ENGAGEMENT: { label: 'Community', icon: Users },
    };

    // Get icon based on channel type (only used if no emoji prefix)
    const getChannelIcon = (channel: Channel) => {
        switch (channel.type) {
            case 'announcement':
                return Megaphone;
            case 'forum':
                return MessageSquare;
            case 'chat':
            case 'text':
                return Hash;
            case 'feed':
                return Rss;
            case 'audio':
            case 'video':
            case 'voice':
                return Video;
            default:
                // Fallback based on name
                if (channel.name === 'projects-watch') return Hammer;
                if (channel.name === 'our-leaders') return Users;
                if (channel.name === 'promises-watch') return FileText;
                if (channel.name === 'baraza') return Video;
                return Hash;
        }
    };

    // Group channels with FEED first
    const groupedChannels = {
        FEED: channels.filter(c => c.category === 'FEED' || c.type === 'feed'),
        INFO: channels.filter(c => c.category === 'INFO' && c.type !== 'feed'),
        MONITORING: channels.filter(c => c.category === 'MONITORING' && c.type !== 'feed'),
        ENGAGEMENT: channels.filter(c => c.category === 'ENGAGEMENT' && c.type !== 'feed'),
    };

    const renderChannelButton = (channel: Channel) => {
        const isActive = channel.id === activeChannel;
        const ChannelIcon = getChannelIcon(channel);
        const hasEmoji = !!channel.emoji_prefix;

        return (
            <button
                onClick={() => onChange(channel.id)}
                className={cn(
                    'w-full flex items-center px-2 py-1.5 rounded text-sm font-medium transition-colors group',
                    isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
            >
                {hasEmoji ? (
                    <span className="w-4 h-4 mr-2 flex items-center justify-center text-sm flex-shrink-0">
                        {channel.emoji_prefix}
                    </span>
                ) : (
                    <ChannelIcon className={cn(
                        'w-4 h-4 mr-2 flex-shrink-0',
                        isActive ? 'text-primary' : 'text-sidebar-muted-foreground group-hover:text-sidebar-foreground'
                    )} />
                )}
                <span className="truncate flex-1 text-left">{channel.name}</span>
                {channel.is_locked && (
                    <Lock className="w-3 h-3 text-sidebar-muted-foreground/50 flex-shrink-0" />
                )}
            </button>
        );
    };

    return (
        <TooltipProvider>
            <div className="w-52 min-w-52 max-w-60 md:w-60 bg-sidebar-background flex flex-col overflow-hidden border-r border-sidebar-border flex-shrink-0">
                {/* Level Header */}
                <div className="p-4 border-b border-sidebar-border bg-sidebar-background flex items-center justify-between group">
                    <button className="flex-1 flex items-center justify-between text-left hover:bg-sidebar-accent/50 rounded px-2 py-1 transition-colors mr-2">
                        <span className="font-bold text-sidebar-foreground truncate">{levelName}</span>
                        <ChevronDown className="w-4 h-4 text-sidebar-muted-foreground group-hover:text-sidebar-foreground flex-shrink-0" />
                    </button>

                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-sidebar-muted-foreground hover:text-sidebar-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddChannel?.();
                            }}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Channels - ScrollArea for auto-hiding scrollbars */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-3">
                    {Object.entries(groupedChannels).map(([category, categoryChannels]) => {
                        if (categoryChannels.length === 0) return null;
                        const isCollapsed = collapsedCategories.has(category);

                        return (
                            <div key={category} className="mb-3">
                                {/* Category Header - Collapsible */}
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center px-2 py-1 hover:text-sidebar-foreground transition-colors group"
                                >
                                    {isCollapsed ? (
                                        <ChevronRight className="w-3 h-3 text-sidebar-muted-foreground mr-1 group-hover:text-sidebar-foreground" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3 text-sidebar-muted-foreground mr-1 group-hover:text-sidebar-foreground" />
                                    )}
                                    <h3 className="text-xs font-bold text-sidebar-muted-foreground uppercase tracking-wide group-hover:text-sidebar-foreground">
                                        {categories[category as keyof typeof categories].label}
                                    </h3>
                                </button>

                                {/* Channel List - Animated collapse */}
                                <div className={cn(
                                    'space-y-0.5 overflow-hidden transition-all duration-200',
                                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
                                )}>
                                    {categoryChannels.map((channel) => (
                                        <Tooltip key={channel.id}>
                                            <TooltipTrigger asChild>
                                                {/* Wrap in context menu for right-click */}
                                                <div>
                                                    <ChannelContextMenu
                                                        channel={channel}
                                                        isAdmin={isAdmin}
                                                        isModerator={isModerator}
                                                        communityId={communityId}
                                                        onChannelUpdate={onChannelUpdate}
                                                    >
                                                        {renderChannelButton(channel)}
                                                    </ChannelContextMenu>
                                                </div>
                                            </TooltipTrigger>
                                            {channel.description && (
                                                <TooltipContent side="right" className="max-w-xs">
                                                    <p className="text-xs">{channel.description}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
};

export default ChannelList;
