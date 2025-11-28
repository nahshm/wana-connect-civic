import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MAX_NAME_LENGTH = 21;
const MAX_DESC_LENGTH = 500;
const MAX_RULES_LENGTH = 1000;
const MAX_TAGS = 5;

interface Step2Props {
    data: {
        name: string;
        description: string;
        rules?: string;
        moderation_type?: 'admin' | 'elected' | 'community';
        tags?: string[];
    };
    onChange: (data: any) => void;
}

export const Step2_NameDescription = ({ data, onChange }: Step2Props) => {
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && (!data.tags || data.tags.length < MAX_TAGS) && !data.tags?.includes(trimmedTag)) {
            onChange({
                ...data,
                tags: [...(data.tags || []), trimmedTag]
            });
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange({
            ...data,
            tags: (data.tags || []).filter(tag => tag !== tagToRemove)
        });
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold mb-2">Create a New Community</h2>
                <p className="text-muted-foreground">
                    Establish a space for people to connect, discuss, and take action on civic matters.
                </p>
            </div>

            {/* Community Basics */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold">Community Basics</h3>

                {/* Community Name */}
                <div>
                    <Label htmlFor="name" className="text-base font-medium">
                        Community Name <span className="text-destructive">*</span>
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
                            className="pl-8 font-mono h-12"
                            placeholder="communityname"
                        />
                        <div className="text-xs text-muted-foreground text-right mt-1">
                            {data.name.length}/{MAX_NAME_LENGTH}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <Label htmlFor="description" className="text-base font-medium">
                        Community Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => onChange({ ...data, description: e.target.value })}
                        maxLength={MAX_DESC_LENGTH}
                        rows={6}
                        className="mt-2 resize-none"
                        placeholder="Provide a detailed description of your community's purpose and what members can expect."
                    />
                    <div className="text-xs text-muted-foreground text-right mt-1">
                        {data.description.length}/{MAX_DESC_LENGTH}
                    </div>
                </div>
            </div>

            {/* Community Guidelines */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold">Community Guidelines</h3>

                <div>
                    <Label htmlFor="rules" className="text-base font-medium">
                        Community Rules
                    </Label>
                    <Textarea
                        id="rules"
                        value={data.rules || ''}
                        onChange={(e) => onChange({ ...data, rules: e.target.value })}
                        maxLength={MAX_RULES_LENGTH}
                        rows={6}
                        className="mt-2 resize-none"
                        placeholder="e.g., Be respectful, No hate speech, Stay on topic..."
                    />
                    <div className="text-xs text-muted-foreground text-right mt-1">
                        {(data.rules || '').length}/{MAX_RULES_LENGTH}
                    </div>
                </div>
            </div>

            {/* Community Settings */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold">Community Settings</h3>

                {/* Moderation Preferences */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">Moderation Preferences</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    Choose how your community will be moderated. This can be changed later in community settings.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <RadioGroup
                        value={data.moderation_type || 'admin'}
                        onValueChange={(value: 'admin' | 'elected' | 'community') =>
                            onChange({ ...data, moderation_type: value })
                        }
                        className="flex flex-col sm:flex-row gap-3"
                    >
                        <Label
                            htmlFor="admin"
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex-1"
                        >
                            <RadioGroupItem value="admin" id="admin" />
                            <span className="font-medium">Admin-appointed</span>
                        </Label>
                        <Label
                            htmlFor="elected"
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex-1"
                        >
                            <RadioGroupItem value="elected" id="elected" />
                            <span className="font-medium">Elected Moderators</span>
                        </Label>
                        <Label
                            htmlFor="community"
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex-1"
                        >
                            <RadioGroupItem value="community" id="community" />
                            <span className="font-medium">Community-based</span>
                        </Label>
                    </RadioGroup>
                </div>

                {/* Categories / Tags */}
                <div className="space-y-2">
                    <Label className="text-base font-medium">Categories / Tags</Label>
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2">
                        {(data.tags || []).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="gap-1 pr-1">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="rounded-sm hover:bg-muted"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            onBlur={addTag}
                            disabled={(data.tags || []).length >= MAX_TAGS}
                            className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 px-2"
                            placeholder="Add a tag..."
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Add up to {MAX_TAGS} tags to help others discover your community. ({(data.tags || []).length}/{MAX_TAGS})
                    </p>
                </div>
            </div>
        </div>
    );
};
