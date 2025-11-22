import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_NAME_LENGTH = 21;
const MAX_DESC_LENGTH = 500;

interface Step2Props {
    data: {
        name: string;
        description: string;
    };
    onChange: (data: any) => void;
}

export const Step2_NameDescription = ({ data, onChange }: Step2Props) => {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Tell us about your community</h2>
                <p className="text-muted-foreground text-sm">
                    A name and description help people understand what your community is all about.
                </p>
            </div>

            {/* Community Name */}
            <div>
                <Label htmlFor="name" className="text-sm font-medium">
                    Community name <span className="text-destructive">*</span>
                </Label>
                <div className="mt-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                        c/
                    </span>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                            onChange({ ...data, name: value });
                        }}
                        maxLength={MAX_NAME_LENGTH}
                        className="pl-8 font-mono"
                        placeholder="communityname"
                    />
                    <div className="text-xs text-muted-foreground text-right mt-1">
                        {data.name.length}/{MAX_NAME_LENGTH}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Community names including capitalization cannot be changed. Use only lowercase letters, numbers, and underscores.
                </p>
            </div>

            {/* Description */}
            <div>
                <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => onChange({ ...data, description: e.target.value })}
                    maxLength={MAX_DESC_LENGTH}
                    rows={8}
                    className="mt-2 resize-none"
                    placeholder="What is your community about? What will people find here?"
                />
                <div className="text-xs text-muted-foreground text-right mt-1">
                    {data.description.length}/{MAX_DESC_LENGTH}
                </div>
            </div>
        </div>
    );
};
