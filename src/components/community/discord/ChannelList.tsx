import React from 'react';
import { Hash, ChevronDown, Users, Shield, FileText, Hammer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Channel {
    id: string;
    name: string;
    category: 'INFO' | 'MONITORING' | 'ENGAGEMENT';
}

interface ChannelListProps {
    channels: Channel[];
    activeChannel: string;
    onChange: (channelId: string) => void;
    levelName: string;
}

const ChannelList: React.FC<ChannelListProps> = ({ channels, activeChannel, onChange, levelName }) => {
    const categories = {
        INFO: { label: 'Information', icon: FileText },
        MONITORING: { label: 'Monitoring', icon: Shield },
        ENGAGEMENT: { label: 'Engagement', icon: Users },
    };

    const getChannelIcon = (channelName: string) => {
        if (channelName === 'projects-watch') return Hammer;
        if (channelName === 'our-leaders') return Users;
        if (channelName === 'promises-watch') return FileText;
        return Hash;
    };

    const groupedChannels = {
        INFO: channels.filter(c => c.category === 'INFO'),
        MONITORING: channels.filter(c => c.category === 'MONITORING'),
        ENGAGEMENT: channels.filter(c => c.category === 'ENGAGEMENT'),
    };

    return (
        <div className="w-60 bg-sidebar-background flex flex-col overflow-hidden border-r border-sidebar-border">
            {/* Level Header */}
            <div className="p-4 border-b border-sidebar-border bg-sidebar-background">
                <button className="w-full flex items-center justify-between text-left group hover:bg-sidebar-accent/50 rounded px-2 py-1 transition-colors">
                    <span className="font-bold text-sidebar-foreground truncate">{levelName}</span>
                    <ChevronDown className="w-4 h-4 text-sidebar-muted-foreground group-hover:text-sidebar-foreground flex-shrink-0" />
                </button>
            </div>

            {/* Channels */}
            <div className="flex-1 p-2">
                {Object.entries(groupedChannels).map(([category, categoryChannels]) => {
                    if (categoryChannels.length === 0) return null;
                    const CategoryIcon = categories[category as keyof typeof categories].icon;

                    return (
                        <div key={category} className="mb-4">
                            {/* Category Header */}
                            <div className="flex items-center px-2 mb-1">
                                <CategoryIcon className="w-3 h-3 text-sidebar-muted-foreground mr-1" />
                                <h3 className="text-xs font-bold text-sidebar-muted-foreground uppercase tracking-wide">
                                    {categories[category as keyof typeof categories].label}
                                </h3>
                            </div>

                            {/* Channel List */}
                            <div className="space-y-0.5">
                                {categoryChannels.map((channel) => {
                                    const isActive = channel.id === activeChannel;
                                    const ChannelIcon = getChannelIcon(channel.name);

                                    return (
                                        <button
                                            key={channel.id}
                                            onClick={() => onChange(channel.id)}
                                            className={cn(
                                                'w-full flex items-center px-2 py-1.5 rounded text-sm font-medium transition-colors group',
                                                isActive
                                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-4 border-primary'
                                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                            )}
                                        >
                                            <ChannelIcon className={cn(
                                                'w-4 h-4 mr-2 flex-shrink-0',
                                                isActive ? 'text-primary' : 'text-sidebar-muted-foreground group-hover:text-sidebar-foreground'
                                            )} />
                                            <span className="truncate">{channel.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChannelList;
