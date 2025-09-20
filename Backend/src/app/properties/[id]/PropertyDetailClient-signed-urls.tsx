'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property } from '@/types/property'
import ImageCarousel from '@/components/ImageCarousel'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import toast from 'react-hot-toast'
import { MessageCircle, RefreshCw, AlertTriangle, Heart } from 'lucide-react'
import { SendMessageButton } from '@/components/send-message-button'

interface SignedImage {
  url: string
  expiresAt: string
  key: string
}

interface PropertyWithSignedUrls extends Property {
  imagesSigned?: SignedImage[]
  signedUrlsGenerated?: number
  signedUrlsErrors?: number
  imagesCount?: number
  contactName?: string
  contactPhone?: string
  contactEmail?: string
}


export default function PropertyDetailClient({ initialProperty }: { initialProperty: PropertyWithSignedUrls }) {
  const router = useRouter()
  const [property, setProperty] = useState<PropertyWithSignedUrls | null>(initialProperty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<boolean>(false)
  const [debugMode, setDebugMode] = useState(false)

  // Helper function to map property types to human-readable labels
  const getPropertyTypeLabel = (propertyType: string): string => {
    const typeMap: { [key: string]: string } = {
      'HOUSE': 'Casa',
      'APARTMENT': 'Departamento',
      'DUPLEX': 'Dúplex',
      'PENTHOUSE': 'Penthouse',
      'STUDIO': 'Monoambiente',
      'LOFT': 'Loft',
      'TOWNHOUSE': 'Casa en Condominio',
      'VILLA': 'Villa',
      'COMMERCIAL': 'Comercial',
      'OFFICE': 'Oficina',
      'WAREHOUSE': 'Depósito',
      'LAND': 'Terreno',
      'FARM': 'Campo',
      'OTHER': 'Otro'
    }
    return typeMap[propertyType] || propertyType
  }

  // Función para recargar la propiedad (regenera signed URLs)
  const reloadProperty = async () => {
    if (!property?.id) return

    setLoading(true)
    setError(null)
    setImageError(false)

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        cache: 'no-store' // Forzar regeneración de signed URLs
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const updatedProperty = await response.json()
      setProperty(updatedProperty)
      toast.success('Imágenes actualizadas')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast.error('Error al recargar la propiedad')
    } finally {
      setLoading(false)
    }
  }

  // Detectar si las signed URLs han expirado
  const checkSignedUrlsExpiry = () => {
    if (!property?.imagesSigned || property.imagesSigned.length === 0) return false

    const now = new Date()
    const hasExpired = property.imagesSigned.some(img => {
      const expiryDate = new Date(img.expiresAt)
      return expiryDate <= now
    })

    return hasExpired
  }

  // Manejar error de imagen (signed URL expirada)
  const handleImageError = () => {
    setImageError(true)
    toast.error('Las imágenes han expirado. Haz clic en "Actualizar Imágenes" para recargarlas.')
  }

  useEffect(() => {
    if (initialProperty) {
      setProperty(initialProperty)
    }
  }, [initialProperty])

  // Determinar qué imágenes mostrar
  const imagesToShow = property?.imagesSigned?.map(img => img.url) || []
  const hasExpiredUrls = checkSignedUrlsExpiry()

  const parseAmenities = (amenities: any): string[] => {
    if (Array.isArray(amenities)) return amenities
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
    if (Array.isArray(features)) return features
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
          <div className="flex gap-3 justify-center">
            <Button onClick={reloadProperty} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => router.push('/properties')}>
              ← Volver a Propiedades
            </Button>
          </div>
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

  const amenities = parseAmenities(property.amenities)
  const features = parseFeatures(property.features)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/properties')}
            >
              ← Volver a Propiedades
            </Button>
            <div className="flex gap-2">
              {/* Botón para actualizar imágenes si expiraron */}
              {(imageError || hasExpiredUrls) && (
                <Button
                  onClick={reloadProperty}
                  disabled={loading}
                  variant="outline"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar Imágenes
                </Button>
              )}
              <Button
                variant={debugMode ? "destructive" : "secondary"}
                onClick={() => setDebugMode(!debugMode)}
                size="sm"
              >
                {debugMode ? "🔧 Desactivar Debug" : "🔧 Activar Debug"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Alerta de URLs expiradas */}
          {hasExpiredUrls && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-orange-800 font-medium">Las imágenes pueden haber expirado</p>
                <p className="text-orange-700 text-sm">Haz clic en "Actualizar Imágenes" para recargarlas.</p>
              </div>
            </div>
          )}

          {/* Debug Panel */}
          {debugMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🔒 Debug - Signed URLs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Property Data:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li><strong>ID:</strong> {property.id}</li>
                    <li><strong>Title:</strong> {property.title}</li>
                    <li><strong>Type:</strong> {property.propertyType}</li>
                    <li><strong>Images Count:</strong> {property.imagesCount || 0}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Signed URLs Info:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li><strong>Generated:</strong> {property.signedUrlsGenerated || 0}</li>
                    <li><strong>Errors:</strong> {property.signedUrlsErrors || 0}</li>
                    <li><strong>Available:</strong> {imagesToShow.length}</li>
                    <li><strong>Expired:</strong> {hasExpiredUrls ? 'Sí' : 'No'}</li>
                  </ul>
                </div>
              </div>
              {property.imagesSigned && property.imagesSigned.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Signed URLs:</h4>
                  <div className="bg-white p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                    {property.imagesSigned.map((img, idx) => (
                      <div key={idx} className="mb-1">
                        <div className="text-green-600">Key: {img.key}</div>
                        <div className="text-blue-600 truncate">URL: {img.url}</div>
                        <div className="text-gray-500">Expira: {new Date(img.expiresAt).toLocaleString()}</div>
                        <hr className="my-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images Gallery */}
          {imagesToShow.length > 0 ? (
            <div className="mb-8">
              <ImageCarousel 
                images={imagesToShow} 
                altBase={property.title}
              />
              {/* Nota: Si las imágenes fallan por URLs expiradas, usar el botón "Actualizar Imágenes" */}
            </div>
          ) : (
            <div className="mb-8 text-center text-gray-500 bg-white rounded-lg p-8">
              <div className="text-6xl mb-4">🖼️</div>
              <p>No hay imágenes disponibles para esta propiedad</p>
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
                    {getPropertyTypeLabel(property.propertyType)}
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

            {/* Botón prominente Send Message - Estilo Airbnb */}
            <div className="mb-6">
              <SendMessageButton
                propertyId={property.id}
                propertyTitle={property.title}
                ownerId={property.userId || ''}
                ownerName={property.contactName}
                size="lg"
                className="w-full md:w-auto px-8 py-3 text-lg font-semibold"
              />
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
              <p className="leading-relaxed">
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

          {/* Contact Information */}
          {(property.contactName || property.contactPhone || property.contactEmail) && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Información de Contacto</h2>
              <div className="space-y-3">
                {property.contactName && (
                  <div>
                    <span className="font-medium text-gray-700">Nombre:</span>
                    <span className="ml-2 text-gray-900">{property.contactName}</span>
                  </div>
                )}
                {property.contactPhone && (
                  <div>
                    <span className="font-medium text-gray-700">Teléfono:</span>
                    <a 
                      href={`tel:${property.contactPhone}`}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      {property.contactPhone}
                    </a>
                  </div>
                )}
                {property.contactEmail && (
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <a 
                      href={`mailto:${property.contactEmail}`}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      {property.contactEmail}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <SendMessageButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                  ownerId={property.userId || ''}
                  ownerName={property.contactName}
                  size="lg"
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
