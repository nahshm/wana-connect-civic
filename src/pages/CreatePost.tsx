import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);

  // Fetch communities on component mount
  useState(() => {
    const fetchCommunities = async () => {
      const { data } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });
      setCommunities(data || []);
    };
    fetchCommunities();
  });

  const handleCreatePost = async (postData: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a post",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: postData.title,
          content: postData.content,
          author_id: user.id,
          community_id: postData.communityId,
          tags: postData.tags || [],
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your post has been created successfully",
      });
      
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
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 text-sidebar-muted-foreground hover:text-sidebar-foreground">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Link>
          </Button>
          
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-sidebar-foreground">Create a Post</h1>
            <p className="text-sidebar-muted-foreground">
              Share your thoughts, civic concerns, or start a discussion in your community
            </p>
          </div>
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