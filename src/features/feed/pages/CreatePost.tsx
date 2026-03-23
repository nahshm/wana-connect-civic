import React, { useState, useEffect } from 'react';
import { CreatePostForm, PostFormData } from '@/components/posts/CreatePostForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { useCreatePost } from '@/hooks/useCreatePost';
import { ReceiptToast } from '@/components/ui/ReceiptToast';

interface Community {
  id: string
  name: string
  display_name: string
  member_count: number
}

const CreatePost = () => {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);

  // Fetch communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) return;
      
      // Only fetch communities the user has joined
      const { data } = await supabase
        .from('community_members')
        .select('community:communities(*)')
        .eq('user_id', user.id);
      
      if (data) {
        // Map the relation to get the actual community object and filter nulls
        const joined = data
          .map((item: { community: Community }) => item.community)
          .filter(Boolean)
          .sort((a: Community, b: Community) => (b.member_count || 0) - (a.member_count || 0));
        
        setCommunities(joined);
      } else {
        setCommunities([]);
      }
    };
    
    if (user) {
        fetchCommunities();
    }
  }, [user]);

  const createPostMutation = useCreatePost();

  const handleCreatePost = async (postData: PostFormData) => {
    if (!user) {
      authModal.open('login');
      return;
    }

    setLoading(true);

    try {
      const result = await createPostMutation.mutateAsync({
        postData,
        userId: user.id
      });

      // Handle sensitive content notifications
      if (result.contentSensitivity === 'crisis') {
        toast({
          title: "Crisis Report Logged",
          description: "Your report has been logged in our crisis monitoring system and will be reviewed by our team. If this is a life-threatening emergency, please contact local emergency services directly.",
          variant: "default",
        });
      } else if (result.contentSensitivity === 'sensitive') {
        toast({
          title: "Sensitive Content Submitted",
          description: "Your post will undergo additional verification before being published.",
          variant: "default",
        });
      } else {
        // Show Receipt for standard posts
        toast({
          description: (
            <ReceiptToast
              title="Post Created"
              trackingId={result.postId}
              nextSteps={['Community Visibility', 'Engagement Tracking']}
            />
          ),
          duration: 5000,
        });
        
        if (result.fileCount > 0) {
            toast({
              title: "Files Uploaded Successfully",
              description: `${result.fileCount} file(s) have been uploaded with your post.`,
              variant: "default",
            });
        }
      }

      navigate('/');
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
    <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-4 border-b pb-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-sidebar-muted-foreground hover:text-sidebar-foreground shrink-0">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-sidebar-foreground">Create a post</h1>
        </div>

        {/* Create Post Form */}
        <div className="bg-sidebar-background border border-sidebar-border rounded-lg">
          <CreatePostForm
            communities={communities}
            onSubmit={handleCreatePost}
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
