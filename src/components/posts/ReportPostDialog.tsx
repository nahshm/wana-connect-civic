import React, { useState } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Flag, AlertTriangle, ShieldCheck, AlertOctagon, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReportPostDialogProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
}

const REPORT_REASONS = [
    { id: 'misinformation', label: 'Misinformation', description: 'False or misleading civic information.', icon: <AlertTriangle className="w-4 h-4 text-orange-500" /> },
    { id: 'hate_speech', label: 'Hate Speech', description: 'Attack based on identity or group.', icon: <AlertOctagon className="w-4 h-4 text-destructive" /> },
    { id: 'harassment', label: 'Harassment', description: 'Targeted bullying or abuse.', icon: <Flag className="w-4 h-4 text-destructive" /> },
    { id: 'not_civic', label: 'Not Civic Related', description: 'Does not belong on a civic platform.', icon: <Info className="w-4 h-4 text-blue-500" /> },
    { id: 'spam', label: 'Spam', description: 'Commercial or repetitive content.', icon: <ShieldCheck className="w-4 h-4 text-muted-foreground" /> },
];

export const ReportPostDialog: React.FC<ReportPostDialogProps> = ({ 
    postId, 
    isOpen, 
    onClose 
}) => {
    const { user } = useAuth();
    const [reason, setReason] = useState('misinformation');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user) return;
        
        setIsSubmitting(true);
        try {
            const { error } = await (supabase as any).from('post_reports').insert({
                reporter_id: user.id,
                post_id: postId,
                reason: reason,
                details: details.trim() || null
            });

            if (error) throw error;

            toast.success('Report submitted', {
                description: 'Thank you for helping keep our civic space safe.'
            });
            onClose();
        } catch (error) {
            console.error('Error reporting post:', error);
            toast.error('Failed to submit report', {
                description: 'Please try again later'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-card border-border shadow-2xl backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Flag className="w-5 h-5 text-destructive" />
                        Report Post
                    </DialogTitle>
                    <DialogDescription>
                        Help us understand what's wrong with this post. Your report is anonymous to the author.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <RadioGroup 
                        value={reason} 
                        onValueChange={setReason}
                        className="grid gap-3"
                    >
                        {REPORT_REASONS.map((item) => (
                            <div key={item.id} className="relative">
                                <RadioGroupItem
                                    value={item.id}
                                    id={item.id}
                                    className="peer sr-only"
                                />
                                <Label
                                    htmlFor={item.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary transition-all"
                                >
                                    <div className="mt-0.5">{item.icon}</div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm leading-none mb-1">{item.label}</div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>

                    <div className="space-y-2">
                        <Label htmlFor="details" className="text-sm font-medium">
                            Additional Details <span className="text-muted-foreground font-normal">(Optional)</span>
                        </Label>
                        <Textarea 
                            id="details"
                            placeholder="Tell us more about why you are reporting this..."
                            className="bg-muted/20 resize-none h-24"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="gap-2"
                    >
                        {isSubmitting && <AlertTriangle className="w-4 h-4 animate-pulse" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
