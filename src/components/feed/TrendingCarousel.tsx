import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TrendingPost {
  id: string;
  title: string;
  content: string | null;
  community: {
    name: string;
    displayName: string;
  } | null;
  upvotes: number;
  commentCount: number;
  media: { file_path: string; file_type: string }[];
}

export function TrendingCarousel() {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  const fetchTrendingPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          upvotes,
          comment_count,
          communities!posts_community_id_fkey (name, display_name),
          post_media!post_media_post_id_fkey (file_path, file_type)
        `)
        .order('upvotes', { ascending: false })
        .limit(10);

      if (error) throw error;

      const transformedPosts: TrendingPost[] = (data || []).map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        community: post.communities ? {
          name: post.communities.name,
          displayName: post.communities.display_name,
        } : null,
        upvotes: post.upvotes || 0,
        commentCount: post.comment_count || 0,
        media: post.post_media || [],
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const visibleCount = 4;
  const maxIndex = Math.max(0, posts.length - visibleCount);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const getImageUrl = (post: TrendingPost): string | null => {
    const imageMedia = post.media.find((m) => m.file_type.startsWith('image'));
    if (imageMedia) {
      const { data } = supabase.storage.from('post-media').getPublicUrl(imageMedia.file_path);
      return data.publicUrl;
    }
    return null;
  };

  const getGradientColor = (index: number): string => {
    const gradients = [
      'from-civic-green/80 to-civic-blue/80',
      'from-civic-blue/80 to-civic-orange/80',
      'from-civic-orange/80 to-destructive/80',
      'from-primary/80 to-civic-green/80',
      'from-accent/80 to-civic-blue/80',
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[220px] h-[180px] rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="relative group">
      {/* Navigation Buttons */}
      {currentIndex > 0 && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/90 hover:bg-background shadow-lg"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {currentIndex < maxIndex && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/90 hover:bg-background shadow-lg"
          onClick={handleNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Carousel Container */}
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex gap-3 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 232}px)` }}
        >
          {posts.map((post, index) => {
            const imageUrl = getImageUrl(post);
            return (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="flex-shrink-0 w-[220px] h-[180px] rounded-xl overflow-hidden relative group/card"
              >
                {/* Background */}
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGradientColor(index)}`} />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover/card:underline">
                    {post.title}
                  </h3>
                  {post.community && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white text-xs backdrop-blur-sm border-0"
                      >
                        c/{post.community.name}
                      </Badge>
                      <span className="text-white/70 text-xs">and more</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
