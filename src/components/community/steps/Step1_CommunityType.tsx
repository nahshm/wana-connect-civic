import { Globe, Lock, Eye, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type CommunityType = 'public' | 'restricted' | 'private';

interface Step1Props {
    value: CommunityType;
    isMature: boolean;
    onChange: (value: CommunityType) => void;
    onMatureChange: (value: boolean) => void;
}

export const Step1_CommunityType = ({ value, isMature, onChange, onMatureChange }: Step1Props) => {
    const options = [
        {
            value: 'public' as const,
            icon: Globe,
            title: 'Public',
            description: 'Anyone can view, post, and comment to this community'
        },
        {
            value: 'restricted' as const,
            icon: Eye,
            title: 'Restricted',
            description: 'Anyone can view, but only approved users can contribute'
        },
        {
            value: 'private' as const,
            icon: Lock,
            title: 'Private',
            description: 'Only approved users can view and contribute'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">What kind of community is this?</h2>
                <p className="text-muted-foreground text-sm">
                    Decide who can view and contribute to your community. Only public communities show up in search.
                    {' '}<span className="font-semibold">Important:</span> Once set, you will need to submit a request to change your community type.
                </p>
            </div>

            <div className="space-y-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
                            value === option.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                    >
                        <option.icon className="w-6 h-6 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-1">{option.title}</h3>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1",
                            value === option.value ? "border-primary" : "border-border"
                        )}>
                            {value === option.value && (
                                <div className="w-3 h-3 rounded-full bg-primary" />
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Mature (18+) Toggle */}
            <div className="flex items-center justify-between p-4 border-2 rounded-lg">
                <div className="flex items-start gap-4">
                    <Shield className="w-6 h-6 mt-1" />
                    <div>
                        <h3 className="font-semibold text-base mb-1">Mature (18+)</h3>
                        <p className="text-sm text-muted-foreground">Users must be over 18 to view and contribute</p>
                    </div>
                </div>
                <Switch
                    checked={isMature}
                    onCheckedChange={onMatureChange}
                    aria-label="Toggle mature content"
                />
            </div>
        </div>
    );
};
