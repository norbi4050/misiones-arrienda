import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { communityPostFiltersSchema } from '@/lib/validations/community'
import type { CommunityPost, CommunityPostsResponse } from '@/types/community'
import CommunityListClient from './community-list-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, MessageCircle, Shield, Heart, MapPin, Building2 } from 'lucide-react'
import { PageTracker } from '@/components/analytics/page-tracker'
import { EmptyState } from '@/components/ui/EmptyState'
import { FEATURE_COMMUNITY_SOFT_GUARD } from '@/utils/env'
import { CommunityPostCardPublic } from '@/components/comunidad/CommunityPostCardPublic'
import { CommunityFiltersPublic } from '@/components/comunidad/CommunityFiltersPublic'
import { CommunityDebugInfo } from '@/components/comunidad/CommunityDebugInfo'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getCommunityPosts(searchParams: PageProps['searchParams']): Promise<CommunityPostsResponse> {
  try {
    // Construir URL con parámetros
    const params = new URLSearchParams()

    // Agregar sort=recent por defecto si no está especificado
    if (!searchParams.sort) {
      params.append('sort', 'recent')
    }

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
    const fullUrl = `${baseUrl}/api/comunidad/posts?${params}`

    console.log('[getCommunityPosts] Fetching from URL:', fullUrl)

    const response = await fetch(fullUrl, {
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('[getCommunityPosts] Response not OK:', response.status, response.statusText)
      throw new Error('Error al obtener posts de comunidad')
    }

    const data = await response.json()
    console.log('[getCommunityPosts] Response data:', data)

    return data
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
  // Detectar sesión
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // [AuthBridge] Guard: Verificar si es inmobiliaria
  // GUARD: soft-guard en RSC para UX; seguridad sigue en RLS/APIs
  if (user) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('user_type, is_company')
        .eq('id', user.id)
        .single()

      // Si es inmobiliaria (verificar ambos campos para mayor robustez)
      const isAgency = userData?.is_company === true || 
                      userData?.user_type?.toUpperCase() === 'INMOBILIARIA' ||
                      userData?.user_type?.toUpperCase() === 'AGENCY'

      if (isAgency) {
        // GUARD: Si soft-guard está activo, mostrar EmptyState en lugar de redirect
        // Si está desactivado, mantener comportamiento legacy (redirect 307)
        if (FEATURE_COMMUNITY_SOFT_GUARD) {
          console.log('[AuthBridge] Agency user accessing /comunidad with soft-guard (showing EmptyState)')
          return (
            <main className="min-h-screen bg-gray-50">
              <PageTracker eventName="visit_comunidad_agency_blocked" />
              <EmptyState
                title="Comunidad disponible para inquilinos y particulares"
                description="Si sos inmobiliaria, gestioná tus propiedades y mensajes desde Mi Empresa. La sección Comunidad está diseñada para personas que buscan compartir vivienda."
                icon={<Building2 className="w-16 h-16 text-purple-600" />}
                actions={
                  <>
                    <Link href="/mi-empresa" prefetch={false}>
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                        Ir a Mi Empresa
                      </Button>
                    </Link>
                    <Link href="/properties" prefetch={false}>
                      <Button size="lg" variant="outline">
                        Ver Propiedades
                      </Button>
                    </Link>
                  </>
                }
              />
            </main>
          )
        } else {
          // Legacy mode: redirect como antes
          console.log('[AuthBridge] Agency user detected, redirecting to /mi-empresa (legacy mode)')
          redirect('/mi-empresa')
        }
      }
    } catch (error) {
      console.error('[AuthBridge] Error checking user type:', error)
      // En caso de error, permitir acceso (fail-open para mejor UX)
    }
  }

  // Landing pública (sin sesión) - Mostrar posts reales con auth wall
  if (!user) {
    // Fetch real posts for public view
    const publicData = await getCommunityPosts(searchParams)

    // Debug: Log para verificar qué datos llegan
    console.log('[COMUNIDAD PUBLIC] Posts fetched:', {
      total: publicData.total,
      postsCount: publicData.posts.length,
      posts: publicData.posts
    })

    return (
      <main className="min-h-screen bg-gray-50" data-testid="public-landing">
        <PageTracker eventName="visit_comunidad_public" />
        <CommunityDebugInfo
          postsCount={publicData.posts.length}
          total={publicData.total}
          searchParams={searchParams}
        />

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Encontrá tu compañero de casa ideal
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Conectá con personas que buscan compartir vivienda en Misiones. Perfiles verificados y chat seguro.
            </p>
            <Link href="/register" prefetch={false}>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6">
                Unirme a la comunidad
              </Button>
            </Link>
          </div>
        </section>

        {/* Highlights */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">¿Por qué usar nuestra comunidad?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Perfiles Verificados</h3>
                  <p className="text-gray-600">
                    Todos los usuarios pasan por un proceso de verificación. Conocé con quién vas a vivir.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Chat Directo y Seguro</h3>
                  <p className="text-gray-600">
                    Mensajería interna para coordinar visitas y conocerse antes de decidir.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Filtros por Preferencias</h3>
                  <p className="text-gray-600">
                    Filtrá por mascotas, fumador, dieta y más. Encontrá compatibilidad real.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Real Posts with Filters - Flatmates Style */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Anuncios Disponibles</h2>

            {/* Public Filters */}
            <CommunityFiltersPublic />

            {/* Posts Grid */}
            {publicData.posts.length > 0 ? (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {publicData.posts.slice(0, 9).map((post) => (
                    <CommunityPostCardPublic key={post.id} post={post} />
                  ))}
                </div>

                {/* CTA to see more */}
                {publicData.total > 9 && (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      {publicData.total - 9} anuncios más disponibles
                    </p>
                    <Link href="/register" prefetch={false}>
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                        Registrate para ver todos ({publicData.total} anuncios)
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Todavía no hay anuncios publicados
                </h3>
                <p className="text-gray-500 mb-6">
                  Sé de los primeros en publicar y obtené máxima visibilidad
                </p>
                <Link href="/register" prefetch={false}>
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    Publicar mi anuncio gratis
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    )
  }

  // Feed real (usuario logueado)
  const data = await getCommunityPosts(searchParams)

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTracker eventName="visit_comunidad" />
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
