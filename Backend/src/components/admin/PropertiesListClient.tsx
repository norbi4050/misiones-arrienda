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
  Building2,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  AlertTriangle,
  MapPin,
  DollarSign,
  Calendar,
  User
} from 'lucide-react'
import Link from 'next/link'

interface Property {
  id: string
  title: string
  description: string
  price: number
  city: string
  province: string
  status: string
  userId: string
  createdAt: string
  updatedAt: string
  images?: string[]
  user?: {
    name: string
    email: string
  }
  reportsCount?: number
}

interface PropertyStats {
  total: number
  available: number
  rented: number
  suspended: number
  pending: number
}

export function PropertiesListClient() {
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<PropertyStats>({
    total: 0,
    available: 0,
    rented: 0,
    suspended: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filtros y búsqueda
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Paginación
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 12

  // Modal de confirmación
  const [showModal, setShowModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [modalAction, setModalAction] = useState<'suspend' | 'activate' | 'delete' | null>(null)

  // Cargar propiedades
  const loadProperties = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })

      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (cityFilter !== 'all') params.set('city', cityFilter)

      const response = await fetch(`/api/admin/properties?${params}`)

      if (!response.ok) {
        throw new Error('Error loading properties')
      }

      const data = await response.json()

      // Debug: Log para ver estructura de imágenes
      if (data.properties && data.properties.length > 0) {
        console.log('[PropertiesListClient] Sample property images:', {
          firstPropertyImages: data.properties[0]?.images,
          imagesType: typeof data.properties[0]?.images,
          isArray: Array.isArray(data.properties[0]?.images)
        })
      }

      setProperties(data.properties || [])
      setStats(data.stats || stats)
      setTotalPages(data.pagination?.totalPages || 1)

    } catch (error) {
      console.error('Error loading properties:', error)
      alert('❌ Error cargando propiedades')
    } finally {
      setLoading(false)
    }
  }

  // Acciones sobre propiedades
  const handlePropertyAction = async (propertyId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      setActionLoading(propertyId)

      const response = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, action })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error performing action')
      }

      alert(`✅ ${action === 'suspend' ? 'Propiedad suspendida' : action === 'activate' ? 'Propiedad reactivada' : 'Propiedad eliminada'}`)

      await loadProperties()
      setShowModal(false)
      setSelectedProperty(null)
      setModalAction(null)

    } catch (error: any) {
      console.error('Error:', error)
      alert(`❌ ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Confirmar acción
  const confirmAction = (property: Property, action: 'suspend' | 'activate' | 'delete') => {
    setSelectedProperty(property)
    setModalAction(action)
    setShowModal(true)
  }

  useEffect(() => {
    loadProperties()
  }, [page, statusFilter, cityFilter, sortBy, sortOrder])

  // Buscar al presionar Enter
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1)
      loadProperties()
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
      RENTED: 'bg-blue-100 text-blue-800 border-blue-200',
      SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'
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
  const uniqueCities = Array.from(new Set(properties.map(p => p.city))).sort()

  if (loading && properties.length === 0) {
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
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alquiladas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.rented}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-400" />
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
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="RENTED">Alquilada</SelectItem>
                <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {uniqueCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Fecha de creación</SelectItem>
                <SelectItem value="price">Precio</SelectItem>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="updatedAt">Última actualización</SelectItem>
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
              onClick={() => loadProperties()}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de propiedades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => {
          // Parse images si vienen como string
          let imageUrl = null
          try {
            if (property.images) {
              if (typeof property.images === 'string') {
                const parsed = JSON.parse(property.images)
                imageUrl = Array.isArray(parsed) ? parsed[0] : null
              } else if (Array.isArray(property.images)) {
                imageUrl = property.images[0]
              }
            }
          } catch (e) {
            console.warn('[PropertiesListClient] Error parsing images for property:', property.id, e)
          }

          return (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Si la imagen falla al cargar, mostrar el placeholder
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>' + parent.innerHTML
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Building2 className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <Badge className={`absolute top-2 right-2 ${getStatusBadge(property.status)}`}>
                {property.status}
              </Badge>
              {property.reportsCount && property.reportsCount > 0 && (
                <Badge className="absolute top-2 left-2 bg-red-600 text-white">
                  {property.reportsCount} reportes
                </Badge>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                  {property.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {property.description}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{property.city}, {property.province}</span>
                </div>

                <div className="flex items-center text-gray-900 font-semibold">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>{formatPrice(property.price)}/mes</span>
                </div>

                {property.user && (
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-xs">{property.user.name || property.user.email}</span>
                  </div>
                )}

                <div className="flex items-center text-gray-500 text-xs">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Publicada {formatDate(property.createdAt)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Link href={`/property/${property.id}`} target="_blank" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </Link>

                {(property.status === 'AVAILABLE' || property.status === 'published') ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmAction(property, 'suspend')}
                    disabled={actionLoading === property.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Suspender
                  </Button>
                ) : (property.status === 'SUSPENDED' || property.status === 'suspended') ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmAction(property, 'activate')}
                    disabled={actionLoading === property.id}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activar
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmAction(property, 'delete')}
                  disabled={actionLoading === property.id}
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

      {properties.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron propiedades</p>
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
      {showModal && selectedProperty && modalAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">
                Confirmar{' '}
                {modalAction === 'delete' ? 'Eliminación' :
                 modalAction === 'suspend' ? 'Suspensión' : 'Reactivación'}
              </CardTitle>
              <CardDescription>
                Esta acción {modalAction === 'delete' ? 'no se puede deshacer' : 'afectará la visibilidad de la propiedad'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-900">
                      <strong>{selectedProperty.title}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedProperty.city}, {selectedProperty.province} - {formatPrice(selectedProperty.price)}
                    </p>
                    {modalAction === 'delete' && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ Se eliminará permanentemente esta propiedad y todos sus datos
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedProperty(null)
                    setModalAction(null)
                  }}
                  disabled={actionLoading === selectedProperty.id}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handlePropertyAction(selectedProperty.id, modalAction)}
                  disabled={actionLoading === selectedProperty.id}
                >
                  {actionLoading === selectedProperty.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    `Confirmar ${modalAction === 'delete' ? 'Eliminación' : modalAction === 'suspend' ? 'Suspensión' : 'Reactivación'}`
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
