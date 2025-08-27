"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Upload, DollarSign, Home, Check, Loader2, CreditCard, Shield, Clock, Lock } from "lucide-react"
import Link from "next/link"
import toast from 'react-hot-toast'
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useRouter } from "next/navigation"

// Componente de pantalla de autenticación requerida
function AuthRequiredScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Autenticación Requerida
          </h1>
          
          <p className="text-gray-600 mb-6">
            Necesitás una cuenta para publicar propiedades en Misiones Arrienda. 
            Creá tu cuenta o iniciá sesión para continuar.
          </p>
          
          <div className="space-y-3">
            <Link href="/register">
              <Button className="w-full">
                Crear Cuenta Nueva
              </Button>
            </Link>
            
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PublicarPage() {
  const { user, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<'basico' | 'destacado' | 'full'>('basico')
  const [isProcessing, setIsProcessing] = useState(false)
  const [propertyForm, setPropertyForm] = useState({
    title: "",
    description: "",
    price: "",
    propertyType: "HOUSE",
    bedrooms: "",
    bathrooms: "",
    garages: "",
    area: "",
    address: "",
    city: "",
    province: "Misiones",
    images: [] as string[],
    amenities: [] as string[],
    features: [] as string[]
  })

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar pantalla de autenticación requerida
  if (!user) {
    return <AuthRequiredScreen />
  }

  const plans = {
    basico: {
      name: "Plan Básico",
      price: 0,
      duration: "Gratis",
      features: [
        "Publicación básica",
        "Hasta 3 fotos",
        "Descripción estándar",
        "Contacto directo",
        "Vigencia 30 días",
        "Analytics básicos"
      ],
      color: "bg-gray-100 border-gray-300",
      badge: "",
      popular: false
    },
    destacado: {
      name: "Plan Destacado",
      price: 5000,
      duration: "por mes",
      features: [
        "Todo lo del Plan Básico",
        "Badge 'Destacado'",
        "Hasta 8 fotos",
        "Aparece primero en búsquedas",
        "Descripción extendida",
        "Estadísticas avanzadas",
        "WhatsApp integration premium",
        "Social media sharing"
      ],
      color: "bg-blue-50 border-blue-300",
      badge: "Más Popular",
      popular: true
    },
    full: {
      name: "Plan Full",
      price: 10000,
      duration: "por mes",
      features: [
        "Todo lo del Plan Destacado",
        "Fotos ilimitadas",
        "Video promocional",
        "Tour virtual 360°",
        "Promoción en redes sociales",
        "Agente asignado",
        "Reportes detallados",
        "Priority support",
        "Custom branding"
      ],
      color: "bg-yellow-50 border-yellow-300",
      badge: "Premium",
      popular: false
    }
  }

  const validateStep1 = () => {
    const required = ['title', 'price', 'bedrooms', 'bathrooms', 'area', 'address', 'city', 'description']
    const missing = required.filter(field => !propertyForm[field as keyof typeof propertyForm])
    
    if (missing.length > 0) {
      toast.error(`Por favor completa: ${missing.join(', ')}`)
      return false
    }
    
    if (Number(propertyForm.price) <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    try {
      if (selectedPlan === 'basico') {
        // Plan gratuito - crear propiedad directamente
        const response = await fetch('/api/properties', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: propertyForm.title,
            description: propertyForm.description,
            type: propertyForm.propertyType,
            price: Number(propertyForm.price),
            currency: 'ARS',
            city: propertyForm.city,
            address: propertyForm.address,
            deposit: Number(propertyForm.garages) || 0,
            mascotas: false,
            expensasIncl: false,
            servicios: [],
            bedrooms: Number(propertyForm.bedrooms),
            bathrooms: Number(propertyForm.bathrooms),
            area: Number(propertyForm.area),
            images: propertyForm.images,
            amenities: propertyForm.amenities,
            features: propertyForm.features
          })
        })

        if (response.ok) {
          toast.success('¡Propiedad publicada exitosamente!')
          router.push('/dashboard')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al crear la propiedad')
        }
      } else {
        // Plan pago - crear preferencia de MercadoPago
        const response = await fetch('/api/payments/create-preference', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`
          },
          body: JSON.stringify({
            title: `${plans[selectedPlan].name} - ${propertyForm.title}`,
            description: `Plan ${plans[selectedPlan].name} para la propiedad: ${propertyForm.title}`,
            amount: plans[selectedPlan].price,
            quantity: 1,
            propertyId: `temp-${Date.now()}`,
            userEmail: user.email,
            userName: user.name,
            metadata: {
              plan: selectedPlan,
              propertyData: JSON.stringify(propertyForm),
              userId: user.id
            }
          })
        })

        const data = await response.json()
        
        if (response.ok && data.preference) {
          // Redirigir a MercadoPago
          window.location.href = data.preference.init_point
        } else {
          throw new Error(data.error || 'Error al procesar el pago')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar la solicitud. Intenta nuevamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            ← Volver al inicio
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Bienvenido, <strong>{user.name}</strong>
            </span>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Mi Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Publicar Propiedad
            </h1>
            <p className="text-gray-600">
              Publica tu propiedad en Misiones Arrienda y encuentra inquilinos o compradores
            </p>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Información de la Propiedad */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Información de la Propiedad</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la propiedad
                  </label>
                  <Input
                    placeholder="Ej: Casa familiar en Eldorado con jardín"
                    value={propertyForm.title}
                    onChange={(e) => setPropertyForm({...propertyForm, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de propiedad
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md"
                    value={propertyForm.propertyType}
                    onChange={(e) => setPropertyForm({...propertyForm, propertyType: e.target.value})}
                  >
                    <option value="HOUSE">Casa</option>
                    <option value="APARTMENT">Departamento</option>
                    <option value="COMMERCIAL">Local Comercial</option>
                    <option value="LAND">Terreno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (ARS)
                  </label>
                  <Input
                    type="number"
                    placeholder="320000"
                    value={propertyForm.price}
                    onChange={(e) => setPropertyForm({...propertyForm, price: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dormitorios
                  </label>
                  <Input
                    type="number"
                    placeholder="3"
                    value={propertyForm.bedrooms}
                    onChange={(e) => setPropertyForm({...propertyForm, bedrooms: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baños
                  </label>
                  <Input
                    type="number"
                    placeholder="2"
                    value={propertyForm.bathrooms}
                    onChange={(e) => setPropertyForm({...propertyForm, bathrooms: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cocheras
                  </label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={propertyForm.garages}
                    onChange={(e) => setPropertyForm({...propertyForm, garages: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área (m²)
                  </label>
                  <Input
                    type="number"
                    placeholder="180"
                    value={propertyForm.area}
                    onChange={(e) => setPropertyForm({...propertyForm, area: e.target.value})}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <Input
                    placeholder="Av. San Martín 1234"
                    value={propertyForm.address}
                    onChange={(e) => setPropertyForm({...propertyForm, address: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md"
                    value={propertyForm.city}
                    onChange={(e) => setPropertyForm({...propertyForm, city: e.target.value})}
                  >
                    <option value="">Seleccionar ciudad</option>
                    <option value="Posadas">Posadas</option>
                    <option value="Eldorado">Eldorado</option>
                    <option value="Puerto Iguazú">Puerto Iguazú</option>
                    <option value="Oberá">Oberá</option>
                    <option value="Leandro N. Alem">Leandro N. Alem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia
                  </label>
                  <Input
                    value="Misiones"
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows={4}
                    placeholder="Describe tu propiedad, sus características principales y lo que la hace especial..."
                    value={propertyForm.description}
                    onChange={(e) => setPropertyForm({...propertyForm, description: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => {
                  if (validateStep1()) {
                    setCurrentStep(2)
                  }
                }}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Selección de Plan */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Selecciona tu Plan</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedPlan === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : plan.color
                    }`}
                    onClick={() => setSelectedPlan(key as any)}
                  >
                    {plan.badge && (
                      <Badge className="absolute -top-2 left-4 bg-red-500 text-white">
                        {plan.badge}
                      </Badge>
                    )}
                    
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <div className="text-2xl font-bold text-blue-600 mt-2">
                        ${plan.price.toLocaleString()}
                        {plan.price > 0 && <span className="text-sm text-gray-600"> {plan.duration}</span>}
                      </div>
                      {plan.price === 0 && <span className="text-sm text-gray-600">{plan.duration}</span>}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {selectedPlan === key && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Anterior
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmación y Pago */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Confirmación</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Resumen de la Propiedad</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Título:</strong> {propertyForm.title}</p>
                    <p><strong>Tipo:</strong> {propertyForm.propertyType}</p>
                    <p><strong>Precio:</strong> ${Number(propertyForm.price).toLocaleString()}</p>
                    <p><strong>Ubicación:</strong> {propertyForm.address}, {propertyForm.city}</p>
                    <p><strong>Características:</strong> {propertyForm.bedrooms} hab, {propertyForm.bathrooms} baños, {propertyForm.area} m²</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Plan Seleccionado</h3>
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{plans[selectedPlan].name}</span>
                      {selectedPlan !== 'basico' && (
                        <Badge className="bg-red-500 text-white">Destacado</Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-3">
                      ${plans[selectedPlan].price.toLocaleString()}
                      {plans[selectedPlan].price > 0 && (
                        <span className="text-sm text-gray-600"> {plans[selectedPlan].duration}</span>
                      )}
                    </div>
                    <ul className="space-y-1 text-sm">
                      {plans[selectedPlan].features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-3 w-3 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {selectedPlan !== 'basico' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Proceso de Pago</h4>
                  <p className="text-sm text-blue-800">
                    Serás redirigido a MercadoPago para completar el pago de forma segura. 
                    Una vez confirmado el pago, tu propiedad será publicada con el plan seleccionado.
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Anterior
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {selectedPlan === 'basico' ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      {selectedPlan === 'basico' ? 'Publicar Gratis' : `Pagar $${plans[selectedPlan].price.toLocaleString()}`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
