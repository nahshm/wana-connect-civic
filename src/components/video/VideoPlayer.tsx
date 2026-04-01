import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { getVideoUrlsWithFallback, loadVideoWithRetry, getPreloadStrategy } from '@/lib/video-utils'

export interface VideoPlayerRef {
    seekTo: (time: number) => void;
    togglePlay: () => void;
    getDuration: () => number;
    getCurrentTime: () => number;
}

interface VideoPlayerProps {
    videoUrl: string
    thumbnailUrl?: string
    autoPlay?: boolean
    muted?: boolean
    loop?: boolean
    className?: string
    isActive?: boolean
    onView?: (duration: number, percentage: number) => void
    onComplete?: () => void
    onMuteChange?: (muted: boolean) => void
    /** Enable lazy loading - only loads video when near viewport */
    lazyLoad?: boolean
    /** Root margin for intersection observer (how early to start loading) */
    preloadMargin?: string
    /** Whether to show internal controls */
    showControls?: boolean
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
    videoUrl,
    thumbnailUrl,
    autoPlay = false,
    muted = true,
    loop = false,
    className,
    isActive = true,
    onView,
    onComplete,
    onMuteChange,
    lazyLoad = true,
    preloadMargin = '200px',
    showControls: showInternalControls = true
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [playing, setPlaying] = useState(autoPlay)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(muted ? 0 : 1)
    const [isMuted, setIsMuted] = useState(muted)
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const [isLoaded, setIsLoaded] = useState(!lazyLoad) // If not lazy loading, consider it loaded
    const [isBuffering, setIsBuffering] = useState(false)
    const [loadError, setLoadError] = useState<Error | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [aspectRatio, setAspectRatio] = useState<number | null>(null)

    const maxRetries = 3

    useImperativeHandle(ref, () => ({
        seekTo: (time: number) => {
            if (videoRef.current) {
                videoRef.current.currentTime = time
            }
        },
        togglePlay: () => {
            if (videoRef.current) {
                if (videoRef.current.paused) videoRef.current.play()
                else videoRef.current.pause()
            }
        },
        getDuration: () => videoRef.current?.duration || 0,
        getCurrentTime: () => videoRef.current?.currentTime || 0
    }))

    // Intersection Observer for lazy loading
    const { ref: inViewRef, inView } = useInView({
        threshold: 0,
        rootMargin: preloadMargin,
        triggerOnce: true,
    })

    // Combine refs
    const setRefs = (node: HTMLDivElement | null) => {
        containerRef.current = node
        inViewRef(node)
    }

    // Start loading video when it comes into view
    useEffect(() => {
        if (inView && lazyLoad && !isLoaded && !loadError) {
            setIsLoaded(true)
        }
    }, [inView, lazyLoad, isLoaded, loadError])

