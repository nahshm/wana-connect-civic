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
          const fileExt = videoFile.name.split('.').pop();
          const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from('media').upload(fileName, videoFile);
          if (uploadError) throw new Error(`Video upload failed: ${uploadError.message}`);

          // Extract video metadata from a local object URL (never stored)
          const objectUrl = URL.createObjectURL(videoFile);
          const videoElement = document.createElement('video');
          videoElement.src = objectUrl;

          await new Promise<void>((resolve) => {
            videoElement.onloadedmetadata = () => resolve();
            videoElement.onerror = () => resolve(); // don't block on metadata failure
          });

          const duration = Math.floor(videoElement.duration) || 0;
          const width = videoElement.videoWidth || 0;
          const height = videoElement.videoHeight || 0;
          const aspectRatio = width >= height ? '16:9' : '9:16';
          URL.revokeObjectURL(objectUrl);

          // Store the storage path — resolved to a secure URL at read time via proxy
          await supabase.from('civic_clips').insert({
            post_id: postId,
            video_url: fileName, // path, not public URL
            duration,
            width,
            height,
            aspect_ratio: aspectRatio,
            file_size: videoFile.size,
            category: postData.tags?.[0] || null,
            hashtags: postData.tags || [],
            processing_status: 'ready',
          });
        }
      }

      // 4. Handle Image/Doc uploads (post_media) — only non-video files
      // Note: hasVideo uploads are handled above for civic_clips;
      // images and docs are ALWAYS stored in post_media for display in PostCard.
      if (postData.evidenceFiles && postData.evidenceFiles.length > 0) {
        const mediaFiles = hasVideo
          ? postData.evidenceFiles.filter((f: File) => !f.type.startsWith('video/'))
          : postData.evidenceFiles;

        if (mediaFiles.length > 0) {
          const uploadPromises = mediaFiles.map(async (file: File, index: number) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${postId}/evidence_${index + 1}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
            if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
            return {
              post_id: postId,
              file_path: fileName,  // store path, resolved via proxy at display time
              filename: file.name,
              file_type: file.type,
              file_size: file.size,
            };
          });

          const mediaRecords = await Promise.all(uploadPromises);
          const { error: mediaError } = await supabase.from('post_media').insert(mediaRecords);
          if (mediaError) throw new Error(`File metadata save failed: ${mediaError.message}`);
        }
      }

      // 5. Handle Sensitive Content (Crisis Report)
      if (postData.contentSensitivity === 'crisis') {
        try {
          const reportId = `CR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await supabase.from('crisis_reports').insert([{
            report_id: reportId,
            title: postData.title || 'Crisis Post',
            description: postData.content?.substring(0, 500) || null,
            crisis_type: 'user_flagged',
            severity: 'high',
            status: 'active',
            post_id: postId,
          }]);
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
