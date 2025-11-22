import { MessageSquare, AlertTriangle, AlertOctagon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export type ContentSensitivity = 'public' | 'sensitive' | 'crisis'

interface SensitivityOption {
    value: ContentSensitivity
    label: string
    description: string
    icon: React.ElementType
    colorClass: string
    bgClass: string
}

const SENSITIVITY_OPTIONS: SensitivityOption[] = [
    {
        value: 'public',
        label: 'Public Discussion',
        description: 'Regular civic discussion',
        icon: MessageSquare,
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-50 border-blue-200'
    },
    {
        value: 'sensitive',
        label: 'Sensitive Topic',
        description: 'Corruption, human rights, etc.',
        icon: AlertTriangle,
        colorClass: 'text-yellow-600',
        bgClass: 'bg-yellow-50 border-yellow-200'
    },
    {
        value: 'crisis',
        label: 'Crisis Report',
        description: 'Urgent safety/emergency issue',
        icon: AlertOctagon,
        colorClass: 'text-red-600',
        bgClass: 'bg-red-50 border-red-200'
    }
]

interface ContentSensitivitySelectorProps {
    value: ContentSensitivity
    onValueChange: (value: ContentSensitivity) => void
    disabled?: boolean
}

export const ContentSensitivitySelector = ({
    value,
    onValueChange,
    disabled
}: ContentSensitivitySelectorProps) => {
    return (
        <div className="space-y-3">
            <Label>Content Sensitivity</Label>

            <RadioGroup
                value={value}
                onValueChange={(v) => onValueChange(v as ContentSensitivity)}
                disabled={disabled}
                className="space-y-3"
            >
                {SENSITIVITY_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const isSelected = value === option.value

                    return (
                        <label
                            key={option.value}
                            className={cn(
                                'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                                isSelected
                                    ? `${option.bgClass} border-current ring-2 ring-offset-2 ring-${option.colorClass}`
                                    : 'bg-card hover:bg-accent border-border',
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <RadioGroupItem value={option.value} className="mt-1" disabled={disabled} />

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className={cn('h-5 w-5', option.colorClass)} />
                                    <span className="font-semibold">{option.label}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {option.description}
                                </p>
                            </div>
                        </label>
                    )
                })}
            </RadioGroup>

            <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                    ℹ️ All posts are attributed to your account for transparency and accountability in civic discussions.
                </p>
            </div>
        </div>
    )
}
