/**
 * Avatar utilities for handling avatar URLs with cache-busting
 */

export interface AvatarUrlOptions {
  profileImage?: string | null;
  updatedAt?: string | null;
  fallbackInitials?: string;
  size?: number;
}

/**
 * Generates an avatar URL with cache-busting parameter
 * @param options - Avatar configuration options
 * @returns Complete avatar URL with cache-busting or null if no image
 */
export function getAvatarUrl(options?: AvatarUrlOptions): string | null {
  if (!options) {
    return null;
  }

  const { profileImage, updatedAt } = options;

  if (!profileImage) {
    return null;
  }

  // If no updatedAt provided, return original URL
  if (!updatedAt) {
    return profileImage;
  }

  try {
    // Convert updatedAt to epoch timestamp for cache-busting
    const timestamp = new Date(updatedAt).getTime();
    
    // Add cache-busting parameter
    const separator = profileImage.includes('?') ? '&' : '?';
    return `${profileImage}${separator}v=${timestamp}`;
  } catch (error) {
    console.warn('Error generating cache-busted avatar URL:', error);
    return profileImage;
  }
}

/**
 * Generates initials from a name for fallback display
 * @param name - Full name or email
 * @returns Two-character initials
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'U';

  // Handle email addresses
  if (name.includes('@')) {
    name = name.split('@')[0];
  }

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

/**
 * Generates a complete avatar configuration with URL and fallback
 * @param options - Avatar configuration options
 * @returns Complete avatar configuration
 */
export function getAvatarConfig(options?: AvatarUrlOptions) {
  if (!options) {
    return {
      url: null,
      initials: 'U',
      hasImage: false,
      size: 40,
      cacheBusted: false
    };
  }

  const { profileImage, updatedAt, fallbackInitials, size = 40 } = options;
  
  const avatarUrl = getAvatarUrl({ profileImage, updatedAt });
  const initials = getInitials(fallbackInitials);

  return {
    url: avatarUrl,
    initials,
    hasImage: !!avatarUrl,
    size,
    cacheBusted: !!avatarUrl && !!updatedAt
  };
}

/**
 * Validates if an avatar URL is from the expected Supabase storage
 * @param url - Avatar URL to validate
 * @returns True if URL is valid Supabase storage URL
 */
export function isValidAvatarUrl(url?: string | null): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    // Check if it's a Supabase storage URL
    return urlObj.pathname.includes('/storage/v1/object/public/avatars/');
  } catch {
    return false;
  }
}

/**
 * Extracts the file path from a Supabase storage URL for deletion
 * @param url - Complete Supabase storage URL
 * @param userId - User ID to validate path ownership
 * @returns File path for storage operations or null if invalid
 */
export function extractAvatarPath(url?: string | null, userId?: string): string | null {
  if (!url || !userId) return null;

  try {
    // Handle both old and new URL formats
    if (url.includes('/avatars/')) {
      const parts = url.split('/avatars/');
      if (parts.length === 2) {
        const filePath = parts[1].split('?')[0]; // Remove query params
        
        // Validate that the path starts with the user ID
        if (filePath.startsWith(`${userId}/`)) {
          return filePath;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error extracting avatar path:', error);
    return null;
  }
}

/**
 * Generates a unique filename for avatar upload
 * @param userId - User ID
 * @param originalFilename - Original file name
 * @returns Unique filename with timestamp
 */
export function generateAvatarFilename(userId: string, originalFilename: string): string {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop() || 'jpg';
  return `avatar-${timestamp}.${extension}`;
}

/**
 * Generates the complete file path for avatar storage
 * @param userId - User ID
 * @param filename - Generated filename
 * @returns Complete file path for storage
 */
export function generateAvatarPath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}
