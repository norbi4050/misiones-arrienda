"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, session, supabase } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!supabase) return;

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      router.refresh()
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router, supabase])

  return <>{children}</>
}
