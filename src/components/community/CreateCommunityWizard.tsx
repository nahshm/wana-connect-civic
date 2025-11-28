import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Step1_CommunityType } from './steps/Step1_CommunityType';
import { Step2_NameDescription } from './steps/Step2_NameDescription';
import { Step3_Styling } from './steps/Step3_Styling';
import { CommunityPreview } from './CommunityPreview';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CommunityData {
    name: string;
    description: string;
    visibility_type: 'public' | 'restricted' | 'private';
    is_mature: boolean;
    banner_url: string;
    avatar_url: string;
    rules?: string;
    moderation_type?: 'admin' | 'elected' | 'community';
    tags?: string[];
}

interface CreateCommunityWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateCommunityWizard = ({ isOpen, onClose }: CreateCommunityWizardProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [communityData, setCommunityData] = useState<CommunityData>({
        name: '',
        description: '',
        visibility_type: 'public',
        is_mature: false,
        banner_url: '',
        avatar_url: '',
        rules: '',
        moderation_type: 'admin',
        tags: []
    });

    const MAX_STEPS = 3;

    const handleNext = () => {
        if (step === 2) {
            if (!communityData.name.trim()) {
                toast({
                    title: "Name required",
                    description: "Please enter a community name",
                    variant: "destructive"
                });
                return;
            }
            if (!communityData.description.trim()) {
                toast({
                    title: "Description required",
                    description: "Please enter a community description",
                    variant: "destructive"
                });
                return;
            }
        }

        if (step < MAX_STEPS) {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(s => s - 1);
        }
    };

    const handleCreateCommunity = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to create a community",
                variant: "destructive"
            });
            return;
        }

        setIsCreating(true);

        try {
            const { data: community, error: communityError } = await supabase
                .from('communities')
                .insert({
                    name: communityData.name,
                    display_name: communityData.name.charAt(0).toUpperCase() + communityData.name.slice(1),
                    description: communityData.description,
                    category: 'discussion',
                    visibility_type: communityData.visibility_type,
                    is_mature: communityData.is_mature,
                    banner_url: communityData.banner_url || null,
                    avatar_url: communityData.avatar_url || null,
                    created_by: user.id
                })
                .select()
                .single();

            if (communityError) throw communityError;

            toast({
                title: "Success!",
                description: `c/${communityData.name} has been created`
            });

            onClose();
            navigate(`/community/${communityData.name}`);
        } catch (error: any) {
            console.error('Error creating community:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create community",
                variant: "destructive"
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            onClose();
            setTimeout(() => {
                setStep(1);
                setCommunityData({
                    name: '',
                    description: '',
                    visibility_type: 'public',
                    is_mature: false,
                    banner_url: '',
                    avatar_url: '',
                    rules: '',
                    moderation_type: 'admin',
                    tags: []
                });
            }, 300);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] p-0 gap-0">
                <DialogTitle className="sr-only">Create Community</DialogTitle>
                <DialogDescription className="sr-only">
                    Create a new community in 3 steps
                </DialogDescription>

                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 z-50 rounded-sm opacity-70 hover:opacity-100"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] h-full max-h-[80vh]">
                    {/* Preview - Top on mobile, Right on desktop */}
                    <div className="bg-muted/20 p-3 border-b lg:border-b-0 lg:border-l lg:order-2 overflow-y-auto max-h-[200px] lg:max-h-none">
                        <CommunityPreview data={communityData} />
                    </div>

                    {/* Form Content - Bottom on mobile, Left on desktop */}
                    <div className="flex flex-col p-4 overflow-y-auto lg:order-1">
                        <div className="flex-1">
                            {step === 1 && (
                                <Step1_CommunityType
                                    value={communityData.visibility_type}
                                    isMature={communityData.is_mature}
                                    onChange={(type) => setCommunityData(prev => ({ ...prev, visibility_type: type }))}
                                    onMatureChange={(mature) => setCommunityData(prev => ({ ...prev, is_mature: mature }))}
                                />
                            )}
                            {step === 2 && (
                                <Step2_NameDescription
                                    data={communityData}
                                    onChange={setCommunityData}
                                />
                            )}
                            {step === 3 && (
                                <Step3_Styling
                                    data={communityData}
                                    onChange={setCommunityData}
                                />
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="mt-auto pt-4 border-t">
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-2 h-2 rounded-full",
                                            i === step ? "bg-primary" :
                                                i < step ? "bg-primary/50" : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-between">
                                <Button variant="ghost" onClick={handleBack} disabled={step === 1 || isCreating}>
                                    Back
                                </Button>
                                {step < MAX_STEPS ? (
                                    <Button onClick={handleNext} disabled={isCreating}>Next</Button>
                                ) : (
                                    <Button onClick={handleCreateCommunity} disabled={isCreating}>
                                        {isCreating ? 'Creating...' : 'Create'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
