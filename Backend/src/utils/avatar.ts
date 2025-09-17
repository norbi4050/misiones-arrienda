/**
 * Avatar utilities for handling avatar URLs with cache-busting
 */

export interface AvatarUrlOptions {
  photos?: string[] | null;
  profileImage?: string | null;
  updatedAt?: string | null;
  fallbackInitials?: string;
  size?: number;
}

/**
 * Gets the avatar source following the single source of truth (SSoT)
 * SSoT: user_profiles.photos[0] (PRIMARY - read/write)
 * Fallback: User.avatar (SECONDARY - read only)
 * @param options - Avatar configuration options
 * @returns Avatar URL or null if no image
 */
export function getAvatarSource(options: AvatarUrlOptions): string | null {
  const { photos, profileImage } = options;
  
  // SSoT: photos[0] from user_profiles (PRIMARY SOURCE)
  if (photos && photos.length > 0 && photos[0]) {
    return photos[0];
  }
  
  // Fallback: User.avatar (SECONDARY - read only)
  if (profileImage) {
    return profileImage;
  }
  
  return null;
}

/**
 * Generates an avatar URL with cache-busting parameter
 * @param options - Avatar configuration options
 * @returns Complete avatar URL with cache-busting or null if no image
 */
export function getAvatarUrl(options: AvatarUrlOptions): string | null {
  const { updatedAt } = options;
  
  // Get the avatar source following priority rules
  const avatarSource = getAvatarSource(options);

  if (!avatarSource) {
    return null;
  }

  // If no updatedAt provided, return original URL
  if (!updatedAt) {
    return avatarSource;
  }

  try {
    // Convert updatedAt to epoch timestamp for cache-busting
    const timestamp = new Date(updatedAt).getTime();
    
    // Add cache-busting parameter
    const separator = avatarSource.includes('?') ? '&' : '?';
    return `${avatarSource}${separator}v=${timestamp}`;
  } catch (error) {
    console.warn('Error generating cache-busted avatar URL:', error);
    return avatarSource;
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
export function getAvatarConfig(options: AvatarUrlOptions) {
  const { photos, profileImage, updatedAt, fallbackInitials, size = 40 } = options;
  
  const avatarUrl = getAvatarUrl({ photos, profileImage, updatedAt });
  const initials = getInitials(fallbackInitials);

  return {
    url: avatarUrl,
    initials,
    hasImage: !!avatarUrl,
    size,
    cacheBusted: !!avatarUrl && !!updatedAt,
    source: getAvatarSource({ photos, profileImage }) ? 'user_profiles' : 'fallback'
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