    // Handle video loading with retry on error
    useEffect(() => {
        const video = videoRef.current
        if (!video || !isLoaded || !videoUrl) return

        const handleLoadError = async () => {
            console.warn('Video load error, attempting fallback...', { url: videoUrl, attempt: retryCount })
            setLoadError(new Error('Video failed to load'))

            if (retryCount < maxRetries) {
                setRetryCount(prev => prev + 1)
                setIsBuffering(true)

                try {
                    const fallbackUrls = getVideoUrlsWithFallback(videoUrl)
                    await loadVideoWithRetry(video, fallbackUrls, 2)
                    setLoadError(null)
                    setIsBuffering(false)
                } catch (error) {
                    console.error('All video load attempts failed:', error)
                    setIsBuffering(false)
                }
            }
        }

        video.addEventListener('error', handleLoadError)
        return () => video.removeEventListener('error', handleLoadError)
    }, [isLoaded, videoUrl, retryCount, maxRetries])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime)
            if (video.duration && video.currentTime > 0) {
                if (!hasStarted && video.currentTime > 1) {
                    setHasStarted(true)
                }
            }
        }

        const handleLoadedMetadata = () => {
            setDuration(video.duration)
            if (video.videoWidth && video.videoHeight) {
                setAspectRatio(video.videoWidth / video.videoHeight)
            }
        }

        const handleEnded = () => {
            setPlaying(false)
            if (onView && video.duration) {
                onView(video.duration, 100)
            }
            onComplete?.()
        }

        const handlePlay = () => setPlaying(true)
        const handlePause = () => {
            setPlaying(false)
            if (onView && video.duration && video.currentTime > 0) {
                const percentage = (video.currentTime / video.duration) * 100
                onView(video.currentTime, percentage)
            }
        }

        video.addEventListener('timeupdate', handleTimeUpdate)
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('ended', handleEnded)
        video.addEventListener('play', handlePlay)
        video.addEventListener('pause', handlePause)

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('ended', handleEnded)
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePause)
        }
    }, [hasStarted, onView, onComplete])

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Handle play/pause based on isActive (visibility)
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handlePlayPause = async () => {
            try {
                if (isActive) {
                    if (video.paused) await video.play()
                } else {
                    if (!video.paused) video.pause()
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') return
                console.error('Video play/pause error:', error)
            }
        }
        handlePlayPause()
    }, [isActive])

    // Pause video when tab/window is not visible
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (!video.paused) video.pause()
            } else if (isActive && video.paused && autoPlay) {
                video.play().catch(() => {})
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isActive, autoPlay])

    const togglePlay = () => {
        if (videoRef.current) {
            if (playing) videoRef.current.pause()
            else videoRef.current.play()
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted
            videoRef.current.muted = newMuted
            setIsMuted(newMuted)
            setVolume(newMuted ? 0 : 1)
            onMuteChange?.(newMuted)
        }
    }

    const handleSeek = (value: number[]) => {
        if (videoRef.current) {
            videoRef.current.currentTime = value[0]
            setCurrentTime(value[0])
        }
    }

    const handleVolumeChange = (value: number[]) => {
        if (videoRef.current) {
            const newVolume = value[0]
            videoRef.current.volume = newVolume
            setVolume(newVolume)
            setIsMuted(newVolume === 0)
        }
    }

    const toggleFullscreen = () => {
        if (!containerRef.current) return
        if (!isFullscreen) containerRef.current.requestFullscreen()
        else document.exitFullscreen()
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // Handle video buffering state
    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        const handleWaiting = () => setIsBuffering(true)
        const handlePlaying = () => setIsBuffering(false)
        const handleCanPlay = () => setIsBuffering(false)
        video.addEventListener('waiting', handleWaiting)
        video.addEventListener('playing', handlePlaying)
        video.addEventListener('canplay', handleCanPlay)
        return () => {
            video.removeEventListener('waiting', handleWaiting)
            video.removeEventListener('playing', handlePlaying)
            video.removeEventListener('canplay', handleCanPlay)
        }
    }, [isLoaded])

    const isLandscape = aspectRatio && aspectRatio > 1

    return (
        <div
            ref={setRefs}
            className={cn(
                'relative bg-black overflow-hidden group h-full w-full',
                className
            )}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Background Layer: Blurred for landscape */}
            {isLandscape && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <video
                        src={isLoaded ? videoUrl : undefined}
                        className="w-full h-full object-cover blur-2xl opacity-50 contrast-125 saturate-150 scale-110"
                        muted
                        playsInline
                        loop
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
            )}

            {/* Thumbnail placeholder */}
            {(!isLoaded || !videoUrl) && thumbnailUrl && (
                <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover z-1"
                />
            )}

            {/* Loading spinner - More subtle, especially if thumbnail is present */}
            {(!isLoaded || isBuffering) && (
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center z-20 transition-all duration-300",
                    isBuffering && hasStarted ? "bg-black/20" : "bg-black/40"
                )}>
                    {(!thumbnailUrl || isBuffering) && (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className={cn(
                                "text-white animate-spin opacity-80",
                                isBuffering && hasStarted ? "h-6 w-6" : "h-10 w-10"
                            )} />
                            {isBuffering && !hasStarted && (
                                <span className="text-white/60 text-[10px] font-medium uppercase tracking-widest">Buffering</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Main Video Layer */}
            <video
                ref={videoRef}
                src={isLoaded ? videoUrl : undefined}
                poster={thumbnailUrl}
                className={cn(
                    "relative w-full h-full cursor-pointer z-10 transition-all duration-700",
                    isLandscape ? "object-contain" : "object-cover"
                )}
                autoPlay={isLoaded && autoPlay}
                muted={muted}
                loop={loop}
                playsInline
                preload={isLoaded ? getPreloadStrategy() : 'none'}
                controls={true}
                crossOrigin="anonymous"
            />
        </div>
    )
})
