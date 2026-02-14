import React, { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { SELECT_FIELDS } from '@/lib/select-fields';
import { logPostCreated } from '@/lib/activityLogger';
import { ReceiptToast } from '@/components/ui/ReceiptToast';

const CreatePost = () => {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);

  // Fetch communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data } = await supabase
        .from('communities')
        .select(SELECT_FIELDS.COMMUNITY_CARD)
        .order('member_count', { ascending: false });
      setCommunities(data || []);
    };
    fetchCommunities();
  }, []);

  const handleCreatePost = async (postData: any) => {
    if (!user) {
      authModal.open('login');
      return;
    }

    setLoading(true);

    try {
      // Determine content type based on post type and files
      // Map 'link' to 'text' since 'link' is not a valid DB content_type
      let contentType: 'text' | 'video' | 'image' = 'text'
      let hasVideo = false
      let hasImage = false

      if (postData.postType === 'link') {
        contentType = 'text' // Link posts are stored as text type
      } else if (postData.evidenceFiles && postData.evidenceFiles.length > 0) {
        // Check if any files are videos
        hasVideo = postData.evidenceFiles.some((file: File) =>
          file.type.startsWith('video/')
        )
        hasImage = postData.evidenceFiles.some((file: File) =>
          file.type.startsWith('image/')
        )

        if (hasVideo) {
          contentType = 'video'
        } else if (hasImage) {
          contentType = 'image'
        }
      }

      const postPayload = {
        title: postData.title,
        content: postData.content,
        author_id: user.id,
        community_id: postData.communityId || null,
        tags: postData.tags || [],
        content_type: contentType,
        content_sensitivity: postData.contentSensitivity || 'public',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([postPayload])
        .select()
        .single();

      if (error) throw error;

      const postId = data.id;

      // Log activity to unified feed
      try {
        await logPostCreated(user.id, postId, {
          title: postData.title,
          communityId: postData.communityId,
          contentType: contentType
        });
      } catch (logError) {
        console.error('Failed to log post activity:', logError);
        // Don't block flow for logging error
      }

      // Handle VIDEO uploads - Create civic_clip record
      if (hasVideo && postData.evidenceFiles) {
        const videoFiles = postData.evidenceFiles.filter((file: File) =>
          file.type.startsWith('video/')
        )

        for (const videoFile of videoFiles) {
          try {
            // Upload video to storage
            const fileExt = videoFile.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(fileName, videoFile)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('media')
              .getPublicUrl(fileName)

            // Extract video metadata
            const videoElement = document.createElement('video')
            videoElement.src = URL.createObjectURL(videoFile)

            await new Promise((resolve) => {
              videoElement.onloadedmetadata = resolve
            })

            const duration = Math.floor(videoElement.duration)
            const width = videoElement.videoWidth
            const height = videoElement.videoHeight
            const aspectRatio = width > height ? '16:9' : '9:16'

            // Create civic_clip record
            const { error: clipError } = await supabase
              .from('civic_clips')
              .insert({
                post_id: postId,
                video_url: publicUrl,
                duration,
                width,
                height,
                aspect_ratio: aspectRatio,
                file_size: videoFile.size,
                category: postData.flairId || null,
                hashtags: postData.tags || [],
                processing_status: 'ready'
              })

            if (clipError) {
              console.error('Error creating civic_clip:', clipError)
            }

            URL.revokeObjectURL(videoElement.src)
          } catch (videoError) {
            console.error('Video processing error:', videoError)
            toast({
              title: "Video Upload Issue",
              description: "Your post was created but there was an issue processing the video.",
              variant: "default",
            })
          }
        }
      }

      // Handle other file uploads (images, documents)
      if (postData.evidenceFiles && postData.evidenceFiles.length > 0) {
        try {
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
              description: "Your post was created but there was an issue saving file metadata.",
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
            description: "Your post was created successfully, but file uploads failed.",
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
        // Show Receipt for standard posts
        toast({
          description: (
            <ReceiptToast
              title="Post Created"
              trackingId={postId}
              nextSteps={['Community Visibility', 'Engagement Tracking']}
            />
          ),
          duration: 5000,
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
