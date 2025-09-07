"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { createClient } from "@/lib/supabase/client"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, session } = useSupabaseAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      router.refresh()
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router, supabase])

  return <>{children}</>
}
