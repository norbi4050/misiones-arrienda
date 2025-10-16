'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Metadata } from 'next'

export default function MisPropiedadesPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/mi-cuenta/publicaciones')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}
