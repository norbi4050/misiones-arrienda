import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper for Server-Side Rendering with enhanced error handling
export async function getServerSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('SSR session error:', error.message)
      return { session: null, user: null, error }
    }
    
    return { 
      session, 
      user: session?.user || null, 
      error: null 
    }
  } catch (error) {
    console.error('SSR session fetch failed:', error)
    return { 
      session: null, 
      user: null, 
      error: error instanceof Error ? error : new Error('Unknown SSR error') 
    }
  }
}

// Helper for getting user data in Server Components
export async function getServerUser() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('SSR user error:', error.message)
      return { user: null, error }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('SSR user fetch failed:', error)
    return { 
      user: null, 
      error: error instanceof Error ? error : new Error('Unknown SSR user error') 
    }
  }
}

// Helper for protected Server Components
export async function requireServerAuth() {
  const { user, error } = await getServerUser()
  
  if (!user || error) {
    throw new Error('Authentication required')
  }
  
  return user
}
