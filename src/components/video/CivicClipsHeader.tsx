import { Plus, Search, Filter, TrendingUp, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface CivicClipsHeaderProps {
    onSearchClick?: () => void
    onFilterClick?: () => void
    className?: string
}

export const CivicClipsHeader = ({
    onSearchClick,
    onFilterClick,
    className
}: CivicClipsHeaderProps) => {
    const navigate = useNavigate()

    return (
        <header className={cn(
            "relative w-full z-10 px-4 py-2",
            className
        )}>
            <div className="max-w-screen-xl mx-auto flex items-center justify-between pointer-events-auto">
                {/* Back Button + Logo */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white border border-white/10 transition-all"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-3.5 w-3.5 stroke-[2]" />
                    </Button>

                    <Link to="/" className="flex items-center gap-2 group">
                        <TrendingUp className="w-4.5 h-4.5 text-primary drop-shadow-lg" />
                        <span className="text-white font-bold text-[17px] tracking-tight drop-shadow-md">
                            CivicClips
                        </span>
                    </Link>
                </div>

                {/* Simplified Actions */}
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white/10 text-white/70 transition-colors"
                        onClick={onSearchClick}
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white/10 text-white/70 transition-colors"
                        onClick={onFilterClick}
                    >
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
