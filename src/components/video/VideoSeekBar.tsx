import * as SliderPrimitive from '@radix-ui/react-slider'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface VideoSeekBarProps {
    /** Current playback position in seconds */
    currentTime: number
    /** Total clip length in seconds */
    duration: number
    /** Called with the new position in seconds */
    onSeek: (seconds: number) => void
    /** Fired while the user is dragging so the parent can suspend tap gestures */
    onScrubChange?: (scrubbing: boolean) => void
    /** Keep the bar and timestamps permanently visible */
    alwaysVisible?: boolean
    className?: string
}

const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const VideoSeekBar = ({
    currentTime,
    duration,
    onSeek,
    onScrubChange,
    alwaysVisible = false,
    className,
}: VideoSeekBarProps) => {
    const [scrubbing, setScrubbing] = useState(false)
    const [scrubValue, setScrubValue] = useState(0)

    const max = duration > 0 ? duration : 0
    const value = scrubbing ? scrubValue : Math.min(currentTime, max)

    const beginScrub = (vals: number[]) => {
        if (!scrubbing) {
            setScrubbing(true)
            onScrubChange?.(true)
        }
        setScrubValue(vals[0])
    }

    const endScrub = (vals: number[]) => {
        onSeek(vals[0])
        setScrubbing(false)
        onScrubChange?.(false)
    }

    return (
        <div
            className={cn(
                'w-full px-3 pb-2 pt-4 transition-opacity duration-200',
                alwaysVisible || scrubbing ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100 focus-within:opacity-100',
                className
            )}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <SliderPrimitive.Root
                value={[value]}
                max={max || 1}
                step={0.1}
                disabled={max === 0}
                onValueChange={beginScrub}
                onValueCommit={endScrub}
                className="relative flex items-center select-none touch-none w-full h-5 group/seek"
                aria-label="Seek"
            >
                <SliderPrimitive.Track className="bg-white/25 relative grow h-1 rounded-full overflow-hidden transition-all group-hover/seek:h-1.5">
                    <SliderPrimitive.Range className="absolute bg-primary h-full rounded-full" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                    className={cn(
                        'block h-3.5 w-3.5 bg-white rounded-full shadow-lg transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        scrubbing ? 'scale-125' : 'scale-100'
                    )}
                    aria-label="Playback position"
                />
            </SliderPrimitive.Root>

            <div className="mt-1 flex items-center justify-between text-[11px] font-medium tabular-nums text-white/70">
                <span>{formatTime(value)}</span>
                <span>{formatTime(max)}</span>
            </div>
        </div>
    )
}
