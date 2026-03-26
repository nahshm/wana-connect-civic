import { useState, useRef, useEffect } from 'react'
import { VideoPlayer, VideoPlayerRef } from './VideoPlayer'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowBigUp, ArrowBigDown, MessageCircle, Bookmark, Share2, Eye, Volume2, VolumeX, Plus, Music, MoreHorizontal, Check, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { copyToClipboard } from '@/lib/clipboard-utils'
import { CivicClipAccountabilityBadge } from './CivicClipAccountabilityBadge'
import { CivicClipProgressIndicator } from './CivicClipProgressIndicator'
import { SafeContentRenderer } from '@/components/posts/SafeContentRenderer'
import { buildProfileLink } from '@/lib/profile-links'
import { cn } from '@/lib/utils'

interface PostAuthor {
    username: string
    display_name?: string
    avatar_url?: string
    is_verified?: boolean
    official_position?: string
}

interface PostCommunity {
    name: string
}

interface Post {
    id: string
    title: string
    content?: string
    created_at?: string
    votes_count: number
    comment_count: number
    author?: PostAuthor
    community?: PostCommunity
}

interface Clip {
    id: string
    video_url: string
    thumbnail_url?: string
    category?: string
    views_count?: number
    duration?: number
    post?: Post
}

interface CivicClipCardProps {
    clip: Clip
    isActive: boolean
    isMuted: boolean
    onMuteToggle: (muted: boolean) => void
    showAccountability?: boolean
}

