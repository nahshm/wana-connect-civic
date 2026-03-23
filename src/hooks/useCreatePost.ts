import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostFormData } from '@/components/posts/CreatePostForm';
import { logPostCreated } from '@/lib/activityLogger';

interface CreatePostParams {
  postData: PostFormData;
  userId: string;
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postData, userId }: CreatePostParams) => {
      // Determine content type based on post type and files
      let contentType: 'text' | 'video' | 'image' = 'text';
      let hasVideo = false;
      let hasImage = false;

      if (postData.postType === 'link') {
        contentType = 'text'; // Link posts are stored as text type
      } else if (postData.evidenceFiles && postData.evidenceFiles.length > 0) {
        hasVideo = postData.evidenceFiles.some((file: File) => file.type.startsWith('video/'));
        hasImage = postData.evidenceFiles.some((file: File) => file.type.startsWith('image/'));

        if (hasVideo) {
          contentType = 'video';
        } else if (hasImage) {
          contentType = 'image';
        }
      }

      const postPayload = {
        title: postData.title,
        content: postData.content,
        author_id: userId,
        community_id: postData.communityId || null,
        tags: postData.tags || [],
        content_type: contentType,
        content_sensitivity: postData.contentSensitivity || 'public',
        link_url: postData.linkUrl || null,
        link_title: postData.linkTitle || null,
        link_description: postData.linkDescription || null,
        link_image: postData.linkImage || null,
        moderation_status: postData.governance_verdict === 'UNMODERATED' ? 'pending' : (postData.governance_verdict?.toLowerCase() === 'approved' ? 'approved' : 'pending'),
      };

      // 1. Insert the Post record
      const { data: postRecord, error: postError } = await supabase
        .from('posts')
        .insert([postPayload])
        .select()
        .single();

      if (postError) throw new Error(`Post creation failed: ${postError.message}`);
      const postId = postRecord.id;

      // 2. Log Activity
      try {
        await logPostCreated(userId, postId, {
          title: postData.title,
          communityId: postData.communityId,
          contentType: contentType
        });
      } catch (logError) {
        console.error('Failed to log post activity:', logError);
      }

      // 3. Handle Video Uploads (civic_clips)
      if (hasVideo && postData.evidenceFiles) {
        const videoFiles = postData.evidenceFiles.filter((file: File) => file.type.startsWith('video/'));

        for (const videoFile of videoFiles) {
          try {
            const fileExt = videoFile.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

             await supabase.storage.from('media').upload(fileName, videoFile);
             const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);

            // Extract video metadata
            const videoElement = document.createElement('video');
            videoElement.src = URL.createObjectURL(videoFile);

            await new Promise((resolve) => {
              videoElement.onloadedmetadata = resolve;
            });

            const duration = Math.floor(videoElement.duration);
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;
            const aspectRatio = width > height ? '16:9' : '9:16';

            await supabase.from('civic_clips').insert({
              post_id: postId,
              video_url: publicUrl,
              duration,
              width,
              height,
              aspect_ratio: aspectRatio,
              file_size: videoFile.size,
              category: postData.tags?.[0] || null,
              hashtags: postData.tags || [],
              processing_status: 'ready'
            });

            URL.revokeObjectURL(videoElement.src);
          } catch (videoError) {
            console.error('Video processing error:', videoError);
            throw new Error('Video upload failed');
          }
        }
      }

      // 4. Handle Image/Doc Uploads (post_media)
      if (postData.evidenceFiles && postData.evidenceFiles.length > 0) {
        const uploadPromises = postData.evidenceFiles.map(async (file: File, index: number) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${postId}/evidence_${index + 1}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}`);

          return {
            post_id: postId,
            file_path: fileName,
            filename: fileName.split('/').pop() || '',
            file_type: file.type,
            file_size: file.size,
          };
        });

        const evidenceRecords = await Promise.all(uploadPromises);
        
        const { error: evidenceError } = await supabase
          .from('post_media')
          .insert(evidenceRecords);

        if (evidenceError) {
          console.error('Error saving evidence records:', evidenceError);
          throw new Error('File metadata save failed');
        }
      }

      // 5. Handle Sensitive Content (Crisis Report)
      if (postData.contentSensitivity === 'crisis') {
        try {
          const reportId = `CR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await supabase.from('crisis_reports').insert({
            report_id: reportId,
            title: postData.title || 'Crisis Post',
            description: postData.content?.substring(0, 500) || null,
            crisis_type: 'user_flagged',
            severity: 'high',
            status: 'active',
            post_id: postId,
          } as unknown as object);
        } catch (crisisErr) {
          console.error('Failed to create crisis report:', crisisErr);
        }
      }

      return { postId, contentSensitivity: postData.contentSensitivity, fileCount: postData.evidenceFiles?.length || 0 };
    },
    onSuccess: () => {
      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['channel-content'] });
    },
  });
}
