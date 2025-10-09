'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, MapPin, DollarSign, Users, Filter, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import AvatarUniversal from '@/components/ui/avatar-universal'
import type { CommunityPost, CommunityPostsResponse, CommunityRole } from '@/types/community'
import { useQueryParamsState } from '@/hooks/useQueryParamsState'

interface CommunityListClientProps {
  initialData: CommunityPostsResponse
}

const cities = ['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles', 'Leandro N. Alem']

type RoleState = '' | 'BUSCO' | 'OFREZCO'
type SortState = 'recent' | 'highlight'

export default function CommunityListClient({ initialData }: CommunityListClientProps) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialData.posts)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filtros con persistencia en URL
  const { state, set } = useQueryParamsState<{
    q: string
    city: string
    role: RoleState
    min: string
    max: string
    sort: SortState
  }>({
    q: '',
    city: '',
    role: '',
    min: '',
    max: '',
    sort: 'recent'
  })

  // Helper null-safe para parsing de imágenes
  const parseImages = (val: any): string[] => {
    try {
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === 'string') { 
        const a = JSON.parse(val); 
        return Array.isArray(a) ? a.filter(Boolean) : []; 
      }
      return [];
    } catch { 
      return []; 
    }
  };

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

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (state.city) params.append('city', String(state.city))
      if (state.role) params.append('role', String(state.role))
      if (state.q) params.append('q', String(state.q))
      if (state.min) params.append('min', String(state.min))
      if (state.max) params.append('max', String(state.max))
      params.append('sort', String(state.sort || 'recent'))

      const response = await fetch(`/api/comunidad/posts?${params}`)
      if (response.ok) {
        const data: CommunityPostsResponse = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error searching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageClick = (userId: string) => {
    // Redirigir al sistema de mensajes existente
    window.location.href = `/messages?userId=${userId}`
  }

  return (
    <>
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por título, descripción..."
              value={String(state.q)}
              onChange={(e) => set('q', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Link href="/comunidad/publicar">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Publicar
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs de rol */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={state.role === '' ? 'default' : 'outline'}
            onClick={async () => {
              set('role', '')
              // Ejecutar búsqueda automáticamente después de cambiar el rol
              setTimeout(async () => {
                setLoading(true)
                try {
                  const params = new URLSearchParams()
                  if (state.city) params.append('city', String(state.city))
                  if (state.q) params.append('q', String(state.q))
                  if (state.min) params.append('min', String(state.min))
                  if (state.max) params.append('max', String(state.max))
                  params.append('sort', String(state.sort || 'recent'))
                  
                  const response = await fetch(`/api/comunidad/posts?${params}`)
                  if (response.ok) {
                    const data: CommunityPostsResponse = await response.json()
                    setPosts(data.posts)
                  }
                } catch (error) {
                  console.error('Error searching posts:', error)
                } finally {
                  setLoading(false)
                }
              }, 100)
            }}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={state.role === 'BUSCO' ? 'default' : 'outline'}
            onClick={async () => {
              set('role', 'BUSCO')
              // Ejecutar búsqueda automáticamente después de cambiar el rol
              setTimeout(async () => {
                setLoading(true)
                try {
                  const params = new URLSearchParams()
                  if (state.city) params.append('city', String(state.city))
                  params.append('role', 'BUSCO')
                  if (state.q) params.append('q', String(state.q))
                  if (state.min) params.append('min', String(state.min))
                  if (state.max) params.append('max', String(state.max))
                  params.append('sort', String(state.sort || 'recent'))
                  
                  const response = await fetch(`/api/comunidad/posts?${params}`)
                  if (response.ok) {
                    const data: CommunityPostsResponse = await response.json()
                    setPosts(data.posts)
                  }
                } catch (error) {
                  console.error('Error searching posts:', error)
                } finally {
                  setLoading(false)
                }
              }, 100)
            }}
            size="sm"
          >
            Busco habitación
          </Button>
          <Button
            variant={state.role === 'OFREZCO' ? 'default' : 'outline'}
            onClick={async () => {
              set('role', 'OFREZCO')
              // Ejecutar búsqueda automáticamente después de cambiar el rol
              setTimeout(async () => {
                setLoading(true)
                try {
                  const params = new URLSearchParams()
                  if (state.city) params.append('city', String(state.city))
                  params.append('role', 'OFREZCO')
                  if (state.q) params.append('q', String(state.q))
                  if (state.min) params.append('min', String(state.min))
                  if (state.max) params.append('max', String(state.max))
                  params.append('sort', String(state.sort || 'recent'))
                  
                  const response = await fetch(`/api/comunidad/posts?${params}`)
                  if (response.ok) {
                    const data: CommunityPostsResponse = await response.json()
                    setPosts(data.posts)
                  }
                } catch (error) {
                  console.error('Error searching posts:', error)
                } finally {
                  setLoading(false)
                }
              }, 100)
            }}
            size="sm"
          >
            Ofrezco habitación
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
            <Select value={String(state.city)} onValueChange={(value) => set('city', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map(cityName => (
                  <SelectItem key={cityName} value={cityName}>{cityName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Precio mín."
              value={String(state.min)}
              onChange={(e) => set('min', e.target.value)}
            />

            <Input
              type="number"
              placeholder="Precio máx."
              value={String(state.max)}
              onChange={(e) => set('max', e.target.value)}
            />

            <Select value={String(state.sort) || 'recent'} onValueChange={(value: 'recent' | 'highlight') => set('sort', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="highlight">Destacados</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        )}
      </div>

      {/* Grid de posts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AvatarUniversal
                      userId={post.user_id}
                      size="sm"
                    />
                    <div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {post.city}
                        {post.neighborhood && <span>• {post.neighborhood}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant={post.role === 'BUSCO' ? 'default' : 'secondary'}>
                    {post.role === 'BUSCO' ? 'Busco' : 'Ofrezco'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Imagen principal */}
                {(() => {
                  const imgs = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
                  return imgs.length > 0 && (
                    <div className="relative h-48 rounded-lg overflow-hidden">
                      <Image
                        src={imgs[0]}
                        alt={post.title ?? 'Publicación'}
                        fill
                        className="object-cover"
                      />
                      {imgs.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          +{imgs.length - 1}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Precio */}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{formatPrice(post)}</span>
                </div>

                {/* Descripción */}
                <p className="text-sm text-gray-600 line-clamp-3">{post.description}</p>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/comunidad/${post.id}`} className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Ver detalle
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => handleMessageClick(post.user_id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron posts</h3>
          <p className="text-gray-600 mb-6">Intenta ajustar tus filtros de búsqueda</p>
          <Link href="/comunidad/publicar">
            <Button>Crear tu post</Button>
          </Link>
        </div>
      )}
    </>
  )
}
