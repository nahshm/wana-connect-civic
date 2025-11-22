import { CIVIC_FLAIRS, Flair } from '@/config/flairs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface FlairSelectorProps {
    selectedFlairIds?: string[]
    onSelectFlairs: (flairIds: string[]) => void
    disabled?: boolean
}

export const FlairSelector = ({ selectedFlairIds = [], onSelectFlairs, disabled }: FlairSelectorProps) => {
    const handleToggleFlair = (flairId: string) => {
        if (selectedFlairIds.includes(flairId)) {
            // Remove flair
            onSelectFlairs(selectedFlairIds.filter(id => id !== flairId))
        } else {
            // Add flair
            onSelectFlairs([...selectedFlairIds, flairId])
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Flairs (optional) - Select multiple</Label>
                {selectedFlairIds.length > 0 && (
                    <button
                        type="button"
                        onClick={() => onSelectFlairs([])}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        disabled={disabled}
                    >
                        <X className="h-3 w-3" />
                        Clear all
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {CIVIC_FLAIRS.map((flair) => {
                    const isSelected = selectedFlairIds.includes(flair.id)

                    return (
                        <Badge
                            key={flair.id}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`cursor-pointer transition-all ${isSelected
                                    ? 'ring-2 ring-primary ring-offset-2'
                                    : flair.bgColor + ' border-transparent'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                            onClick={() => !disabled && handleToggleFlair(flair.id)}
                            title={flair.description}
                        >
                            <span className={isSelected ? '' : flair.color}>
                                {flair.label}
                            </span>
                        </Badge>
                    )
                })}
            </div>

            {selectedFlairIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    {selectedFlairIds.length} flair{selectedFlairIds.length > 1 ? 's' : ''} selected
                </p>
            )}
        </div>
    )
}
