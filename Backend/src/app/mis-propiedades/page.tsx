'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: string
  city: string
  province: string
  propertyType: string
  operationType: string
  bedrooms: number
  bathrooms: number
  area: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isActive: boolean
  images: string[]
  coverUrl?: string
  createdAt: string
  updatedAt: string
  imagesCount: number
}

interface ApiResponse {
  properties: Property[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  filters: {
    status: string
    orderBy: string
    order: string
  }
}

// Componente Skeleton simple
function Skeleton({ className }: { className: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  )
}

// Componente para manejar imágenes de propiedades SIN placeholders
function PropertyImage({ property, alt }: { property: Property; alt: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    // Usar la primera imagen disponible - NO fallback a placeholder
    if (property.images && property.images.length > 0) {
      setImageUrl(property.images[0])
    } else if (property.coverUrl) {
      setImageUrl(property.coverUrl)
    } else {
      setImageUrl(null)
    }
  }, [property.images, property.coverUrl])

  if (!imageUrl) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-500">
        <Eye className="w-12 h-12 mb-2" />
        <span className="text-sm font-medium">Sin imágenes disponibles aún</span>
        <span className="text-xs">Agregar fotos</span>
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      className="object-cover"
      onError={() => {
        setImageUrl(null)
      }}
    />
  )
}

export default function MisPropiedadesPage() {
  const { user, isAuthenticated } = useUser()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null)

  // Cargar propiedades del usuario
  const loadProperties = async (page = 1, status = 'ALL') => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        status,
        orderBy: 'updated_at',
        order: 'desc'
      })

      const response = await fetch(`/api/my-properties?${params}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        }
        throw new Error('Error al cargar propiedades')
      }

      const data: ApiResponse = await response.json()
      setProperties(data.properties)
      setPagination(data.pagination)

    } catch (error) {
      console.error('Error loading properties:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Cargar propiedades al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      loadProperties(currentPage, statusFilter)
    }
  }, [isAuthenticated, currentPage, statusFilter])

  // Manejar cambio de filtro de estado
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Obtener color del badge según estado
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Formatear precio
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS'
    }).format(price)
  }

  // Si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Mis Propiedades</h1>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus propiedades.</p>
          <Link href="/login">
            <Button>Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Propiedades</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y edita tus propiedades publicadas
          </p>
        </div>
        <Link href="/publicar">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Propiedad
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => handleStatusFilter(status)}
            size="sm"
          >
            {status === 'ALL' ? 'Todas' : 
             status === 'PUBLISHED' ? 'Publicadas' :
             status === 'DRAFT' ? 'Borradores' : 'Archivadas'}
          </Button>
        ))}
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
                    </CardContent>
                  </Card>
                  )
                })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-800">{error}</p>
            <Button 
              onClick={() => loadProperties(currentPage, statusFilter)}
              className="mt-2"
              size="sm"
            >
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de propiedades */}
      {!loading && !error && (
        <>
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">No tienes propiedades</h3>
                <p className="text-gray-600 mb-4">
                  Comienza publicando tu primera propiedad en la plataforma.
                </p>
                <Link href="/publicar">
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Publicar Primera Propiedad
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Grid de propiedades */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {properties.map((property) => {
                  // LOG TEMPORAL PARA DEBUGGING
                  if (process.env.NODE_ENV === 'development') {
                    console.log('[MIS-PROPS IMG]', { 
                      id: property.id, 
                      coverUrl: property.coverUrl, 
                      imagesLen: property.images?.length,
                      status: property.status,
                      title: property.title.substring(0, 20)
                    })
                  }
                  
                  return (
                  <Card key={property.id} className="overflow-hidden">
                    {/* Imagen */}
                    <div className="relative h-48">
                      <PropertyImage 
                        property={property}
                        alt={property.title}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={getStatusBadgeColor(property.status)}>
                          {property.status === 'PUBLISHED' ? 'Publicada' :
                           property.status === 'DRAFT' ? 'Borrador' : 'Archivada'}
                        </Badge>
                      </div>
                    </div>

                    {/* Contenido */}
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">
                        {property.title}
                      </CardTitle>
                      <div className="text-sm text-gray-600">
                        {property.city}, {property.province}
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Precio */}
                      <div className="text-xl font-bold text-blue-600 mb-2">
                        {formatPrice(property.price, property.currency)}
                      </div>

                      {/* Características */}
                      <div className="flex gap-4 text-sm text-gray-600 mb-4">
                        <span>{property.bedrooms} dorm</span>
                        <span>{property.bathrooms} baños</span>
                        <span>{property.area} m²</span>
                      </div>

                      {/* Información adicional */}
                      <div className="text-xs text-gray-500 mb-4">
                        <div>Actualizado: {new Date(property.updatedAt).toLocaleDateString()}</div>
                        <div>{property.imagesCount} imágenes</div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <Link href={`/properties/${property.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        <Link href={`/mis-propiedades/${property.id}/editar`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Settings className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const page = i + 1
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>
                      }
                      return null
                    }).filter(Boolean)}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Siguiente
                  </Button>
                </div>
              )}

              {/* Información de resultados */}
              {pagination && (
                <div className="text-center text-sm text-gray-600 mt-4">
                  Mostrando {properties.length} de {pagination.total} propiedades
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
