'use client'

import { useEffect, useState } from 'react'

export interface UserProfile {
  display_name?: string
  avatar_url?: string
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }

    setLoading(true)
    
    // [FIX-400] Usar endpoint canónico en lugar de PostgREST directo
    // Esto evita el error 400 por usar user_id=eq. en lugar de la columna correcta
    console.debug('[Profiles] Using /api/users/profile instead of PostgREST');
    
    fetch(`/api/users/profile?id=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load profile: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // El endpoint devuelve { profile: { displayName, avatarUrl, ... } }
        // Mapear a la estructura esperada por este hook
        if (data.profile) {
          setProfile({
            display_name: data.profile.displayName || data.profile.display_name,
            avatar_url: data.profile.avatarUrl || data.profile.avatar_url,
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('[useProfile] Error fetching profile:', error);
        setProfile(null);
        setLoading(false);
      });
  }, [userId])

  return { profile, loading }
}
