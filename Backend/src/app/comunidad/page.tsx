import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { communityPostFiltersSchema } from '@/lib/validations/community'
import type { CommunityPost, CommunityPostsResponse } from '@/types/community'
import CommunityListClient from './community-list-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, MessageCircle, Shield, Heart, MapPin } from 'lucide-react'
import { PageTracker } from '@/components/analytics/page-tracker'

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

// Mock data para demo
const demoPosts = [
  {
    id: 'demo-1',
    role: 'BUSCO',
    title: 'Estudiante busca habitación en Posadas',
    city: 'Posadas',
    budgetMin: 120000,
    budgetMax: 180000,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop']
  },
  {
    id: 'demo-2',
    role: 'OFREZCO',
    title: 'Habitación disponible en Oberá',
    city: 'Oberá',
    price: 150000,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop']
  },
  {
    id: 'demo-3',
    role: 'BUSCO',
    title: 'Profesional busca compañero de depto',
    city: 'Posadas',
    budgetMin: 100000,
    budgetMax: 150000,
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop']
  }
]

export default async function ComunidadPage({ searchParams }: PageProps) {
  // Detectar sesión
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Landing pública (sin sesión)
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50" data-testid="public-landing">
        <PageTracker eventName="visit_comunidad_public" />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Encontrá tu compañero de casa ideal
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Conectá con personas que buscan compartir vivienda en Misiones. Perfiles verificados y chat seguro.
            </p>
            <Link href="/register">
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

        {/* Demo Posts */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Anuncios Destacados</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {demoPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200 relative">
                    {post.images?.[0] && (
                      <img 
                        src={post.images[0]} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        post.role === 'BUSCO' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {post.role === 'BUSCO' ? 'Busco' : 'Ofrezco'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{post.title}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {post.city}
                    </div>
                    <p className="text-xl font-bold text-purple-600">
                      {post.role === 'BUSCO' 
                        ? `$${post.budgetMin?.toLocaleString('es-AR')} - $${post.budgetMax?.toLocaleString('es-AR')}`
                        : `$${post.price?.toLocaleString('es-AR')}`
                      }
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Link href="/register">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Ver todos los anuncios
                </Button>
              </Link>
            </div>
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
