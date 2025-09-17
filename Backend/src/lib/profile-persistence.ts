'use client';

import { User } from '@/hooks/useAuth';

// Profile persistence utility for secure caching and synchronization
export class ProfilePersistence {
  private static readonly PROFILE_KEY = 'misiones-arrienda-profile';
  private static readonly PROFILE_TIMESTAMP_KEY = 'misiones-arrienda-profile-timestamp';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save user profile to localStorage with timestamp
   */
  static saveProfile(profile: User): void {
    try {
      if (typeof window === 'undefined') return;

      const profileData = {
        ...profile,
        cached_at: Date.now()
      };

      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profileData));
      localStorage.setItem(this.PROFILE_TIMESTAMP_KEY, Date.now().toString());

      } catch (error) {
      console.error('Error saving profile to localStorage:', error);
    }
  }

  /**
   * Get cached profile from localStorage
   */
  static getCachedProfile(): User | null {
    try {
      if (typeof window === 'undefined') return null;

      const profileData = localStorage.getItem(this.PROFILE_KEY);
      const timestamp = localStorage.getItem(this.PROFILE_TIMESTAMP_KEY);

      if (!profileData || !timestamp) return null;

      // Check if cache is expired
      const cacheAge = Date.now() - parseInt(timestamp);
      if (cacheAge > this.CACHE_DURATION) {
        this.clearProfile();
        return null;
      }

      const profile = JSON.parse(profileData);
      return profile;
    } catch (error) {
      console.error('Error loading profile from localStorage:', error);
      this.clearProfile();
      return null;
    }
  }

  /**
   * Clear cached profile data
   */
  static clearProfile(): void {
    try {
      if (typeof window === 'undefined') return;

      localStorage.removeItem(this.PROFILE_KEY);
      localStorage.removeItem(this.PROFILE_TIMESTAMP_KEY);
      } catch (error) {
      console.error('Error clearing profile cache:', error);
    }
  }

  /**
   * Check if cached profile is valid and not expired
   */
  static isCacheValid(): boolean {
    try {
      if (typeof window === 'undefined') return false;

      const timestamp = localStorage.getItem(this.PROFILE_TIMESTAMP_KEY);
      if (!timestamp) return false;

      const cacheAge = Date.now() - parseInt(timestamp);
      return cacheAge <= this.CACHE_DURATION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  /**
   * Sync profile with server and update cache
   */
  static async syncProfile(userId: string): Promise<User | null> {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 404) {
          // The API will now create the profile automatically, so retry once
          const retryResponse = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (retryResponse.ok) {
            const { profile } = await retryResponse.json();
            if (profile) {
              this.saveProfile(profile);
              return profile;
            }
          }
        } else if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error && errorData.error.includes('permission denied')) {
            // Wait a moment and retry once for permission issues
            await new Promise(resolve => setTimeout(resolve, 1000));

            const retryResponse = await fetch('/api/users/profile', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (retryResponse.ok) {
              const { profile } = await retryResponse.json();
              if (profile) {
                this.saveProfile(profile);
                return profile;
              }
            } else {
              }
          }
        }

        const errorData = await response.json().catch(() => ({}));
        return null;
      }

      const { profile } = await response.json();

      if (profile) {
        this.saveProfile(profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Error syncing profile with server:', error);
      return null;
    }
  }

  /**
   * Get profile with fallback strategy: cache -> server -> null
   */
  static async getProfile(userId?: string): Promise<User | null> {
    // Try cache first
    const cachedProfile = this.getCachedProfile();
    if (cachedProfile && this.isCacheValid()) {
      return cachedProfile;
    }

    // If cache is invalid or empty, try to sync with server
    if (userId) {
      return await this.syncProfile(userId);
    }

    return null;
  }

  /**
   * Update profile both in cache and on server
   */
  static async updateProfile(profileData: Partial<User>): Promise<User | null> {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating profile');
      }

      const { profile } = await response.json();

      if (profile) {
        this.saveProfile(profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Handle session expiration by clearing cache
   */
  static handleSessionExpired(): void {
    this.clearProfile();
    }

  /**
   * Initialize profile persistence on app start
   */
  static initialize(): void {
    try {
      if (typeof window === 'undefined') return;

      // Clean up expired cache on initialization
      if (!this.isCacheValid()) {
        this.clearProfile();
      }

      } catch (error) {
      console.error('Error initializing profile persistence:', error);
    }
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  ProfilePersistence.initialize();
}
