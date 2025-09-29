import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { communityPostFiltersSchema } from '@/lib/validations/community'
import type { CommunityPost, CommunityPostsResponse } from '@/types/community'
import CommunityListClient from './community-list-client'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getCommunityPosts(searchParams: PageProps['searchParams']): Promise<CommunityPostsResponse> {
  try {
    // Construir URL con parámetros
    const params = new URLSearchParams()
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','))
        } else {
          params.append(key, value)
        }
      }
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/comunidad/posts?${params}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Error al obtener posts de comunidad')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching community posts:', error)
    return {
      posts: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false
    }
  }
}

export default async function ComunidadPage({ searchParams }: PageProps) {
  const data = await getCommunityPosts(searchParams)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Comunidad</h1>
              <p className="text-gray-600 mt-1">Encuentra tu compañero de casa ideal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div>Cargando...</div>}>
          <CommunityListClient initialData={data} />
        </Suspense>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Comunidad - Encuentra tu compañero de casa ideal | MisionesArrienda',
  description: 'Conecta con personas que buscan compartir vivienda en Misiones. Sistema de matches, mensajes y perfiles verificados para encontrar el roommate perfecto.',
}
