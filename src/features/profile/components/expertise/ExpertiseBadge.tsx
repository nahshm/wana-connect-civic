import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, ThumbsUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Expertise type configurations
export const EXPERTISE_CONFIG: Record<string, {
    label: string;
    icon: string;
    description: string;
    color: string;
}> = {
    budget_analyst: {
        label: 'Budget Analyst',
        icon: '📊',
        description: 'Understands government budgets and finances',
        color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    },
    pothole_reporter: {
        label: 'Pothole Reporter',
        icon: '🕳️',
        description: 'Reports infrastructure issues accurately',
        color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    },
    legal_eagle: {
        label: 'Legal Eagle',
        icon: '⚖️',
        description: 'Constitutional and legal knowledge expert',
        color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    },
    community_organizer: {
        label: 'Community Organizer',
        icon: '🤝',
        description: 'Organizes community events and initiatives',
        color: 'bg-green-500/10 text-green-500 border-green-500/30',
    },
    fact_checker: {
        label: 'Fact Checker',
        icon: '🔍',
        description: 'Verifies information accuracy',
        color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
    },
    policy_analyst: {
        label: 'Policy Analyst',
        icon: '📋',
        description: 'Analyzes government policies effectively',
        color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
    },
    election_monitor: {
        label: 'Election Monitor',
        icon: '🗳️',
        description: 'Monitors elections for transparency',
        color: 'bg-red-500/10 text-red-500 border-red-500/30',
    },
    environment_guardian: {
        label: 'Environment Guardian',
        icon: '🌱',
        description: 'Champions environmental issues',
        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    },
    education_advocate: {
        label: 'Education Advocate',
        icon: '📚',
        description: 'Advocates for education improvements',
        color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    },
    health_champion: {
        label: 'Health Champion',
        icon: '🏥',
        description: 'Focuses on health-related issues',
        color: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
    },
};

interface ExpertiseBadgeProps {
    expertiseType: string;
    endorsementCount: number;
    verifiedActionsCount?: number;
    isVerified: boolean;
    canEndorse?: boolean;
    onEndorse?: () => void;
    isEndorsing?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * ExpertiseBadge - LinkedIn-style skill endorsement badge
 */
export const ExpertiseBadge: React.FC<ExpertiseBadgeProps> = ({
    expertiseType,
    endorsementCount,
    verifiedActionsCount = 0,
    isVerified,
    canEndorse = false,
    onEndorse,
    isEndorsing = false,
    size = 'md',
    className,
}) => {
    const config = EXPERTISE_CONFIG[expertiseType];
    if (!config) return null;

    const sizeClasses = {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4',
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    'rounded-lg border flex flex-col items-center gap-2 transition-all',
                    'hover:shadow-md cursor-pointer',
                    config.color,
                    sizeClasses[size],
                    isVerified && 'ring-2 ring-green-500/50',
                    className
                )}>
                    {/* Icon */}
                    <span className={cn(
                        size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'
                    )}>
                        {config.icon}
                    </span>

                    {/* Label */}
                    <span className={cn(
                        'font-medium text-center leading-tight',
                        size === 'lg' ? 'text-sm' : 'text-xs'
                    )}>
                        {config.label}
                    </span>

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-0.5">
                            <ThumbsUp className="w-3 h-3" />
                            {endorsementCount}
                        </span>
                        {verifiedActionsCount > 0 && (
                            <span className="flex items-center gap-0.5 text-green-500">
                                <CheckCircle className="w-3 h-3" />
                                {verifiedActionsCount}
                            </span>
                        )}
                    </div>

                    {/* Verified indicator */}
                    {isVerified && (
                        <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-500">
                            <CheckCircle className="w-2 h-2 mr-1" />
                            Verified
                        </Badge>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <div>
                            <p className="font-semibold">{config.label}</p>
                            <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {endorsementCount} endorsements
                        </span>
                        {verifiedActionsCount > 0 && (
                            <span className="flex items-center gap-1 text-green-500">
                                <CheckCircle className="w-3 h-3" />
                                {verifiedActionsCount} verified actions
                            </span>
                        )}
                    </div>
                    {canEndorse && onEndorse && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEndorse();
                            }}
                            disabled={isEndorsing}
                        >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            {isEndorsing ? 'Endorsing...' : 'Endorse'}
                        </Button>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
};

export default ExpertiseBadge;
