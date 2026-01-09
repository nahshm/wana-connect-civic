// Image Optimization Helper
// Reduces bandwidth by using Supabase CDN transformations

type ImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const IMAGE_SIZES: Record<ImageSize, number> = {
    xs: 24,   // Tiny avatars in comments
    sm: 48,   // Small avatars in post cards  
    md: 128,  // Medium profile pictures
    lg: 256,  // Large banners/images
    xl: 512,  // Full-screen images
};

/**
 * Optimizes images using Supabase/CDN transformations
 * Reduces bandwidth by ~50% by requesting appropriate sizes
 * 
 * @param url - Original image URL
 * @param size - Desired size preset
 * @returns Optimized image URL with transformations
 * 
 * @example
 * // Instead of loading 782x623 image for 24x24 avatar
 * <img src={optimizeImage(user.avatar_url, 'xs')} />
 */
export function optimizeImage(url: string | null | undefined, size: ImageSize = 'md'): string {
    if (!url) return '/default-avatar.png';

    // Check if URL is from Supabase storage
    const isSupabaseStorage = url.includes('supabase.co/storage');

    if (!isSupabaseStorage) return url;

    const dimension = IMAGE_SIZES[size];

    // Use Supabase image transformations
    // https://supabase.com/docs/guides/storage/image-transformations
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${dimension}&height=${dimension}&resize=cover&quality=80`;
}

/**
 * Optimizes background images (banners, covers)
 * Uses different aspect ratio than avatars
 */
export function optimizeBanner(url: string | null | undefined, width: number = 800): string {
    if (!url) return '/default-banner.png';

    const isSupabaseStorage = url.includes('supabase.co/storage');
    if (!isSupabaseStorage) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=80`;
}

export default optimizeImage;
