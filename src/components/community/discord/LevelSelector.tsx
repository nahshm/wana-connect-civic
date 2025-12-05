import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Level {
    id: string;
    name: string;
    type: 'COUNTY' | 'CONSTITUENCY' | 'WARD';
    avatarUrl?: string;
}

interface LevelSelectorProps {
    levels: Level[];
    activeLevel: string;
    onChange: (levelId: string) => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ levels, activeLevel, onChange }) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="w-[60px] bg-sidebar-background flex flex-col items-center py-4 space-y-3 border-r border-sidebar-border">
            {levels.map((level) => {
                const isActive = level.id === activeLevel;

                return (
                    <div key={level.id} className="relative group flex items-center justify-center w-full shrink-0">
                        <button
                            onClick={() => onChange(level.id)}
                            className={cn(
                                'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 relative overflow-hidden',
                                isActive
                                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar-background'
                                    : 'hover:ring-2 hover:ring-sidebar-accent hover:ring-offset-2 hover:ring-offset-sidebar-background'
                            )}
                            title={level.name}
                        >
                            <Avatar className="w-full h-full">
                                <AvatarImage src={level.avatarUrl} />
                                <AvatarFallback className={cn(
                                    'text-xs font-bold',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-sidebar-accent text-sidebar-accent-foreground'
                                )}>
                                    {getInitials(level.name)}
                                </AvatarFallback>
                            </Avatar>
                        </button>

                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg border border-border">
                            <div className="font-semibold">{level.name}</div>
                            <div className="text-xs text-muted-foreground">{level.type}</div>
                            {/* Arrow */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-popover" />
                        </div>

                        {/* Active Indicator */}
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default LevelSelector;