export const CivicClipCard = ({ clip, isActive, isMuted, onMuteToggle, showAccountability = false }: CivicClipCardProps) => {
    const { user } = useAuth()
    const { toast } = useToast()
    const videoPlayerRef = useRef<VideoPlayerRef>(null)
    const [voteType, setVoteType] = useState<'upvote' | 'downvote' | null>(null)
    const [saved, setSaved] = useState(false)
    const [votes, setVotes] = useState(clip.post?.votes_count || 0)
    const [progress, setProgress] = useState(0)
    const [isFollowed, setIsFollowed] = useState(false)
    const [showVotePop, setShowVotePop] = useState(false)
    const [tapCount, setTapCount] = useState(0)
    const tapTimerRef = useRef<NodeJS.Timeout | null>(null)

    const post = clip.post
    const author = post?.author
    const community = post?.community

    const handleVote = async (type: 'upvote' | 'downvote') => {
        if (!user || !post) return
        
        const isCurrentlyActive = voteType === type
        const previousVoteType = voteType
        
        try {
            // Optimistic Update
            if (isCurrentlyActive) {
                setVoteType(null)
                setVotes(prev => type === 'upvote' ? prev - 1 : prev + 1)
                await supabase.from('votes').delete().eq('post_id', post.id).eq('user_id', user.id)
            } else {
                setVoteType(type)
                let voteDiff = 1
                if (previousVoteType) {
                    voteDiff = 2 // Switching from up to down or vice versa
                }
                
                if (type === 'upvote') {
                    setVotes(prev => prev + (previousVoteType === 'downvote' ? 2 : 1))
                } else {
                    setVotes(prev => prev - (previousVoteType === 'upvote' ? 2 : 1))
                }
                
                await supabase.from('votes').upsert({ 
                    post_id: post.id, 
                    user_id: user.id, 
                    vote_type: type 
                })
            }
        } catch (error) {
            console.error('Error toggling vote:', error)
        }
    }

    const triggerVotePop = () => {
        setShowVotePop(false)
        setTimeout(() => setShowVotePop(true), 10)
        setTimeout(() => setShowVotePop(false), 1000)
    }

    const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        const newTapCount = tapCount + 1
        setTapCount(newTapCount)

        if (newTapCount === 1) {
            tapTimerRef.current = setTimeout(() => {
                togglePlay()
                setTapCount(0)
            }, 250)
        } else if (newTapCount === 2) {
            if (tapTimerRef.current) {
                clearTimeout(tapTimerRef.current)
                tapTimerRef.current = null
            }
            if (voteType !== 'upvote') handleVote('upvote')
            triggerVotePop()
            setTapCount(0)
        }
    }

    const togglePlay = () => {
        if (videoPlayerRef.current) {
            videoPlayerRef.current.togglePlay()
        }
    }

    const handleSave = async () => {
        if (!user || !post) return
        try {
            if (saved) {
                await (supabase.from('saved_posts') as any).delete().eq('post_id', post.id).eq('user_id', user.id)
                setSaved(false)
                toast({ title: 'Removed from saved' })
            } else {
                await (supabase.from('saved_posts') as any).insert({ post_id: post.id, user_id: user.id })
                setSaved(true)
                toast({ title: 'Saved to collection' })
            }
        } catch (error) {
            console.error('Error toggling save:', error)
        }
    }

    const handleShare = async () => {
        if (!post) return
        const url = `${window.location.origin}/post/${post.id}`
        if (navigator.share) {
            try {
                await navigator.share({ title: post.title, text: post.content, url })
            } catch (error) {
                console.debug('Share cancelled or failed:', error)
            }
        } else {
            copyToClipboard(url, 'Link copied to clipboard')
        }
    }

    const handleView = (duration: number, percentage: number) => {
        setProgress(percentage)
    }

    const handleSeek = (percentage: number) => {
        if (videoPlayerRef.current) {
            const duration = videoPlayerRef.current.getDuration()
            if (duration) {
                videoPlayerRef.current.seekTo((percentage / 100) * duration)
            }
        }
    }

    const toggleMute = () => onMuteToggle(!isMuted)

    const formatCategory = (category?: string) => {
        if (!category) return ''
        return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    return (
        <div className="relative h-full w-full snap-start snap-always bg-black select-none overflow-hidden md:flex md:flex-col md:items-center md:justify-start md:py-8 md:px-4">
            
            {/* 1. Desktop Author Header (md+ only) - Thinner and more elegant */}
            <div className="hidden md:flex w-full max-w-[500px] lg:max-w-[600px] mb-3 items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3">
                    <Link to={buildProfileLink({ username: author?.username ?? '', is_verified: author?.is_verified, official_position: author?.official_position })}>
                        <Avatar className="h-11 w-11 ring-2 ring-white/5 hover:ring-primary/40 transition-all">
                            <AvatarImage src={author?.avatar_url} />
                            <AvatarFallback className="bg-zinc-800 text-white font-bold">{author?.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex flex-col">
                        <Link to={buildProfileLink({ username: author?.username ?? '', is_verified: author?.is_verified, official_position: author?.official_position })} className="text-white font-bold text-[15px] hover:underline flex items-center gap-1">
                            {author?.username || 'anonymous'}
                            {author?.is_verified && <Check className="h-3 w-3 text-primary fill-primary" />}
                        </Link>
                        <span className="text-white/50 text-[12px]">{author?.display_name}</span>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 rounded-md border border-white/10 text-white hover:bg-white/5 font-bold px-4"
                    onClick={(e) => { e.stopPropagation(); setIsFollowed(!isFollowed); }}
                >
                    {isFollowed ? 'Following' : 'Follow'}
                </Button>
            </div>

            {/* 2. Main Content Group (Video + Buttons) */}
            <div className="relative w-full h-full md:h-auto md:flex md:flex-row md:items-end md:justify-center md:gap-5">
                
                {/* Video Container - Optimized for Full Height on Desktop */}
                <div className="relative h-full w-full md:h-[calc(100vh-160px)] md:max-h-[850px] md:w-auto md:aspect-[9/16] md:rounded-2xl md:overflow-hidden md:shadow-[0_0_60px_-15px_rgba(0,0,0,0.7)] md:border md:border-white/10 group/card">
                    
                    {/* Video Layer */}
                    <div className="absolute inset-0 z-0 bg-zinc-900">
                        <VideoPlayer
                            ref={videoPlayerRef}
                            videoUrl={clip.video_url}
                            thumbnailUrl={clip.thumbnail_url}
                            autoPlay={isActive}
                            isActive={isActive}
                            muted={isMuted}
                            loop={true}
                            onView={handleView}
                            onMuteChange={onMuteToggle}
                            showControls={false}
                            className="h-full w-full"
                        />
                    </div>

                    {/* Gesture Overlay */}
                    <div 
                        className="absolute inset-0 z-10 cursor-pointer"
                        onClick={handleInteraction}
                    />

                    {/* Visual Overlays */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                        
                        {showVotePop && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <ArrowBigUp className="h-28 w-28 text-white/80 fill-white animate-heart-pop" />
                            </div>
                        )}
                    </div>

                    {/* Top Left Group: Category + Mute */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-30 overflow-hidden">
                        {clip.category && (
                            <Badge className="bg-black/40 backdrop-blur-md border-white/10 text-white font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 whitespace-nowrap">
                                {formatCategory(clip.category)}
                            </Badge>
                        )}
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                            className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                        >
                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Mobile-Only Info (Overlaid) */}
                    <div className="md:hidden absolute inset-x-0 bottom-0 p-4 pb-12 flex flex-col gap-3 z-30 pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <Avatar className="h-9 w-9 ring-1 ring-white/20">
                                <AvatarImage src={author?.avatar_url} />
                                <AvatarFallback className="bg-white/10 text-white text-xs">{author?.display_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-white font-bold text-sm drop-shadow-md">@{author?.username}</span>
                        </div>
                        <h3 className="text-white text-sm font-medium leading-tight drop-shadow-lg pointer-events-auto line-clamp-2">
                            {post?.title}
                        </h3>
                    </div>

                    {/* Bottom Progress Line */}
                    <div className="absolute bottom-0 left-0 right-0 pointer-events-auto z-50">
                        <CivicClipProgressIndicator 
                            progress={progress} 
                            onSeek={handleSeek}
                            className="p-0"
                        />
                    </div>
                </div>

                {/* Interaction Stack (Vertical Beside Video on Desktop) */}
                <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-40 md:static md:flex md:w-12 md:mb-1 pointer-events-none">
                    {/* Upvote */}
                    <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleVote('upvote'); }}
                            className={cn(
                                "h-11 w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all bg-zinc-900/80 md:bg-zinc-800/40 backdrop-blur-xl border border-white/10 shadow-xl",
                                voteType === 'upvote' ? "bg-primary text-white border-primary" : "hover:bg-white/10 text-white/80"
                            )}
                        >
                            <ArrowBigUp className={cn("h-6 w-6 md:h-7 md:w-7 transition-all", voteType === 'upvote' ? "fill-white" : "fill-none")} strokeWidth={2.5} />
                        </button>
                        <span className="text-white/90 text-[11px] font-bold">{votes.toLocaleString()}</span>
                    </div>

                    {/* Comment */}
                    <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
                        <Link 
                            to={`/post/${post?.id}`} 
                            className="h-11 w-11 md:h-12 md:w-12 rounded-full bg-zinc-900/80 md:bg-zinc-800/40 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 shadow-xl text-white/80"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MessageCircle className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.5} />
                        </Link>
                        <span className="text-white/90 text-[11px] font-bold">{post?.comment_count || '0'}</span>
                    </div>

                    {/* Save */}
                    <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSave(); }} 
                            className={cn(
                                "h-11 w-11 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-all bg-zinc-900/80 md:bg-zinc-800/40 backdrop-blur-xl border border-white/10 shadow-xl",
                                saved ? "bg-amber-500 text-white border-amber-500" : "hover:bg-white/10 text-white/80"
                            )}
                        >
                            <Bookmark className={cn("h-6 w-6 md:h-7 md:w-7 transition-all", saved ? "fill-white" : "fill-none")} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Share */}
                    <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleShare(); }} 
                            className="h-11 w-11 md:h-12 md:w-12 rounded-full bg-zinc-900/80 md:bg-zinc-800/40 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 shadow-xl text-white/80"
                        >
                            <Share2 className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* More */}
                    <button className="h-8 w-8 flex items-center justify-center text-white/30 hover:text-white transition-colors pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* 3. Desktop Bottom Information (md+ only) */}
            <div className="hidden md:flex w-full max-w-[500px] lg:max-w-[600px] mt-5 flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-auto">
                <h2 className="text-white text-[17px] font-bold leading-tight line-clamp-2">{post?.title}</h2>
                {post?.content && (
                    <div className="text-white/60 text-[14px] leading-relaxed line-clamp-3">
                        <SafeContentRenderer content={post.content} />
                    </div>
                )}
                {community && (
                    <Link to={`/r/${community.name}`} className="inline-flex items-center gap-1.5 text-primary/80 hover:text-primary transition-colors text-sm font-bold w-fit">
                        <Users className="h-3.5 w-3.5" />
                        <span>r/{community.name}</span>
                    </Link>
                )}
            </div>
        </div>
    )
}

