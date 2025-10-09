'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/browser'

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
    const supabase = createBrowserSupabase()
    
    supabase
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single()
      .then(({ data }: { data: UserProfile | null }) => {
        setProfile(data ?? null)
        setLoading(false)
      })
      .catch(() => {
        setProfile(null)
        setLoading(false)
      })
  }, [userId])

  return { profile, loading }
}
