'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, MapPin, DollarSign, Users, Star, Filter } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
}

interface Filters {
  role?: 'BUSCO' | 'OFREZCO'
  city?: string
  budgetMin?: number
  budgetMax?: number
  petPref?: string
  smokePref?: string
  diet?: string
}

export default function ComunidadPage() {
  const [profiles, setProfiles] = useState<CommunityProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProfiles()
  }, [filters])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.role) params.append('role', filters.role)
      if (filters.city) params.append('city', filters.city)
      if (filters.budgetMin) params.append('budgetMin', filters.budgetMin.toString())
      if (filters.budgetMax) params.append('budgetMax', filters.budgetMax.toString())
      if (filters.petPref) params.append('petPref', filters.petPref)
      if (filters.smokePref) params.append('smokePref', filters.smokePref)
      if (filters.diet) params.append('diet', filters.diet)
      
      params.append('highlightedFirst', 'true')

      const response = await fetch(`/api/comunidad/profiles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (profileId: string) => {
    try {
      const response = await fetch('/api/comunidad/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toId: profileId })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.matched) {
          alert('¡Es un match! 🎉')
        }
        // Actualizar el contador de likes
        fetchProfiles()
      }
    } catch (error) {
      console.error('Error liking profile:', error)
    }
  }

  const formatBudget = (min: number, max: number) => {
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num)
    }
    
    if (min === max) return formatNumber(min)
    return `${formatNumber(min)} - ${formatNumber(max)}`
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

  const filteredProfiles = profiles.filter(profile => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      profile.user.name.toLowerCase().includes(searchLower) ||
      profile.city.toLowerCase().includes(searchLower) ||
      profile.bio?.toLowerCase().includes(searchLower) ||
      profile.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  })

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
            <div className="flex gap-3">
              <Link href="/comunidad/publicar">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Crear Perfil
                </Button>
              </Link>
              <Link href="/comunidad/matches">
                <Button variant="outline">
                  <Heart className="w-4 h-4 mr-2" />
                  Matches
                </Button>
              </Link>
              <Link href="/comunidad/mensajes">
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensajes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, ciudad, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <Select value={filters.role || ''} onValueChange={(value) => setFilters({...filters, role: value as any})}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="BUSCO">Busco habitación</SelectItem>
                  <SelectItem value="OFREZCO">Ofrezco habitación</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Ciudad"
                value={filters.city || ''}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
              />

              <Input
                type="number"
                placeholder="Presupuesto mín."
                value={filters.budgetMin || ''}
                onChange={(e) => setFilters({...filters, budgetMin: e.target.value ? parseInt(e.target.value) : undefined})}
              />

              <Input
                type="number"
                placeholder="Presupuesto máx."
                value={filters.budgetMax || ''}
                onChange={(e) => setFilters({...filters, budgetMax: e.target.value ? parseInt(e.target.value) : undefined})}
              />
            </div>
          )}
        </div>

        {/* Lista de perfiles */}
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
            {filteredProfiles.map((profile) => (
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
                  {/* Fotos */}
                  {profile.photos.length > 0 && (
                    <div className="relative h-48 rounded-lg overflow-hidden">
                      <Image
                        src={profile.photos[0]}
                        alt="Foto de perfil"
                        fill
                        className="object-cover"
                      />
                      {profile.photos.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          +{profile.photos.length - 1}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Presupuesto */}
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{formatBudget(profile.budgetMin, profile.budgetMax)}</span>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
                  )}

                  {/* Preferencias */}
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

                  {/* Tags */}
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

                  {/* Habitaciones (si es OFREZCO) */}
                  {profile.role === 'OFREZCO' && profile.rooms && profile.rooms.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">Habitaciones disponibles:</p>
                      {profile.rooms.slice(0, 2).map((room) => (
                        <div key={room.id} className="text-xs text-gray-600 mb-1">
                          {room.title} - {formatBudget(room.price, room.price)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rating y likes */}
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

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/comunidad/${profile.id}`} className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Ver perfil completo
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron perfiles</h3>
            <p className="text-gray-600 mb-6">Intenta ajustar tus filtros de búsqueda</p>
            <Link href="/comunidad/publicar">
              <Button>Crear tu perfil</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
