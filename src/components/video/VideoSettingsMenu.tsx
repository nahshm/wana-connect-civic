import { Settings, Check, Captions } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PLAYBACK_SPEEDS } from '@/hooks/usePlaybackPrefs'
import { cn } from '@/lib/utils'

interface VideoSettingsMenuProps {
    rate: number
    onRateChange: (rate: number) => void
    captionsAvailable: boolean
    captionsEnabled: boolean
    onCaptionsToggle: () => void
    className?: string
}

export const VideoSettingsMenu = ({
    rate,
    onRateChange,
    captionsAvailable,
    captionsEnabled,
    onCaptionsToggle,
    className,
}: VideoSettingsMenuProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Playback settings"
                    className={cn(
                        'h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all',
                        className
                    )}
                >
                    <Settings className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-44 bg-black/90 backdrop-blur-xl border-white/10 text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenuLabel className="text-white/50 text-[11px] uppercase tracking-widest">
                    Playback speed
                </DropdownMenuLabel>
                {PLAYBACK_SPEEDS.map((speed) => (
                    <DropdownMenuItem
                        key={speed}
                        onClick={() => onRateChange(speed)}
                        className="focus:bg-white/10 focus:text-white cursor-pointer justify-between"
                    >
                        <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                        {rate === speed && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                ))}

                {captionsAvailable && (
                    <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            onClick={onCaptionsToggle}
                            className="focus:bg-white/10 focus:text-white cursor-pointer justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <Captions className="h-3.5 w-3.5" />
                                Captions
                            </span>
                            <span className="text-[11px] text-white/60">{captionsEnabled ? 'On' : 'Off'}</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
