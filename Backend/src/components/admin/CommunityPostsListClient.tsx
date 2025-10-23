'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageCircle,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  AlertTriangle,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Heart,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface CommunityPost {
  id: string
  title: string
  description: string
  role: 'BUSCO' | 'OFREZCO'
  city: string
  price?: number
  budget_min?: number
  budget_max?: number
  room_type?: string
  is_active: boolean
  user_id: string
  created_at: string
  updated_at: string
  like_count?: number
  images?: string[]
  user?: {
    name: string
    email: string
  }
  reportsCount?: number
}

interface PostStats {
  total: number
  active: number
  suspended: number
  offer: number
  seek: number
}

export function CommunityPostsListClient() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [stats, setStats] = useState<PostStats>({
    total: 0,
    active: 0,
    suspended: 0,
    offer: 0,
    seek: 0
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filtros y búsqueda
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Paginación
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 12

  // Modal de confirmación
  const [showModal, setShowModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [modalAction, setModalAction] = useState<'suspend' | 'activate' | 'delete' | null>(null)

  // Cargar publicaciones
  const loadPosts = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })

      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (cityFilter !== 'all') params.set('city', cityFilter)

      const response = await fetch(`/api/admin/community-posts?${params}`)

      if (!response.ok) {
        throw new Error('Error loading community posts')
      }

      const data = await response.json()

      setPosts(data.posts || [])
      setStats(data.stats || stats)
      setTotalPages(data.pagination?.totalPages || 1)

    } catch (error) {
      console.error('Error loading community posts:', error)
      alert('❌ Error cargando publicaciones de comunidad')
    } finally {
      setLoading(false)
    }
  }

  // Acciones sobre publicaciones
  const handlePostAction = async (postId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      setActionLoading(postId)

      const response = await fetch('/api/admin/community-posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error performing action')
      }

      alert(`✅ ${action === 'suspend' ? 'Publicación suspendida' : action === 'activate' ? 'Publicación reactivada' : 'Publicación eliminada'}`)

      // Si es delete, remover del estado local inmediatamente para mejor UX
      if (action === 'delete') {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId))
        // También actualizar stats
        setStats(prevStats => ({
          ...prevStats,
          total: prevStats.total - 1
        }))
      } else {
        // Para suspend/activate, recargar la lista
        await loadPosts()
      }

      setShowModal(false)
      setSelectedPost(null)
      setModalAction(null)

    } catch (error: any) {
      console.error('Error:', error)
      alert(`❌ ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Confirmar acción
  const confirmAction = (post: CommunityPost, action: 'suspend' | 'activate' | 'delete') => {
    setSelectedPost(post)
    setModalAction(action)
    setShowModal(true)
  }

  useEffect(() => {
    loadPosts()
  }, [page, roleFilter, statusFilter, cityFilter, sortBy, sortOrder])

  // Buscar al presionar Enter
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1)
      loadPosts()
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  const getRoleBadge = (role: string) => {
    return role === 'OFREZCO'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Obtener ciudades únicas
  const uniqueCities = Array.from(new Set(posts.map(p => p.city))).sort()

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspendidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <Ban className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ofrecen</p>
                <p className="text-2xl font-bold text-blue-600">{stats.offer}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Buscan</p>
                <p className="text-2xl font-bold text-purple-600">{stats.seek}</p>
              </div>
              <Search className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por título o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="BUSCO">Busco</SelectItem>
                <SelectItem value="OFREZCO">Ofrezco</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="suspended">Suspendidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Fecha de creación</SelectItem>
                <SelectItem value="likes">Likes</SelectItem>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="updated_at">Última actualización</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Ascendente' : '↓ Descendente'}
            </Button>

            <Button
              variant="outline"
              onClick={() => loadPosts()}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de publicaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          // Parse images si vienen como string
          let imageUrl = null
          try {
            if (post.images) {
              if (typeof post.images === 'string') {
                const parsed = JSON.parse(post.images)
                imageUrl = Array.isArray(parsed) ? parsed[0] : null
              } else if (Array.isArray(post.images)) {
                imageUrl = post.images[0]
              }
            }
          } catch (e) {
            console.warn('[CommunityPostsListClient] Error parsing images for post:', post.id, e)
          }

          return (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>' + parent.innerHTML
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <Badge className={`absolute top-2 right-2 ${getStatusBadge(post.is_active)}`}>
                {post.is_active ? 'Activa' : 'Suspendida'}
              </Badge>
              <Badge className={`absolute top-2 left-2 ${getRoleBadge(post.role)}`}>
                {post.role}
              </Badge>
              {post.reportsCount && post.reportsCount > 0 && (
                <Badge className="absolute top-12 left-2 bg-red-600 text-white">
                  {post.reportsCount} reportes
                </Badge>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {post.description}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{post.city}</span>
                </div>

                {post.role === 'OFREZCO' && post.price && (
                  <div className="flex items-center text-gray-900 font-semibold">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>{formatPrice(post.price)}/mes</span>
                  </div>
                )}

                {post.role === 'BUSCO' && post.budget_min && post.budget_max && (
                  <div className="flex items-center text-gray-900 font-semibold">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>{formatPrice(post.budget_min)} - {formatPrice(post.budget_max)}</span>
                  </div>
                )}

                {post.user && (
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-xs">{post.user.name || post.user.email}</span>
                  </div>
                )}

                {post.like_count !== undefined && (
                  <div className="flex items-center text-gray-600">
                    <Heart className="h-4 w-4 mr-2" />
                    <span className="text-xs">{post.like_count} likes</span>
                  </div>
                )}

                <div className="flex items-center text-gray-500 text-xs">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Publicada {formatDate(post.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Link href={`/comunidad/${post.id}`} target="_blank" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </Link>

                {post.is_active ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmAction(post, 'suspend')}
                    disabled={actionLoading === post.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Suspender
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmAction(post, 'activate')}
                    disabled={actionLoading === post.id}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activar
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmAction(post, 'delete')}
                  disabled={actionLoading === post.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {posts.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron publicaciones de comunidad</p>
          </CardContent>
        </Card>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Anterior
          </Button>

          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal de confirmación */}
      {showModal && selectedPost && modalAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg shadow-2xl border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {modalAction === 'delete' ? (
                  <>
                    <Trash2 className="h-6 w-6 text-red-600" />
                    <span className="text-red-600">Confirmar Eliminación</span>
                  </>
                ) : modalAction === 'suspend' ? (
                  <>
                    <Ban className="h-6 w-6 text-orange-600" />
                    <span className="text-orange-600">Confirmar Suspensión</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-green-600">Confirmar Reactivación</span>
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {modalAction === 'delete'
                  ? '⚠️ Esta acción NO se puede deshacer. La publicación y todos sus datos serán eliminados permanentemente.'
                  : modalAction === 'suspend'
                  ? 'La publicación dejará de ser visible para los usuarios hasta que sea reactivada.'
                  : 'La publicación volverá a ser visible para todos los usuarios.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`${
                modalAction === 'delete'
                  ? 'bg-red-50 border-red-300'
                  : modalAction === 'suspend'
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-green-50 border-green-300'
              } border-2 rounded-lg p-4`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadge(selectedPost.role)}>
                      {selectedPost.role}
                    </Badge>
                    <p className="text-base font-bold text-gray-900">
                      {selectedPost.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedPost.city}</span>
                  </div>
                  {selectedPost.role === 'OFREZCO' && selectedPost.price && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatPrice(selectedPost.price)}/mes</span>
                    </div>
                  )}
                  {selectedPost.role === 'BUSCO' && selectedPost.budget_min && selectedPost.budget_max && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatPrice(selectedPost.budget_min)} - {formatPrice(selectedPost.budget_max)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedPost(null)
                    setModalAction(null)
                  }}
                  disabled={actionLoading === selectedPost.id}
                  className="min-w-[120px] text-base font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  size="lg"
                  onClick={() => handlePostAction(selectedPost.id, modalAction)}
                  disabled={actionLoading === selectedPost.id}
                  className={`min-w-[200px] text-base font-bold ${
                    modalAction === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : modalAction === 'suspend'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {actionLoading === selectedPost.id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      {modalAction === 'delete' && <Trash2 className="h-5 w-5 mr-2" />}
                      {modalAction === 'suspend' && <Ban className="h-5 w-5 mr-2" />}
                      {modalAction === 'activate' && <CheckCircle className="h-5 w-5 mr-2" />}
                      {`Confirmar ${modalAction === 'delete' ? 'Eliminación' : modalAction === 'suspend' ? 'Suspensión' : 'Reactivación'}`}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
