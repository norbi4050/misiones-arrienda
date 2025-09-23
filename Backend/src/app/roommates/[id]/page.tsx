'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Share2, Flag, Eye } from 'lucide-react'
import RoommateDetail from '@/components/ui/roommate-detail'
import type { RoommatePost } from '@/types/roommate'

export default function RoommateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [roommate, setRoommate] = useState<RoommatePost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const id = params.id as string

  useEffect(() => {
    async function loadRoommate() {
      if (!id) return

      try {
        console.log('Cargando roommate:', id)
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/roommates/${id}`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setRoommate(data.roommate)

        // Incrementar vistas de forma asíncrona
        fetch(`/api/roommates/${id}/view`, { method: 'POST' }).catch(console.error)

      } catch (error) {
        console.error('Error cargando roommate:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadRoommate()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando roommate...</p>
        </div>
      </div>
    )
  }

  if (error || !roommate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Roommate no encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'El roommate que buscas no existe o ha sido eliminado.'}</p>
          <Link
            href="/roommates"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Roommates
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header con navegación */}
        <div className="mb-6">
          <Link
            href="/roommates"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Roommates
          </Link>
        </div>

        {/* Componente de detalle */}
        <RoommateDetail 
          roommate={roommate} 
        />
      </div>
    </div>
  )
}
