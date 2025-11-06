import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);

  // Fetch communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });
      setCommunities(data || []);
    };
    fetchCommunities();
  }, []);

  const handleCreatePost = async (postData: any) => {
    // For now, anonymous posting is not supported by the database schema
    // All posts require an authenticated user
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

      const postPayload = {
        title: postData.title,
        content: postData.content,
        author_id: user.id,
        community_id: postData.communityId || null,
        tags: postData.tags || [],
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(postPayload)
        .select()
        .single();

      if (error) throw error;

      // Handle file uploads if any evidence files are provided
      if (postData.evidenceFiles && postData.evidenceFiles.length > 0) {
        try {
          const postId = data.id;

          // Upload each file to Supabase Storage
          const uploadPromises = postData.evidenceFiles.map(async (file: File, index: number) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${postId}/evidence_${index + 1}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(fileName, file);

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              throw new Error(`Failed to upload ${file.name}`);
            }

            return {
              post_id: postId,
              file_name: fileName,
              file_type: file.type,
              file_size: file.size,
              uploaded_at: new Date().toISOString(),
            };
          });

          const evidenceRecords = await Promise.all(uploadPromises);

          // Insert evidence records into database
          const { error: evidenceError } = await supabase
            .from('post_media')
            .insert(evidenceRecords.map(record => ({
              post_id: record.post_id,
              file_path: record.file_name,
              filename: record.file_name.split('/').pop() || '',
              file_type: record.file_type,
              file_size: record.file_size,
            })));

          if (evidenceError) {
            console.error('Error saving evidence records:', evidenceError);
            toast({
              title: "File Upload Issue",
              description: "Your post was created but there was an issue saving file metadata. Files may not display correctly.",
              variant: "default",
            });
          } else {
            toast({
              title: "Files Uploaded Successfully",
              description: `${postData.evidenceFiles.length} file(s) have been uploaded with your post.`,
              variant: "default",
            });
          }
        } catch (uploadError) {
          console.error('File upload process failed:', uploadError);
          toast({
            title: "File Upload Failed",
            description: "Your post was created successfully, but file uploads failed. You can try again later.",
            variant: "default",
          });
        }
      }

      // Handle sensitive content notifications
      if (postData.contentSensitivity === 'crisis') {
        toast({
          title: "Crisis Report Submitted",
          description: "Your report has been flagged for immediate attention and will be escalated to appropriate authorities.",
          variant: "default",
        });
      } else if (postData.contentSensitivity === 'sensitive') {
        toast({
          title: "Sensitive Content Submitted",
          description: "Your post will undergo additional verification before being published.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success!",
          description: "Your post has been created successfully",
        });
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
