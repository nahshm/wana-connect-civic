import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateChannelDialogProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    onChannelCreated: (channel: any) => void;
}

export const CreateChannelDialog: React.FC<CreateChannelDialogProps> = ({
    isOpen,
    onClose,
    communityId,
    onChannelCreated,
}) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('text');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('channels')
                .insert({
                    community_id: communityId,
                    name: name.toLowerCase().replace(/\s+/g, '-'),
                    type,
                    description,
                    created_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: 'Channel created',
                description: `#${name} has been created successfully.`,
            });

            onChannelCreated(data);
            onClose();
            setName('');
            setDescription('');
            setType('text');
        } catch (error: any) {
            console.error('Error creating channel:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create channel',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                    <DialogDescription>
                        Add a new discussion channel to your community.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Channel Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Text Channel</SelectItem>
                                <SelectItem value="announcement">Announcement</SelectItem>
                                {/* Voice support can be added later */}
                                {/* <SelectItem value="voice">Voice Channel</SelectItem> */}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Channel Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. general-chat"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            minLength={2}
                            maxLength={30}
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Lowercase, no spaces. Will be formatted automatically.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="What is this channel for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={100}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !name}>
                            {loading ? 'Creating...' : 'Create Channel'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
