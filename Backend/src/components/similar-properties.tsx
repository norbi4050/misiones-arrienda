"use client"

import { useState, useEffect } from 'react'
import { PropertyCard } from '@/components/property-card'
import { Property, PropertyStatus } from '@/types/property'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Home, MapPin } from 'lucide-react'

interface SimilarPropertiesProps {
  currentProperty: Property
  maxProperties?: number
}

export function SimilarProperties({ currentProperty, maxProperties = 6 }: SimilarPropertiesProps) {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    loadSimilarProperties()
  }, [currentProperty.id])

  const loadSimilarProperties = async () => {
    try {
      setLoading(true)
      
      // Try to fetch from API first
      const response = await fetch(`/api/properties/similar/${currentProperty.id}?limit=${maxProperties}`)
      
      if (response.ok) {
        const data = await response.json()
        setSimilarProperties(data.properties || [])
      } else {
        // Fallback to mock similar properties
        const mockSimilar = generateMockSimilarProperties()
        setSimilarProperties(mockSimilar)
      }
    } catch (error) {
      console.error('Error loading similar properties:', error)
      // Fallback to mock data
      const mockSimilar = generateMockSimilarProperties()
      setSimilarProperties(mockSimilar)
    } finally {
      setLoading(false)
    }
  }

  const generateMockSimilarProperties = (): Property[] => {
    const baseProperties: Property[] = [
      {
        id: "similar-1",
        title: "Casa moderna con jardín",
        description: "Hermosa casa de 3 dormitorios con amplio jardín y parrilla.",
        price: Math.round(currentProperty.price * 0.85),
        city: currentProperty.city,
        province: currentProperty.province,
        latitude: (currentProperty.latitude || -27.3621) + 0.01,
        longitude: (currentProperty.longitude || -55.9008) + 0.01,
        images: ["/placeholder-house-2.jpg", "/placeholder-house-3.jpg"],
        featured: false,
        bedrooms: currentProperty.bedrooms,
        bathrooms: Math.max(currentProperty.bathrooms - 1, 1),
        garages: 1,
        area: Math.max(currentProperty.area - 20, 50),
        propertyType: currentProperty.propertyType,
        listingType: currentProperty.listingType,
        status: "AVAILABLE" as PropertyStatus,
        address: "Av. San Martín 456",
        postalCode: currentProperty.postalCode || "3300",
        yearBuilt: 2019,
        amenities: ["Jardín", "Parrilla", "Garage"],
        features: ["Cocina moderna", "Pisos de cerámica"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        agent: {
          id: "agent-similar-1",
          name: "Ana López",
          phone: "+54 376 111222",
          email: "ana@example.com",
          rating: 4.6
        }
      },
      {
        id: "similar-2",
        title: "Departamento luminoso céntrico",
        description: "Moderno departamento con excelente ubicación y mucha luz natural.",
        price: Math.round(currentProperty.price * 1.15),
        city: currentProperty.city,
        province: currentProperty.province,
        latitude: (currentProperty.latitude || -27.3621) - 0.01,
        longitude: (currentProperty.longitude || -55.9008) - 0.01,
        images: ["/placeholder-apartment-2.jpg", "/placeholder-apartment-3.jpg"],
        featured: true,
        bedrooms: currentProperty.bedrooms + 1,
        bathrooms: currentProperty.bathrooms,
        garages: 0,
        area: currentProperty.area + 30,
        propertyType: currentProperty.propertyType,
        listingType: currentProperty.listingType,
        status: "AVAILABLE" as PropertyStatus,
        address: "Belgrano 789",
        postalCode: currentProperty.postalCode || "3300",
        yearBuilt: 2021,
        amenities: ["Portero", "Ascensor", "Balcón"],
        features: ["Cocina integrada", "Pisos flotantes", "Aire acondicionado"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        agent: {
          id: "agent-similar-2",
          name: "Carlos Mendez",
          phone: "+54 376 333444",
          email: "carlos@example.com",
          rating: 4.8
        }
      },
      {
        id: "similar-3",
        title: "Casa familiar con piscina",
        description: "Amplia casa familiar con piscina y quincho, ideal para familias grandes.",
        price: Math.round(currentProperty.price * 1.3),
        city: currentProperty.city,
        province: currentProperty.province,
        latitude: (currentProperty.latitude || -27.3621) + 0.02,
        longitude: (currentProperty.longitude || -55.9008) - 0.01,
        images: ["/placeholder-house-4.jpg", "/placeholder-house-5.jpg"],
        featured: false,
        bedrooms: currentProperty.bedrooms + 1,
        bathrooms: currentProperty.bathrooms + 1,
        garages: 2,
        area: currentProperty.area + 50,
        propertyType: "HOUSE",
        listingType: currentProperty.listingType,
        status: "AVAILABLE" as PropertyStatus,
        address: "Los Aromos 321",
        postalCode: currentProperty.postalCode || "3300",
        yearBuilt: 2018,
        amenities: ["Piscina", "Quincho", "Jardín", "Garage doble"],
        features: ["Cocina moderna", "Pisos de porcelanato", "Aire acondicionado"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        agent: {
          id: "agent-similar-3",
          name: "María Fernández",
          phone: "+54 376 555666",
          email: "maria@example.com",
          rating: 4.7
        }
      }
    ]

    // Filter out properties that are too different and limit results
    return baseProperties
      .filter(prop => 
        prop.city === currentProperty.city &&
        prop.propertyType === currentProperty.propertyType &&
        prop.id !== currentProperty.id
      )
      .slice(0, maxProperties)
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + 3 >= similarProperties.length ? 0 : prev + 3
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, similarProperties.length - 3) : prev - 3
    )
  }

  const visibleProperties = similarProperties.slice(currentIndex, currentIndex + 3)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Home className="w-6 h-6 mr-2 text-blue-500" />
          Propiedades Similares
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (similarProperties.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Home className="w-6 h-6 mr-2 text-blue-500" />
          Propiedades Similares
        </h2>
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay propiedades similares disponibles
          </h3>
          <p className="text-gray-600 mb-4">
            No encontramos propiedades similares en {currentProperty.city} en este momento.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/properties'}>
            Ver todas las propiedades
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Home className="w-6 h-6 mr-2 text-blue-500" />
          Propiedades Similares
        </h2>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {currentIndex + 1}-{Math.min(currentIndex + 3, similarProperties.length)} de {similarProperties.length}
          </span>
          
          {similarProperties.length > 3 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                disabled={currentIndex + 3 >= similarProperties.length}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleProperties.map((property) => (
          <div key={property.id} className="group">
            <PropertyCard
              id={property.id}
              title={property.title}
              price={property.price}
              type={property.propertyType}
              location={`${property.city}, ${property.province}`}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              area={property.area}
              image={property.images[0] || "/placeholder-apartment-1.jpg"}
              featured={property.featured}
            />
          </div>
        ))}
      </div>

      {similarProperties.length > 3 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            {Array.from({ length: Math.ceil(similarProperties.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * 3)}
                className={`w-2 h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / 3) === index
                    ? 'bg-blue-500 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = `/properties?city=${currentProperty.city}&type=${currentProperty.propertyType.toLowerCase()}`}
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          Ver más propiedades en {currentProperty.city}
        </Button>
      </div>
    </div>
  )
}
