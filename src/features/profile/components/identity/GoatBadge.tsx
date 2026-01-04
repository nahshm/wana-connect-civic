import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Crown, Zap, Star, Shield, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoatBadgeProps {
    level: number;
    title: string;
    xp?: number;
    showLevel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

// Level tier colors
const getTierColor = (level: number): string => {
    if (level >= 40) return 'from-amber-500 to-orange-500';     // National Hero / GOAT
    if (level >= 30) return 'from-purple-500 to-pink-500';      // Regional Legend
    if (level >= 20) return 'from-blue-500 to-cyan-500';        // County Crusader
    if (level >= 10) return 'from-green-500 to-emerald-500';    // Constituency Champion
    if (level >= 5) return 'from-teal-500 to-green-500';        // Ward Guardian
    return 'from-gray-500 to-slate-500';                         // Street Monitor
};

// Level tier icon
const getTierIcon = (level: number) => {
    if (level >= 40) return <Crown className="w-4 h-4" />;
    if (level >= 30) return <Swords className="w-4 h-4" />;
    if (level >= 20) return <Shield className="w-4 h-4" />;
    if (level >= 10) return <Star className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
};

/**
 * GoatBadge - Displays user's GOAT level with tier-appropriate styling
 * Inspired by gaming rank badges
 */
export const GoatBadge: React.FC<GoatBadgeProps> = ({
    level,
    title,
    xp,
    showLevel = true,
    size = 'md',
    className,
}) => {
    const tierGradient = getTierColor(level);
    const tierIcon = getTierIcon(level);

    const badge = (
        <Badge
            variant="outline"
            className={cn(
                'border-0 text-white font-semibold shadow-lg',
                `bg-gradient-to-r ${tierGradient}`,
                sizeClasses[size],
                'flex items-center gap-1.5',
                className
            )}
        >
            {tierIcon}
            {showLevel && (
                <span className="font-bold">LVL {level}</span>
            )}
            <span className="font-normal opacity-90">•</span>
            <span>{title}</span>
        </Badge>
    );

    if (xp !== undefined) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex">
                        {badge}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-center">
                        <p className="font-semibold">{title}</p>
                        <p className="text-xs text-muted-foreground">
                            {xp.toLocaleString()} XP earned
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    }

    return badge;
};

export default GoatBadge;
