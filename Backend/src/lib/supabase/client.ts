import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'misiones-arrienda-web'
        }
      }
    }
  )
}

// Helper function to handle Supabase errors consistently
export function handleSupabaseError(error: any, context?: string) {
  console.error(`Supabase error${context ? ` in ${context}` : ''}:`, error)

  if (error?.message) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}
