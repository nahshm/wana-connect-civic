import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
    videoUrl: string
    thumbnailUrl?: string
    autoPlay?: boolean
    muted?: boolean
    loop?: boolean
    className?: string
    onView?: (duration: number, percentage: number) => void
    onComplete?: () => void
}

export const VideoPlayer = ({
    videoUrl,
    thumbnailUrl,
    autoPlay = false,
    muted = true,
    loop = false,
    className,
    onView,
    onComplete
}: VideoPlayerProps) => {
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

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime)

            // Track viewing progress
            if (video.duration && video.currentTime > 0) {
                const percentage = (video.currentTime / video.duration) * 100
                if (!hasStarted && video.currentTime > 1) {
                    setHasStarted(true)
                }
            }
        }

        const handleLoadedMetadata = () => {
            setDuration(video.duration)
        }

        const handleEnded = () => {
            setPlaying(false)

            // Track view completion
            if (onView && video.duration) {
                const percentage = 100
                onView(video.duration, percentage)
            }

            onComplete?.()
        }

        const handlePlay = () => {
            setPlaying(true)
        }

        const handlePause = () => {
            setPlaying(false)

            // Track partial view
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

    const togglePlay = () => {
        if (videoRef.current) {
            if (playing) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted
            videoRef.current.muted = newMuted
            setIsMuted(newMuted)
            setVolume(newMuted ? 0 : 1)
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

        if (!isFullscreen) {
            containerRef.current.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative aspect-[9/16] bg-black rounded-lg overflow-hidden group',
                className
            )}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                className="w-full h-full object-contain cursor-pointer"
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                playsInline
                onClick={togglePlay}
            />

            {/* Play/Pause Overlay */}
            {!playing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity">
                    <Button
                        size="lg"
                        variant="ghost"
                        className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                        onClick={togglePlay}
                    >
                        <Play className="h-8 w-8 text-white fill-white" />
                    </Button>
                </div>
            )}

            {/* Controls */}
            <div
                className={cn(
                    'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity',
                    showControls || !playing ? 'opacity-100' : 'opacity-0'
                )}
            >
                {/* Progress Bar */}
                <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="mb-3 cursor-pointer"
                />

                <div className="flex items-center justify-between text-white text-sm">
                    <div className="flex items-center gap-2">
                        {/* Play/Pause */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-white/20"
                            onClick={togglePlay}
                        >
                            {playing ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </Button>

                        {/* Volume */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-white/20"
                                onClick={toggleMute}
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="h-4 w-4" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </Button>

                            <Slider
                                value={[volume]}
                                max={1}
                                step={0.1}
                                onValueChange={handleVolumeChange}
                                className="w-20 hidden sm:block"
                            />
                        </div>

                        {/* Time */}
                        <span className="text-xs font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Fullscreen */}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/20"
                        onClick={toggleFullscreen}
                    >
                        {isFullscreen ? (
                            <Minimize className="h-4 w-4" />
                        ) : (
                            <Maximize className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
