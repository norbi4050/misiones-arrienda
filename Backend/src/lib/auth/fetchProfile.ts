// src/lib/auth/fetchProfile.ts
// PROMPT 2: Cliente que adjunta Bearer token (puente temporal, seguro)

import { getBrowserSupabase } from '@/lib/supabase/browser'

/**
 * Fetches user profile from /api/users/profile endpoint
 * Supports both cookies and Bearer token authentication
 * 
 * @returns Profile data with needsOnboarding flag
 * @throws Error if not authenticated
 */
export async function fetchUserProfile() {
  const supabase = getBrowserSupabase()
  
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token

  const res = await fetch('/api/users/profile', {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Not authenticated')
  }
  
  return res.json()
}
