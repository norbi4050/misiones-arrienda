"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property } from '@/types/property'
import { fetchPropertyImages, parseLegacyImages } from '@/lib/property-images'

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bucketImages, setBucketImages] = useState<string[]>([])

  useEffect(() => {
    if (params.id) {
      loadProperty(params.id as string)
      loadBucketImages(params.id as string)
    }
  }, [params.id])

  const loadProperty = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/properties/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Propiedad no encontrada')
        }
        throw new Error('Error al cargar la propiedad')
      }

      const data = await response.json()
      setProperty(data.property)
      setAgent(data.agent)
    } catch (err: any) {
      console.error('Error loading property:', err)
      setError(err.message || 'Error al cargar la propiedad')
    } finally {
      setLoading(false)
    }
  }

  const loadBucketImages = async (propertyId: string) => {
    try {
      const images = await fetchPropertyImages(propertyId)
      setBucketImages(images)
    } catch (error) {
      console.error('Error loading bucket images:', error)
      setBucketImages([])
    }
  }

  const parseImages = (images: any): string[] => {
    return parseLegacyImages(images)
  }

  const parseAmenities = (amenities: any): string[] => {
    if (Array.isArray(amenities)) {
      return amenities
    }
    if (typeof amenities === 'string') {
      try {
        return JSON.parse(amenities)
      } catch {
        return [amenities]
      }
    }
    return []
  }

  const parseFeatures = (features: any): string[] => {
    if (Array.isArray(features)) {
      return features
    }
    if (typeof features === 'string') {
      try {
        return JSON.parse(features)
      } catch {
        return [features]
      }
    }
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando propiedad...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/properties')}>
            ← Volver a Propiedades
          </Button>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h2>
          <p className="text-gray-600 mb-4">La propiedad que buscas no existe o no está disponible.</p>
          <Button onClick={() => router.push('/properties')}>
            ← Volver a Propiedades
          </Button>
        </div>
      </div>
    )
  }

  const imagesToShow = bucketImages.length > 0 ? bucketImages : parseImages(property.images)
  const amenities = parseAmenities(property.amenities)
  const features = parseFeatures(property.features)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="outline"
            onClick={() => router.push('/properties')}
            className="mb-4"
          >
            ← Volver a Propiedades
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Images */}
          {imagesToShow.length > 0 ? (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {imagesToShow.slice(0, 4).map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`${property.title} - Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-apartment-1.jpg'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 text-center text-gray-500">
              No hay imágenes disponibles
            </div>
          )}

          {/* Property Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {property.title}
                </h1>
                <p className="text-gray-600 mb-2">
                  📍 {property.city}, {property.province}
                </p>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {property.propertyType}
                  </Badge>
                  {property?.listingType ? (
                    <Badge variant="secondary">
                      {property.listingType === 'SALE' ? 'Venta' : 'Alquiler'}
                    </Badge>
                  ) : null}
                  {property.featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      ⭐ Destacada
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-3xl font-bold text-blue-600">
                  ${Number(property?.price ?? 0).toLocaleString()}
                </div>
                {property?.currency ? (
                  <div className="text-sm text-gray-500">{property.currency}</div>
                ) : null}
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {property.bedrooms > 0 && (
                <div className="text-center">
                  <div className="text-2xl">🛏️</div>
                  <div className="text-sm text-gray-600">Dormitorios</div>
                  <div className="font-semibold">{property.bedrooms}</div>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="text-center">
                  <div className="text-2xl">🚿</div>
                  <div className="text-sm text-gray-600">Baños</div>
                  <div className="font-semibold">{property.bathrooms}</div>
                </div>
              )}
              {property.area > 0 && (
                <div className="text-center">
                  <div className="text-2xl">📐</div>
                  <div className="text-sm text-gray-600">Área</div>
                  <div className="font-semibold">{property.area}m²</div>
                </div>
              )}
              {property.garages > 0 && (
                <div className="text-center">
                  <div className="text-2xl">🚗</div>
                  <div className="text-sm text-gray-600">Garages</div>
                  <div className="font-semibold">{property.garages}</div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Descripción</h2>
              <p className="text-gray-700 leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Comodidades</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity, index) => (
                  <Badge key={index} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Características</h2>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <Badge key={index} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Agent */}
          {agent && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Contactar Agente</h2>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
                <p className="text-gray-600">Agente Inmobiliario</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {agent.phone && (
                  <Button
                    asChild
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <a
                      href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}?text=Hola%20me%20interesa%20la%20propiedad%20${encodeURIComponent(property.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📱 WhatsApp
                    </a>
                  </Button>
                )}
                {agent.email && (
                  <Button
                    asChild
                    variant="outline"
                  >
                    <a
                      href={`mailto:${agent.email}?subject=Consulta%20${encodeURIComponent(property.title)}`}
                    >
                      ✉️ Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
