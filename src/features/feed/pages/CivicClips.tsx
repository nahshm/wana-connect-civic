import { useState, useEffect, Suspense } from 'react'
import { VideoFeed } from '@/components/video/VideoFeed'
import { VideoFeedErrorBoundary } from '@/components/video/VideoFeedErrorBoundary'
import { CivicClipsCategoryTabs, CivicCategory } from '@/components/video/CivicClipsCategoryTabs'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { initCivicClipsMonitoring } from '@/lib/civic-clips-monitoring'
import { CivicClipsFilterModal, ClipsFilters } from '@/components/civic-clips/CivicClipsFilterModal'

export const CivicClipsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    const categoryParam = searchParams.get('category') as CivicCategory | null
    const hashtag = searchParams.get('hashtag') || undefined

    const [activeCategory, setActiveCategory] = useState<CivicCategory | null>(categoryParam)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [filters, setFilters] = useState<ClipsFilters>({ sortBy: 'recent' })


    // Performance monitoring
    useEffect(() => {
        const cleanup = initCivicClipsMonitoring()
        return cleanup
    }, [])

    const handleCategoryChange = (category: CivicCategory | null) => {
        setActiveCategory(category)

        // Update URL params
        if (category) {
            setSearchParams({ category })
        } else {
            setSearchParams({})
        }
    }

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=clips`)
        }
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
        if (e.key === 'Escape') {
            setShowSearch(false)
            setSearchQuery('')
        }
    }

    return (
        <div className="h-screen bg-black flex flex-col overflow-hidden">
            {/* Mobile Tabs - The header is removed for an immersive feel */}
            <div className="md:hidden flex-none bg-black/40 backdrop-blur-xl border-b border-white/5 z-50">
                <div className="max-w-[600px] mx-auto pt-4 pb-2 px-4 overflow-hidden">
                    <CivicClipsCategoryTabs
                        activeCategory={activeCategory}
                        onCategoryChange={handleCategoryChange}
                    />
                </div>
            </div>

            {/* Main Interactive Feed Area */}
            <main className="flex-1 w-full min-h-0 flex flex-col items-center justify-center overflow-hidden">
                <div className="w-full h-full max-w-[1200px] flex justify-center">
                    <VideoFeedErrorBoundary
                        onReset={() => {
                            setActiveCategory(null)
                            window.location.reload()
                        }}
                    >
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center h-full w-full bg-black">
                                    <Loader2 className="h-10 w-10 text-white/20 animate-spin" />
                                </div>
                            }
                        >
                            <VideoFeed
                                category={activeCategory === 'trending' ? undefined : activeCategory || undefined}
                                hashtag={hashtag}
                                trending={activeCategory === 'trending'}
                                sortBy={filters.sortBy as 'recent' | 'views' | 'likes'}
                            />
                        </Suspense>
                    </VideoFeedErrorBoundary>
                </div>
            </main>

            {/* Fullscreen Search Overlay */}
            {showSearch && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="flex flex-col items-center justify-start pt-20 px-4">
                        <div className="w-full max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                            <Input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search civic clips..."
                                className="w-full h-12 pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full text-lg focus:ring-primary/50"
                            />
                            <button
                                onClick={() => {
                                    setShowSearch(false)
                                    setSearchQuery('')
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Quick Tags */}
                        <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-md">
                            {['#CDF', '#Accountability', '#ProjectWatch', '#Promise2027'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        navigate(`/civic-clips?hashtag=${encodeURIComponent(tag.slice(1))}`)
                                        setShowSearch(false)
                                    }}
                                    className="px-4 py-2 rounded-full bg-white/5 text-white/70 text-sm hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Drawer/Modal */}
            <CivicClipsFilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApplyFilters={(newFilters) => setFilters(newFilters)}
                currentFilters={filters}
            />
        </div>
    )
}
