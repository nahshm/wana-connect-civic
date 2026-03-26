import { cn } from '@/lib/utils'
import { 
    Flame, 
    GraduationCap, 
    CheckCircle2, 
    Building2, 
    Lightbulb, 
    Users, 
    Scale,
    MessageSquare,
    Sparkles
} from 'lucide-react'

export type CivicCategory = 
    | 'for_you'
    | 'trending'
    | 'civic_education'
    | 'promise_update'
    | 'project_showcase'
    | 'explainer'
    | 'community_report'
    | 'accountability'
    | 'discussion'

interface CategoryTab {
    id: CivicCategory | null
    label: string
    icon: React.ReactNode
    color: string
}

const categories: CategoryTab[] = [
    { id: null, label: 'For You', icon: <Sparkles className="w-4 h-4" />, color: 'text-foreground' },
    { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'civic_education', label: 'Learn', icon: <GraduationCap className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'promise_update', label: 'Promises', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-400' },
    { id: 'project_showcase', label: 'Projects', icon: <Building2 className="w-4 h-4" />, color: 'text-purple-400' },
    { id: 'explainer', label: 'Explainers', icon: <Lightbulb className="w-4 h-4" />, color: 'text-yellow-400' },
    { id: 'community_report', label: 'Reports', icon: <Users className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'accountability', label: 'Watchdog', icon: <Scale className="w-4 h-4" />, color: 'text-red-400' },
    { id: 'discussion', label: 'Discuss', icon: <MessageSquare className="w-4 h-4" />, color: 'text-cyan-400' },
]

interface CivicClipsCategoryTabsProps {
    activeCategory: CivicCategory | null
    onCategoryChange: (category: CivicCategory | null) => void
    orientation?: 'horizontal' | 'vertical'
    className?: string
}

export const CivicClipsCategoryTabs = ({
    activeCategory,
    onCategoryChange,
    orientation = 'horizontal',
    className
}: CivicClipsCategoryTabsProps) => {
    const isVertical = orientation === 'vertical'

    return (
        <div className={cn(
            "relative w-full z-10",
            isVertical ? "py-0" : "py-2",
            className
        )}>
            <div className={cn(
                "scrollbar-hide pointer-events-auto",
                isVertical ? "h-full" : "overflow-x-auto"
            )}>
                <div className={cn(
                    "flex px-4",
                    isVertical ? "flex-col gap-1 w-full" : "gap-2 min-w-max"
                )}>
                    {categories.map((category) => {
                        const isActive = activeCategory === category.id
                        return (
                            <button
                                key={category.id ?? 'for_you'}
                                onClick={() => onCategoryChange(category.id)}
                                className={cn(
                                    "flex items-center gap-3 transition-all duration-200 border",
                                    isVertical 
                                        ? "w-full px-4 py-3 rounded-xl text-[15px] font-semibold justify-start" 
                                        : "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap",
                                    isActive 
                                        ? "bg-foreground text-background border-foreground shadow-lg" 
                                        : "bg-foreground/5 text-muted-foreground border-border/50 hover:bg-foreground/10 hover:text-foreground hover:border-border"
                                )}
                            >
                                <span className={cn(
                                    "transition-colors",
                                    isActive ? 'text-background' : category.color,
                                    isVertical ? "w-5 h-5 flex items-center justify-center" : ""
                                )}>
                                    {category.icon}
                                </span>
                                <span>{category.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
