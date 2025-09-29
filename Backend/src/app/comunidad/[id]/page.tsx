import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, MapPin, DollarSign, Calendar, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import AvatarUniversal from '@/components/ui/avatar-universal'
import CommunityPostActions from './community-post-actions'
import { createClient } from '@/lib/supabase/server'
import type { CommunityPost } from '@/types/community'

interface PageProps {
  params: {
    id: string
  }
}

// Función para obtener el post del servidor
async function getCommunityPost(id: string): Promise<CommunityPost | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/comunidad/posts/${id}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    const post = await response.json()
    
    // Incrementar views_count (no bloquear renderización si falla)
    try {
      const supabase = createClient()
      await supabase.rpc('community_post_inc_view', { post_id: id })
    } catch (viewError) {
      // Fallback: incrementar directamente si RPC no existe
      try {
        const supabase = createClient()
        await supabase
          .from('community_posts')
          .update({ views_count: (post.views_count || 0) + 1 })
          .eq('id', id)
      } catch (fallbackError) {
        console.error('Error incrementing views:', fallbackError)
        // No bloquear renderización
      }
    }
    
    return post
  } catch (error) {
    console.error('Error fetching community post:', error)
    return null
  }
}

// Función para obtener el usuario actual
async function getCurrentUser() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getCommunityPost(params.id)
  
  if (!post) {
    return {
      title: 'Post no encontrado - Misiones Arrienda'
    }
  }

  return {
    title: `${post.title} - Comunidad | Misiones Arrienda`,
    description: post.description,
  }
}

export default async function CommunityPostDetailPage({ params }: PageProps) {
  const post = await getCommunityPost(params.id)
  const currentUser = await getCurrentUser()
  
  if (!post) {
    notFound()
  }

  const isOwnPost = currentUser?.id === post.user_id

  const formatPrice = (post: CommunityPost) => {
    if (post.role === 'OFREZCO' && post.price) {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(post.price)
    }
    
    if (post.role === 'BUSCO' && post.budget_min && post.budget_max) {
      const formatNumber = (num: number) => {
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(num)
      }
      
      if (post.budget_min === post.budget_max) {
        return formatNumber(post.budget_min)
      }
      return `${formatNumber(post.budget_min)} - ${formatNumber(post.budget_max)}`
    }
    
    return 'Precio a consultar'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/comunidad">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                {post.city}
                {post.neighborhood && <span>• {post.neighborhood}</span>}
                <Badge variant={post.role === 'BUSCO' ? 'default' : 'secondary'}>
                  {post.role === 'BUSCO' ? 'Busco' : 'Ofrezco'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carrusel de imágenes */}
            {post.images.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="relative h-96 rounded-lg overflow-hidden">
                    <Image
                      src={post.images[0]}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                    {post.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded">
                        1 de {post.images.length}
                      </div>
                    )}
                  </div>
                  {post.images.length > 1 && (
                    <div className="p-4">
                      <div className="grid grid-cols-4 gap-2">
                        {post.images.slice(1, 5).map((image, index) => (
                          <div key={index} className="relative h-20 rounded overflow-hidden">
                            <Image
                              src={image}
                              alt={`Imagen ${index + 2}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Descripción */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>
              </CardContent>
            </Card>

            {/* Detalles */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Tipo de habitación</span>
                    <p className="font-medium">{post.room_type}</p>
                  </div>
                  {post.occupants && (
                    <div>
                      <span className="text-sm text-gray-600">Ocupantes</span>
                      <p className="font-medium">{post.occupants} personas</p>
                    </div>
                  )}
                  {post.available_from && (
                    <div>
                      <span className="text-sm text-gray-600">Disponible desde</span>
                      <p className="font-medium">{post.available_from}</p>
                    </div>
                  )}
                  {post.lease_term && (
                    <div>
                      <span className="text-sm text-gray-600">Duración</span>
                      <p className="font-medium">{post.lease_term}</p>
                    </div>
                  )}
                </div>

                {/* Preferencias */}
                <div>
                  <span className="text-sm text-gray-600">Preferencias</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline">{post.pet_pref}</Badge>
                    <Badge variant="outline">{post.smoke_pref}</Badge>
                    <Badge variant="outline">{post.diet}</Badge>
                  </div>
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Características</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {post.amenities.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Amenities</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {post.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Precio */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(post)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {post.role === 'OFREZCO' ? 'Precio por mes' : 'Presupuesto disponible'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Perfil del autor */}
            <Card>
              <CardHeader>
                <CardTitle>Perfil del autor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <AvatarUniversal
                    userId={post.user_id}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{post.author_name || 'Usuario'}</p>
                    <p className="text-sm text-gray-600">{post.city}</p>
                  </div>
                </div>

                <Link href={`/messages?userId=${post.user_id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar mensaje
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Acciones del post */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <CommunityPostActions
                  postId={post.id}
                  authorId={post.user_id}
                  currentUserId={currentUser?.id}
                  viewsCount={post.views_count || 0}
                  isOwnPost={isOwnPost}
                />
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Publicado {new Date(post.created_at).toLocaleDateString('es-AR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>ID: {post.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
