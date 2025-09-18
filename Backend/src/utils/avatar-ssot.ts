/**
 * Avatar utilities for handling avatar URLs with cache-busting
 * Single Source of Truth: user_profiles.avatar_path
 */

import { getBrowserSupabase } from '@/lib/supabaseClient';

export interface AvatarUrlOptions {
  avatarPath?: string | null;
  updatedAt?: string | null;
  fallbackInitials?: string;
  size?: number;
}

/**
 * Generates an avatar URL from avatar_path with cache-busting parameter
 * @param avatarPath - Storage path (e.g., "userId/avatar-timestamp.jpg")
 * @param updatedAt - Updated timestamp for cache-busting
 * @returns Complete avatar URL with cache-busting or null if no path
 */
export function getAvatarUrl(avatarPath?: string | null, updatedAt?: string | null): string | null {
  if (!avatarPath) {
    return null;
  }

  try {
    const supabase = getBrowserSupabase();
    
    // Get public URL from Supabase Storage
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);

    let publicUrl = data.publicUrl;

    // Add cache-busting parameter if updatedAt provided
    if (updatedAt) {
      const timestamp = new Date(updatedAt).getTime();
      const separator = publicUrl.includes('?') ? '&' : '?';
      publicUrl = `${publicUrl}${separator}v=${timestamp}`;
    }

    return publicUrl;
  } catch (error) {
    console.warn('Error generating avatar URL from path:', error);
    return null;
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
  const { avatarPath, updatedAt, fallbackInitials, size = 40 } = options;
  
  const avatarUrl = getAvatarUrl(avatarPath, updatedAt);
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
 * Validates if an avatar path is valid for the user
 * @param avatarPath - Storage path to validate
 * @param userId - User ID to validate ownership
 * @returns True if path is valid for the user
 */
export function isValidAvatarPath(avatarPath?: string | null, userId?: string): boolean {
  if (!avatarPath || !userId) return false;
  
  try {
    // Validate that the path starts with the user ID
    return avatarPath.startsWith(`${userId}/`) && avatarPath.includes('avatar-');
  } catch {
    return false;
  }
}

/**
 * Extracts avatar path from existing profile_image URL (for migration)
 * @param url - Complete Supabase storage URL
 * @param userId - User ID to validate path ownership
 * @returns File path for storage operations or null if invalid
 */
export function extractAvatarPathFromUrl(url?: string | null, userId?: string): string | null {
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
    console.warn('Error extracting avatar path from URL:', error);
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
 * Generates the complete file path for avatar storage (avatar_path)
 * @param userId - User ID
 * @param filename - Generated filename
 * @returns Complete file path for storage (SSoT)
 */
export function generateAvatarPath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

/**
 * Creates or updates user avatar_path in database
 * @param userId - User ID
 * @param avatarPath - Storage path to save
 * @returns Success status
 */
export async function setUserAvatarPath(userId: string, avatarPath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar_path: avatarPath
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error updating avatar path');
    }

    const data = await response.json();
    return { 
      success: true, 
      ...data 
    };
  } catch (error) {
    console.error('Error setting user avatar path:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
