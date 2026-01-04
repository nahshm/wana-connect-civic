import React from 'react';
import { BadgeCheck, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
    /** Size of the badge icon */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** The official's position title (shown in tooltip) */
    positionTitle?: string;
    /** Whether to show as inline icon or as a badge with text */
    variant?: 'icon' | 'badge';
    /** Additional CSS classes */
    className?: string;
}

const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
};

/**
 * Verified Official Badge Component
 * Displays a blue checkmark for verified government officials
 * 
 * Usage:
 * - Icon only: <VerifiedBadge size="sm" />
 * - With tooltip: <VerifiedBadge positionTitle="Governor of Nairobi" />
 * - As badge: <VerifiedBadge variant="badge" positionTitle="MP" />
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
    size = 'sm',
    positionTitle,
    variant = 'icon',
    className,
}) => {
    const iconSize = sizeClasses[size];

    if (variant === 'badge') {
        return (
            <Badge
                variant="secondary"
                className={cn(
                    "text-[10px] bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
                    className
                )}
            >
                <BadgeCheck className="w-3 h-3 mr-1" />
                {positionTitle || 'Verified Official'}
            </Badge>
        );
    }

    const icon = (
        <BadgeCheck
            className={cn(iconSize, "text-blue-500 flex-shrink-0", className)}
            aria-label="Verified Official"
        />
    );

    if (positionTitle) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center">
                        {icon}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <div>
                            <p className="font-semibold text-sm">Verified Official</p>
                            <p className="text-xs text-muted-foreground">{positionTitle}</p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    }

    return icon;
};

/**
 * Official Position Badge - shows the position title
 */
export const OfficialPositionBadge: React.FC<{
    position: string;
    className?: string;
}> = ({ position, className }) => (
    <Badge
        variant="outline"
        className={cn(
            "text-[10px] border-blue-500/40 text-blue-600 dark:text-blue-400",
            className
        )}
    >
        <Shield className="w-3 h-3 mr-1" />
        {position}
    </Badge>
);

export default VerifiedBadge;
