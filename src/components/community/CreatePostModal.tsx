import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CreatePostForm, PostFormData } from '@/components/posts/CreatePostForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { useCreatePost } from '@/hooks/useCreatePost';

interface Community {
  id: string;
  name: string;
  display_name: string;
  member_count: number;
}

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    communityName: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
    isOpen,
    onClose,
    communityId,
    communityName,
}) => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [communities, setCommunities] = useState<Community[]>([]);
    const createPostMutation = useCreatePost();

    // Fetch communities for the form dropdown
    useEffect(() => {
        if (isOpen) {
            const fetchCommunities = async () => {
                const { data } = await supabase
                    .from('communities')
                    .select('*')
                    .order('member_count', { ascending: false });
                setCommunities(data || []);
            };
            fetchCommunities();
        }
    }, [isOpen]);

    const handleCreatePost = async (postData: PostFormData) => {
        if (!user) {
            authModal.open('login');
            onClose(); // Close the modal so auth modal shows
            return;
        }

        setLoading(true);

        try {
            // Override the postData's communityId if it isn't set
            const finalPostData = {
                ...postData,
                communityId: postData.communityId || communityId
            };

            await createPostMutation.mutateAsync({
                postData: finalPostData,
                userId: user.id
            });

            toast({
                title: "Success!",
                description: "Your post has been created successfully",
            });

            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle>
                        Create a Post in c/{communityName}
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6">
                    <CreatePostForm
                        communities={communities}
                        onSubmit={handleCreatePost}
                        defaultCommunityId={communityId}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
