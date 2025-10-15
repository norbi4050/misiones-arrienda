"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Bed, Bath, Square, Car, Heart, Phone, Mail, Calendar, Share2, Eye, Clock, CheckCircle, Star, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { WhatsAppPropertyButton } from "@/components/whatsapp-button"
import { SimilarProperties } from "@/components/similar-properties"
import toast from 'react-hot-toast'
import { Property } from '@/types/property'

interface PropertyDetailClientProps {
  property: Property
}

export function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [viewCount] = useState(Math.floor(Math.random() * 50) + 10)
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    type: "GENERAL"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...inquiryForm,
          propertyId: property.id,
        }),
      })
      
      if (response.ok) {
        toast.success('¡Consulta enviada exitosamente! Te contactaremos pronto.')
        setInquiryForm({
          name: "",
          email: "",
          phone: "",
          message: "",
          type: "GENERAL"
        })
      } else {
        toast.error('Error al enviar la consulta. Intenta nuevamente.')
      }
    } catch (error) {
      console.error("Error sending inquiry:", error)
      toast.error('Error de conexión. Verifica tu internet.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Mira esta propiedad: ${property.title}`,
          url: window.location.href,
        })
        toast.success('¡Enlace compartido!')
      } catch (error) {
        navigator.clipboard.writeText(window.location.href)
        toast.success('¡Enlace copiado al portapapeles!')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('¡Enlace copiado al portapapeles!')
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removido de favoritos' : '¡Agregado a favoritos!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mejorado */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:text-blue-500 flex items-center">
              ← Volver a propiedades
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{viewCount} vistas</span>
              <Clock className="w-4 h-4 ml-4" />
              <span>Actualizado hoy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery mejorada */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="aspect-[16/10] relative group">
                <Image
                  src={property.images[currentImageIndex] || "/placeholder-apartment-1.jpg"}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Badges y botones superpuestos */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {property.featured && (
                    <Badge className="bg-red-500 text-white shadow-lg">
                      ⭐ Destacado
                    </Badge>
                  )}
                  <Badge className="bg-blue-500 text-white shadow-lg">
                    {property.listingType === 'SALE' ? 'En Venta' : 'En Alquiler'}
                  </Badge>
                </div>

                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Navegación de imágenes */}
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? property.images.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === property.images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all"
                    >
                      →
                    </button>
                  </>
                )}

                {/* Indicador de imagen actual */}
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                    {currentImageIndex + 1} / {property.images.length}
                  </div>
                )}
              </div>
              
              {/* Thumbnails mejorados */}
              {property.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index 
                          ? "border-blue-500 shadow-md" 
                          : "border-gray-200 hover:border-gray-300"
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

            {/* Property Info mejorada */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary" className="text-sm">
                      {property.propertyType}
                    </Badge>
                    {property.yearBuilt && (
                      <span className="text-sm text-gray-500">
                        Construido en {property.yearBuilt}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{property.title}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="text-lg">{property.address}, {property.city}, {property.province}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  {property.oldPrice && (
                    <div className="text-lg text-gray-500 line-through mb-1">
                      ${property.oldPrice.toLocaleString()}
                    </div>
                  )}
                  <div className="text-4xl font-bold text-blue-600">
                    ${property.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {property.listingType === 'SALE' ? 'Precio de venta' : 'Por mes'}
                  </div>
                </div>
              </div>

              {/* Características principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Bed className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                  <div className="text-sm text-gray-600">Habitaciones</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Bath className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                  <div className="text-sm text-gray-600">Baños</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Square className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{property.area}</div>
                  <div className="text-sm text-gray-600">m² cubiertos</div>
                </div>
                {property.garages > 0 && (
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Car className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{property.garages}</div>
                    <div className="text-sm text-gray-600">Cocheras</div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Descripción
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
              </div>
            </div>

            {/* Features & Amenities mejoradas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {property.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Características Principales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {property.amenities.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Amenidades y Servicios
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar mejorado */}
          <div className="lg:col-span-1">
            {/* WhatsApp CTA prominente */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 mb-6 text-white">
              <div className="text-center mb-4">
                <MessageCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-xl font-bold">¡Contacto Inmediato!</h3>
                <p className="text-green-100">Respuesta garantizada en menos de 2 horas</p>
              </div>
              <WhatsAppPropertyButton 
                propertyId={property.id}
                address={`${property.address}, ${property.city}`}
                price={property.price.toLocaleString()}
                agentPhone={property.agent?.phone || ''}
                agentName={property.agent?.name || 'Agente no disponible'}
                propertyTitle={property.title}
              />
            </div>

            {/* Agent Info mejorada */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Agente Inmobiliario</h3>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-xl">
                    {property.agent?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-lg">{property.agent?.name || 'Agente no disponible'}</div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    {property.agent?.rating || 0}/5 • Agente Verificado
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm bg-gray-50 p-3 rounded-lg">
                  <Phone className="h-4 w-4 mr-3 text-blue-500" />
                  <span className="font-medium">{property.agent?.phone || 'No disponible'}</span>
                </div>
                <div className="flex items-center text-sm bg-gray-50 p-3 rounded-lg">
                  <Mail className="h-4 w-4 mr-3 text-blue-500" />
                  <span className="font-medium">{property.agent?.email || 'No disponible'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar Ahora
                </Button>
                <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </div>
            </div>

            {/* Contact Form mejorado */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Consultar sobre esta propiedad</h3>
              
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <Input
                  placeholder="Tu nombre completo"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
                <Input
                  type="email"
                  placeholder="Tu email"
                  value={inquiryForm.email}
                  onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
                <Input
                  type="tel"
                  placeholder="Tu teléfono (con código de área)"
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={4}
                  placeholder="Cuéntanos qué te interesa de esta propiedad..."
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                  required
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Enviar Consulta
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 text-center">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Respuesta garantizada en menos de 2 horas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties Section */}
        <div className="mt-12">
          <SimilarProperties currentProperty={property} />
        </div>
      </div>
    </div>
  )
}
