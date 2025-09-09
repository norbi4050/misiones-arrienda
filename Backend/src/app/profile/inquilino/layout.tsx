/*
 * COMENTADO: Este layout estaba pasando initialSession al AuthProvider
 * Ahora usamos Strategy A: page.tsx obtiene session (SSR) y la pasa como prop
 *
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { AuthProvider } from "@/components/auth-provider"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <AuthProvider initialSession={session}>
      {children}
    </AuthProvider>
  )
}
*/
