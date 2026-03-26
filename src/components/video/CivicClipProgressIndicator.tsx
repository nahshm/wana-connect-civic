import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from '@/lib/utils'

interface CivicClipProgressIndicatorProps {
    progress: number // 0-100
    onSeek?: (value: number) => void
    className?: string
}

export const CivicClipProgressIndicator = ({
    progress,
    onSeek,
    className
}: CivicClipProgressIndicatorProps) => {
    return (
        <div className={cn("w-full group/seek h-1.5 transition-all hover:h-2 cursor-pointer", className)}>
            <SliderPrimitive.Root
                defaultValue={[0]}
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={(vals) => onSeek?.(vals[0])}
                className="relative flex items-center select-none touch-none w-full h-full"
            >
                <SliderPrimitive.Track className="bg-white/20 relative grow h-1 transition-all rounded-full overflow-hidden">
                    <SliderPrimitive.Range className="absolute bg-[#FE2C55] h-full rounded-full shadow-[0_0_8px_rgba(254,44,85,0.5)] transition-all duration-300" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb 
                    className="block w-2.5 h-2.5 bg-white rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity focus:outline-none" 
                    aria-label="Progress"
                />
            </SliderPrimitive.Root>
        </div>
    )
}
