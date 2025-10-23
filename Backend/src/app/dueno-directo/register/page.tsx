"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DuenoDirectoRegisterRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir al registro unificado con parámetro type=dueno_directo
    router.replace('/register?type=dueno_directo')
  }, [router])

  // Mostrar loader mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}
