"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Bed, Bath, Square, Car, Heart, Phone, Mail, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Property {
  id: string
  title: string
  description: string
  price: number
  oldPrice?: number
  bedrooms: number
  bathrooms: number
  garages: number
  area: number
  lotArea?: number
  address: string
  city: string
  province: string
  propertyType: string
  status: string
  images: string[]
  amenities: string[]
  features: string[]
  yearBuilt?: number
  floor?: number
  totalFloors?: number
  featured: boolean
  agent: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
    rating: number
  }
}

export default function PropertyDetailPage() {
  const params = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    type: "GENERAL"
  })

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProperty(data.property)
        }
      } catch (error) {
        console.error("Error fetching property:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProperty()
    }
  }, [params.id])

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...inquiryForm,
          propertyId: params.id,
        }),
      })
      
      if (response.ok) {
        alert("Consulta enviada exitosamente!")
        setInquiryForm({
          name: "",
          email: "",
          phone: "",
          message: "",
          type: "GENERAL"
        })
      }
    } catch (error) {
      console.error("Error sending inquiry:", error)
      alert("Error al enviar la consulta")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando propiedad...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Propiedad no encontrada</h1>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            ← Volver a propiedades
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="aspect-[16/10] relative">
                <Image
                  src={property.images[currentImageIndex] || "/placeholder-house-1.jpg"}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
                {property.featured && (
                  <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                    Destacado
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm hover:bg-white"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
              
              {property.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                        currentImageIndex === index ? "border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${property.title} ${index + 1}`}
                        width={80}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary">{property.propertyType}</Badge>
                <div className="text-right">
                  {property.oldPrice && (
                    <div className="text-sm text-gray-500 line-through">
                      ${property.oldPrice.toLocaleString()}
                    </div>
                  )}
                  <div className="text-3xl font-bold text-blue-600">
                    ${property.price.toLocaleString()}
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                {property.address}, {property.city}, {property.province}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-gray-400" />
                  <span>{property.bedrooms} hab</span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-2 text-gray-400" />
                  <span>{property.bathrooms} baños</span>
                </div>
                <div className="flex items-center">
                  <Square className="h-5 w-5 mr-2 text-gray-400" />
                  <span>{property.area} m²</span>
                </div>
                {property.garages > 0 && (
                  <div className="flex items-center">
                    <Car className="h-5 w-5 mr-2 text-gray-400" />
                    <span>{property.garages} cocheras</span>
                  </div>
                )}
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-gray-700">{property.description}</p>
              </div>
            </div>

            {/* Features & Amenities */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {property.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Características</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {property.amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Amenidades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Agent Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Agente Inmobiliario</h3>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">
                    {property.agent.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{property.agent.name}</div>
                  <div className="text-sm text-gray-600">
                    ⭐ {property.agent.rating}/5
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {property.agent.phone}
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {property.agent.email}
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Consultar sobre esta propiedad</h3>
              
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <Input
                  placeholder="Tu nombre"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                  required
                />
                <Input
                  type="email"
                  placeholder="Tu email"
                  value={inquiryForm.email}
                  onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                  required
                />
                <Input
                  type="tel"
                  placeholder="Tu teléfono"
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                  required
                />
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={4}
                  placeholder="Tu mensaje..."
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                  required
                />
                
                <Button type="submit" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Enviar Consulta
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
