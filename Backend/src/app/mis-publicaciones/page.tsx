'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Settings, Eye, Trash2, Users, MapPin, Star, Heart, FileText } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { PropertyCard } from '@/components/property-card'

// Interfaces para tipos de datos
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
  coverUrlExpiresAt?: string
  isPlaceholder?: boolean
  createdAt: string
  updatedAt: string
  imagesCount: number
}

interface CommunityProfile {
  id: string
  role: 'BUSCO' | 'OFREZCO'
  city: string
  neighborhood?: string
  budgetMin: number
  budgetMax: number
  bio?: string
  photos: string[]
  age?: number
  petPref: string
  smokePref: string
  diet: string
  tags: string[]
  status: string
  highlightedUntil?: string
  user: {
    id: string
    name: string
    avatar?: string
    rating: number
    reviewCount: number
  }
  rooms?: Array<{
    id: string
    title: string
    price: number
    type: string
    photos: string[]
  }>
  _count: {
    likesReceived: number
  }
  createdAt: Date
  updatedAt: Date
}

interface ApiResponse<T> {
  properties?: T[]
  profiles?: T[]
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
    orderBy?: string
    order?: string
  }
}

export default function MisPublicacionesPage() {
  const { user, isAuthenticated } = useUser()
  const [activeTab, setActiveTab] = useState('propiedades')
  
  // Estados para propiedades
  const [properties, setProperties] = useState<Property[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [propertiesError, setPropertiesError] = useState<string | null>(null)
  const [propertiesPagination, setPropertiesPagination] = useState<ApiResponse<Property>['pagination'] | null>(null)
  
  // Estados para perfiles de comunidad
  const [communityProfiles, setCommunityProfiles] = useState<CommunityProfile[]>([])
  const [communityLoading, setCommunityLoading] = useState(true)
  const [communityError, setCommunityError] = useState<string | null>(null)
  const [communityPagination, setCommunityPagination] = useState<ApiResponse<CommunityProfile>['pagination'] | null>(null)

  // Cargar propiedades del usuario
  const loadProperties = async () => {
    if (!isAuthenticated) return

    try {
      setPropertiesLoading(true)
      setPropertiesError(null)

      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        status: 'ALL',
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

      const data: ApiResponse<Property> = await response.json()
      setProperties(data.properties || [])
      setPropertiesPagination(data.pagination)

    } catch (error) {
      console.error('Error loading properties:', error)
      setPropertiesError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setPropertiesLoading(false)
    }
  }

  // Cargar perfiles de comunidad del usuario
  const loadCommunityProfiles = async () => {
    if (!isAuthenticated) return

    try {
      setCommunityLoading(true)
      setCommunityError(null)

      const params = new URLSearchParams({
        page: '1',
        limit: '12',
        status: 'ALL'
      })

      const response = await fetch(`/api/my-community-profiles?${params}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        }
        throw new Error('Error al cargar perfiles de comunidad')
      }

      const data: ApiResponse<CommunityProfile> = await response.json()
      setCommunityProfiles(data.profiles || [])
      setCommunityPagination(data.pagination)

    } catch (error) {
      console.error('Error loading community profiles:', error)
      setCommunityError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setCommunityLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      loadProperties()
      loadCommunityProfiles()
    }
  }, [isAuthenticated])

  // Funciones de utilidad
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number, currency: string = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS'
    }).format(price)
  }

  const formatBudget = (min: number, max: number) => {
    if (min === max) return formatPrice(min)
    return `${formatPrice(min)} - ${formatPrice(max)}`
  }

  const getPreferenceText = (pref: string, type: 'pet' | 'smoke' | 'diet') => {
    const preferences = {
      pet: {
        'SI_PET': 'Acepta mascotas',
        'NO_PET': 'No mascotas',
        'INDIFERENTE': 'Indiferente'
      },
      smoke: {
        'FUMADOR': 'Fumador',
        'NO_FUMADOR': 'No fumador',
        'INDIFERENTE': 'Indiferente'
      },
      diet: {
        'NINGUNA': 'Sin restricciones',
        'VEGETARIANO': 'Vegetariano',
        'VEGANO': 'Vegano',
        'CELIACO': 'Celíaco',
        'OTRO': 'Otras restricciones'
      }
    }

    return preferences[type][pref as keyof typeof preferences[typeof type]] || pref
  }

  // Si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Mis Publicaciones</h1>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus publicaciones.</p>
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
          <h1 className="text-3xl font-bold">Mis Publicaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todas tus publicaciones de propiedades y comunidad
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/publicar">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Propiedad
            </Button>
          </Link>
          <Link href="/comunidad/publicar">
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Perfil Comunidad
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="propiedades" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Propiedades ({properties.length})
          </TabsTrigger>
          <TabsTrigger value="comunidad" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Comunidad ({communityProfiles.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab de Propiedades */}
        <TabsContent value="propiedades" className="mt-6">
          {propertiesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-48 bg-gray-300 rounded"></div>
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
          )}

          {propertiesError && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-800">{propertiesError}</p>
                <Button onClick={loadProperties} className="mt-2" size="sm">
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!propertiesLoading && !propertiesError && (
            <>
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <div key={property.id} className="space-y-3">
                      {/* PropertyCard con badge superpuesto */}
                      <div className="relative">
                        {/* Badge de estado superpuesto sobre la imagen */}
                        <div className="absolute top-2 right-2 z-20">
                          <Badge className={getStatusBadgeColor(property.status)}>
                            {property.status === 'PUBLISHED' ? 'Publicada' :
                             property.status === 'DRAFT' ? 'Borrador' : 'Archivada'}
                          </Badge>
                        </div>
                        
                        {/* Usar PropertyCard individual con TODAS las props necesarias */}
                        <PropertyCard
                          id={property.id}
                          title={property.title}
                          price={property.price}
                          images={property.images}
                          coverUrl={property.coverUrl}
                          coverUrlExpiresAt={property.coverUrlExpiresAt}
                          isPlaceholder={property.isPlaceholder}
                          imagesCount={property.imagesCount}
                          city={property.city}
                          province={property.province}
                          bedrooms={property.bedrooms}
                          bathrooms={property.bathrooms}
                          area={property.area}
                          propertyType={property.propertyType}
                        />
                      </div>
                      
                      {/* Panel de información y acciones debajo de cada PropertyCard */}
                      <div className="bg-white border rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-3">
                          <div>Actualizado: {new Date(property.updatedAt).toLocaleDateString()}</div>
                          <div>{property.imagesCount} imágenes</div>
                        </div>

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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab de Comunidad */}
        <TabsContent value="comunidad" className="mt-6">
          {communityLoading && (
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
          )}

          {communityError && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-800">{communityError}</p>
                <Button onClick={loadCommunityProfiles} className="mt-2" size="sm">
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!communityLoading && !communityError && (
            <>
              {communityProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes perfiles de comunidad</h3>
                  <p className="text-gray-600 mb-4">
                    Crea tu perfil para encontrar compañeros de casa ideales.
                  </p>
                  <Link href="/comunidad/publicar">
                    <Button className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Crear Perfil de Comunidad
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communityProfiles.map((profile) => (
                    <Card key={profile.id} className={`hover:shadow-lg transition-shadow ${profile.highlightedUntil ? 'ring-2 ring-yellow-400' : ''}`}>
                      {profile.highlightedUntil && (
                        <div className="bg-yellow-400 text-yellow-900 text-xs font-medium px-3 py-1 rounded-t-lg">
                          ⭐ Destacado
                        </div>
                      )}

                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {profile.user.avatar ? (
                                <Image
                                  src={profile.user.avatar}
                                  alt={profile.user.name}
                                  width={48}
                                  height={48}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                  <Users className="w-6 h-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{profile.user.name}</CardTitle>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                {profile.city}
                                {profile.age && <span>• {profile.age} años</span>}
                              </div>
                            </div>
                          </div>
                          <Badge variant={profile.role === 'BUSCO' ? 'default' : 'secondary'}>
                            {profile.role === 'BUSCO' ? 'Busco' : 'Ofrezco'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {profile.photos.length > 0 && (
                          <div className="relative h-48 rounded-lg overflow-hidden">
                            <Image
                              src={profile.photos[0]}
                              alt="Foto de perfil"
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                            />
                            {profile.photos.length > 1 && (
                              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                +{profile.photos.length - 1}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 font-bold">$</span>
                          <span className="font-medium">{formatBudget(profile.budgetMin, profile.budgetMax)}</span>
                        </div>

                        {profile.bio && (
                          <p className="text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
                        )}

                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {getPreferenceText(profile.petPref, 'pet')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getPreferenceText(profile.smokePref, 'smoke')}
                          </Badge>
                          {profile.diet !== 'NINGUNA' && (
                            <Badge variant="outline" className="text-xs">
                              {getPreferenceText(profile.diet, 'diet')}
                            </Badge>
                          )}
                        </div>

                        {profile.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {profile.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {profile.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{profile.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{profile.user.rating.toFixed(1)}</span>
                            <span>({profile.user.reviewCount})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>{profile._count?.likesReceived || 0}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Link href={`/comunidad/${profile.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/comunidad/${profile.id}/editar`} className="flex-1">
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
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
