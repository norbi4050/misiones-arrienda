"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "@/components/ui/image-upload"
import { MapPin, Upload, DollarSign, Home, Loader2, Shield, Clock, Lock } from "lucide-react"
import Link from "next/link"
import toast from 'react-hot-toast'
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useRouter } from "next/navigation"
import { propertyFormSchema } from "@/lib/validations/property"

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

  const form = useForm({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      currency: "ARS",
      propertyType: "HOUSE",
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      address: "",
      city: "",
      province: "Misiones",
      country: "Argentina",
      postalCode: "",
      contact_phone: "",
      images: [],
      amenities: [],
      features: [],
      mascotas: false,
      expensasIncl: false,
      servicios: [],
      status: "AVAILABLE",
      featured: false,
      garages: 0
    }
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = form
  const watchedValues = watch()

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
    const result = propertyFormSchema.safeParse(watchedValues)
    if (!result.success) {
      const firstError = result.error.errors[0]
      toast.error(firstError.message)
      return false
    }
    return true
  }

  const onSubmit = async (data: any) => {
    setIsProcessing(true)

    try {
      if (selectedPlan === 'basico') {
        // PASO A: Crear DRAFT con payload mínimo (solo campos esenciales)
        const minimalPayload: any = {
          // Campos mínimos requeridos
          title: String(data.title || '').trim(),
          city: String(data.city || '').trim(),
          province: 'Misiones',
          price: Number(data.price) || 0
        }
        
        // Campos opcionales (solo si tienen valor válido)
        if (data.propertyType && String(data.propertyType).trim()) {
          minimalPayload.property_type = String(data.propertyType).trim()
        }
        
        if (data.bedrooms && !isNaN(Number(data.bedrooms)) && Number(data.bedrooms) > 0) {
          minimalPayload.bedrooms = Number(data.bedrooms)
        }
        
        if (data.bathrooms && !isNaN(Number(data.bathrooms)) && Number(data.bathrooms) > 0) {
          minimalPayload.bathrooms = Number(data.bathrooms)
        }
        
        if (data.area && !isNaN(Number(data.area)) && Number(data.area) > 0) {
          minimalPayload.area = Number(data.area)
        }
        
        console.log('📤 PAYLOAD MÍNIMO PARA DRAFT:', minimalPayload)
        console.log('📊 Campos enviados:', Object.keys(minimalPayload).length)
        
        // PASO A: Crear DRAFT con datos mínimos
        const response = await fetch('/api/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(minimalPayload)
        })

        if (response.ok) {
          toast.success('¡Propiedad publicada exitosamente!')
          reset()
          router.push('/properties')
        } else {
          // Verificar si la respuesta contiene JSON válido
          let errorMessage = 'Error al crear la propiedad'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (jsonError) {
            // Si no se puede parsear como JSON, usar mensaje genérico
            console.warn('Response is not valid JSON:', jsonError)
            errorMessage = `Error ${response.status}: ${response.statusText || 'Error del servidor'}`
          }
          throw new Error(errorMessage)
        }
      } else {
        // Plan pago - crear preferencia de MercadoPago
        const response = await fetch('/api/payments/create-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.id}`
          },
          body: JSON.stringify({
            title: `${plans[selectedPlan].name} - ${data.title}`,
            description: `Plan ${plans[selectedPlan].name} para la propiedad: ${data.title}`,
            amount: plans[selectedPlan].price,
            quantity: 1,
            propertyId: `temp-${Date.now()}`,
            userEmail: user?.email,
            userName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario',
            metadata: {
              plan: selectedPlan,
              propertyData: JSON.stringify(data),
              userId: user?.id
            }
          })
        })

        const responseData = await response.json()

        if (response.ok && responseData.preference) {
          // Redirigir a MercadoPago
          window.location.href = responseData.preference.init_point
        } else {
          throw new Error(responseData.error || 'Error al procesar el pago')
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
              Bienvenido, <strong>{user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario'}</strong>
            </span>
            <Link href="/properties">
              <Button variant="outline" size="sm">
                Ver Propiedades
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
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de propiedad
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md"
                    {...register("propertyType")}
                  >
                    <option value="HOUSE">Casa</option>
                    <option value="APARTMENT">Departamento</option>
                    <option value="COMMERCIAL">Local Comercial</option>
                    <option value="LAND">Terreno</option>
                  </select>
                  {errors.propertyType && (
                    <p className="text-sm text-red-600 mt-1">{errors.propertyType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (ARS)
                  </label>
                  <Input
                    type="number"
                    placeholder="320000"
                    {...register("price", { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dormitorios
                  </label>
                  <Input
                    type="number"
                    placeholder="3"
                    {...register("bedrooms", { valueAsNumber: true })}
                  />
                  {errors.bedrooms && (
                    <p className="text-sm text-red-600 mt-1">{errors.bedrooms.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baños
                  </label>
                  <Input
                    type="number"
                    placeholder="2"
                    {...register("bathrooms", { valueAsNumber: true })}
                  />
                  {errors.bathrooms && (
                    <p className="text-sm text-red-600 mt-1">{errors.bathrooms.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cocheras
                  </label>
                  <Input
                    type="number"
                    placeholder="1"
                    {...register("garages", { valueAsNumber: true })}
                  />
                  {errors.garages && (
                    <p className="text-sm text-red-600 mt-1">{errors.garages.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área (m²)
                  </label>
                  <Input
                    type="number"
                    placeholder="180"
                    {...register("area", { valueAsNumber: true })}
                  />
                  {errors.area && (
                    <p className="text-sm text-red-600 mt-1">{errors.area.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <Input
                    placeholder="Av. San Martín 1234"
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md"
                    {...register("city")}
                  >
                    <option value="">Seleccionar ciudad</option>
                    <option value="Posadas">Posadas</option>
                    <option value="Eldorado">Eldorado</option>
                    <option value="Puerto Iguazú">Puerto Iguazú</option>
                    <option value="Oberá">Oberá</option>
                    <option value="Leandro N. Alem">Leandro N. Alem</option>
                  </select>
                  {errors.city && (
                    <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                  )}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal *
                  </label>
                  <Input
                    placeholder="Ej: 3300"
                    {...register("postalCode")}
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.postalCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono de contacto *
                  </label>
                  <Input
                    type="tel"
                    placeholder="Ej: +54 376 123-4567"
                    {...register("contact_phone")}
                  />
                  {errors.contact_phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.contact_phone.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows={4}
                    placeholder="Describe tu propiedad, sus características principales y lo que la hace especial..."
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes de la propiedad
                  </label>
                  <ImageUpload
                    value={watchedValues.images || []}
                    onChange={(images) => setValue("images", images)}
                    maxImages={selectedPlan === 'basico' ? 3 : selectedPlan === 'destacado' ? 8 : 20}
                    maxSizeMB={5}
                    uploadText="Subir fotos de la propiedad"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedPlan === 'basico' && 'Plan Básico: Hasta 3 fotos'}
                    {selectedPlan === 'destacado' && 'Plan Destacado: Hasta 8 fotos'}
                    {selectedPlan === 'full' && 'Plan Full: Fotos ilimitadas'}
                  </p>
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
                          <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {selectedPlan === key && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="inline-block w-4 h-4 bg-white rounded-full"></span>
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
                    <p><strong>Título:</strong> {watchedValues.title}</p>
                    <p><strong>Tipo:</strong> {watchedValues.propertyType}</p>
                    <p><strong>Precio:</strong> ${watchedValues.price?.toLocaleString()}</p>
                    <p><strong>Ubicación:</strong> {watchedValues.address}, {watchedValues.city}</p>
                    <p><strong>Características:</strong> {watchedValues.bedrooms} hab, {watchedValues.bathrooms} baños, {watchedValues.area} m²</p>
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
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
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
                  onClick={handleSubmit(onSubmit)}
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
                        <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                      ) : (
                        <span className="inline-block w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
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
