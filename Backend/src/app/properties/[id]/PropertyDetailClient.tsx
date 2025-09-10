'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Property } from '@/types/property'
import { fetchBucketImages } from '@/lib/propertyImages/fetchBucketImages'
import { parseImagesText, resolveImages } from '@/lib/propertyImages'
import ImageCarousel from '@/components/ImageCarousel'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import toast from 'react-hot-toast'
import { MessageCircle } from 'lucide-react'

function ContactButton({ userId, propertyId }: { userId: string; propertyId: string }) {
  const { user } = useSupabaseAuth()
  const router = useRouter()

  const handleContact = () => {
    if (!user) {
      toast.error('Iniciá sesión para enviar un mensaje')
      return
    }
    router.push(`/messages/new?to=${userId}&propertyId=${propertyId}`)
  }

  return (
    <Button onClick={handleContact} className="bg-blue-600 hover:bg-blue-700 text-white">
      <span className="flex items-center gap-2">
        <MessageCircle size={16} />
        Contactar
      </span>
    </Button>
  )
}

export default function PropertyDetailClient({ initialProperty }: { initialProperty: any }) {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(initialProperty)
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bucketImages, setBucketImages] = useState<string[]>([])
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

  useEffect(() => {
    if (initialProperty) {
      setProperty(initialProperty)
      loadBucketImages(initialProperty.id)
    }
  }, [initialProperty])

  const loadBucketImages = async (propertyId: string) => {
    try {
      // Assuming userId is available in property.userId
      const userId = property?.userId || ''
      const images = await fetchBucketImages(userId, propertyId)
      setBucketImages(images)
    } catch (error) {
      console.error('Error loading bucket images:', error)
      setBucketImages([])
    }
  }

  const parseImages = (images: any): string[] => {
    return parseImagesText(images)
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

  // Lógica de priorización según especificaciones:
  // Priorizar bucketImages sobre apiImages, combinando sin duplicados
  const apiImages = parseImages(property.images)
  const imagesToShow = resolveImages({ apiImages, bucketImages })

  // DEBUG LOGS - TEMPORALES PARA TESTING
  console.log('=== DEBUG PROPERTY IMAGES ===')
  console.log('Property ID:', property.id)
  console.log('Property User ID:', property.userId)
  console.log('API Images length:', apiImages.length)
  console.log('Bucket Images length:', bucketImages.length)
  console.log('Images to show length:', imagesToShow.length)
  console.log('API Images:', apiImages)
  console.log('Bucket Images:', bucketImages)
  console.log('Final Images to show:', imagesToShow)
  console.log('=== END DEBUG ===')
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Debug Panel */}
          {debugMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔍 Debug Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Property Data:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li><strong>ID:</strong> {property.id}</li>
                    <li><strong>User ID:</strong> {property.userId || 'N/A'}</li>
                    <li><strong>Title:</strong> {property.title}</li>
                    <li><strong>Type:</strong> {property.propertyType}</li>
                    <li><strong>Listing:</strong> {property.listingType || 'N/A'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Image Sources:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li><strong>API Images:</strong> {apiImages.length}</li>
                    <li><strong>Bucket Images:</strong> {bucketImages.length}</li>
                    <li><strong>Total Images:</strong> {imagesToShow.length}</li>
                    <li><strong>Source Priority:</strong> {bucketImages.length > 0 ? 'Bucket → API' : 'API only'}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">API Images URLs:</h4>
                <div className="bg-white p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {apiImages.length > 0 ? (
                    apiImages.map((url, idx) => (
                      <div key={idx} className="truncate">{url}</div>
                    ))
                  ) : (
                    <span className="text-gray-500">No API images</span>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Bucket Images URLs:</h4>
                <div className="bg-white p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {bucketImages.length > 0 ? (
                    bucketImages.map((url, idx) => (
                      <div key={idx} className="truncate">{url}</div>
                    ))
                  ) : (
                    <span className="text-gray-500">No bucket images</span>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Final Images to Show:</h4>
                <div className="bg-white p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {imagesToShow.length > 0 ? (
                    imagesToShow.map((url, idx) => (
                      <div key={idx} className="truncate">{url}</div>
                    ))
                  ) : (
                    <span className="text-gray-500">No images to show</span>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Images */}
          {imagesToShow.length > 0 ? (
            <div className="mb-8">
              <ImageCarousel images={imagesToShow} altBase={property.title} />
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
            <div className={`bg-white rounded-lg shadow-sm p-6 mb-6 ${property.description.length < 100 ? 'leading-relaxed' : ''}`}>
              <h2 className="text-xl font-semibold mb-4">Descripción</h2>
              <p className={`${property.description.length < 100 ? 'leading-relaxed' : ''}`}>
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
                {agent.email && (
                  <Button
                    asChild
                    variant="outline"
                  >
                    <a
                      href={`mailto:${agent.email}?subject=Consulta%20${encodeURIComponent(property.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ✉️ Email
                    </a>
                  </Button>
                )}
                <ContactButton userId={property.userId} propertyId={property.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
