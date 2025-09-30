"use client"

import { useState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import PropertyImageUpload from "@/components/ui/property-image-upload"
import { ConsentCheckbox } from "@/components/ui/ConsentCheckbox"
import { MapPin, Upload, DollarSign, Home, Check, Loader2, CreditCard, Shield, Clock, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"
import toast from 'react-hot-toast'
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useRouter } from "next/navigation"
import { propertyFormSchema } from "@/lib/validations/property"
import { logConsentClient, ConsentLogPayload } from "@/lib/consent/logConsent.client"
import { CURRENT_POLICY_VERSION } from "@/lib/consent/logConsent"
import { analytics } from "@/lib/analytics/track"
import MapPicker from "@/components/property/MapPicker"

export default function PublishWizardImproved() {
  console.debug('[Wizard NUEVO] montado')
  
  const { user, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [selectedPlan, setSelectedPlan] = useState<'basico' | 'destacado' | 'full'>('basico')
  
  // Estados para el flujo de borrador
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [imagesCount, setImagesCount] = useState(0)
  const [images, setImages] = useState<string[]>([]) // CONTROLLED COMPONENT: estado local para preview
  
  // Paso 2 -> gating real por imágenes
  const canContinueStep2 = imagesCount >= 1;

  // Debug handler para verificar conteo de imágenes
  const handleImageCount = (n: number) => {
    console.debug('[Wizard] imagesCount =', n);
    setImagesCount(n);
  }
  const [creatingDraft, startCreatingDraft] = useTransition()
  const [publishing, startPublishing] = useTransition()
  
  // Estado para consentimiento
  const [checkedTerms, setCheckedTerms] = useState(false)
  const [checkedPrivacy, setCheckedPrivacy] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  
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
      area: 1,
      address: "",
      city: "",
      province: "Misiones",
      country: "Argentina",
      postalCode: "",
      contact_phone: user?.phone || "",
      latitude: undefined,
      longitude: undefined,
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

  // Validación mínima del Paso 1 (incluye coordenadas obligatorias)
  const canContinueStep1 = 
    watchedValues.title?.trim().length >= 3 &&
    watchedValues.city?.trim() &&
    Number(watchedValues.price) > 0 &&
    watchedValues.latitude !== undefined &&
    watchedValues.longitude !== undefined;

  // Track start_publish cuando el usuario llega a la página
  useEffect(() => {
    if (user) {
      analytics.startPublish()
    }
  }, [user])

  // Paso 1 → crear borrador y pasar a Paso 2
  async function handleContinueFromStep1() {
    if (!canContinueStep1) {
      toast.error("Completá título, ciudad y precio para continuar");
      return;
    }

    if (propertyId) {
      setCurrentStep(2);
      return;
    }

    startCreatingDraft(async () => {
      try {
        console.debug('[Wizard] Step1 -> draft payload', watchedValues);
        const res = await fetch("/api/properties/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: watchedValues.title,
            price: watchedValues.price,
            city: watchedValues.city,
            province: watchedValues.province,
            address: watchedValues.address,
            property_type: watchedValues.propertyType,
            bedrooms: watchedValues.bedrooms,
            bathrooms: watchedValues.bathrooms,
            area: watchedValues.area,
            description: watchedValues.description,
            contact_phone: watchedValues.contact_phone,
            garages: watchedValues.garages,
            latitude: watchedValues.latitude,
            longitude: watchedValues.longitude
          }),
        });
        
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error('[Wizard] draft failed', body);
          toast.error(body?.error || "Error creando borrador");
          return;
        }
        
        const { property } = await res.json();
        console.debug('[Wizard] draft OK', property);
        setPropertyId(property.id);        // viene del draft
        setUserId(property.user_id);       // IMPORTANTE: usar el owner real
        console.debug('[Wizard] IDs seteados - propertyId:', property.id, 'ownerId:', property.user_id);
        setImagesCount(0); // resetea el contador al entrar al paso de imágenes
        setCurrentStep(2);
        toast.success("Borrador creado. Ahora agregá las imágenes.");
      } catch (e) {
        console.error('[Wizard] draft exception', e);
        toast.error("Error de red creando borrador");
      }
    });
  }

  // Validar Step 1
  function validateStep1() {
    // Tomo el objeto completo actual del form
    const values = form.getValues();
    // Valido solo los campos del paso 1
    const step1Schema = propertyFormSchema.pick({
      title: true,
      propertyType: true,
      price: true,
      bedrooms: true,
      bathrooms: true,
      garages: true,
      area: true,
      address: true,
      city: true,
      postalCode: true,
      contact_phone: true,
      description: true,
    });
    const parse = step1Schema.safeParse(values);
    if (!parse.success) {
      console.debug("[Wizard] step1 errors", parse.error.flatten().fieldErrors);
      toast.error("Revisá los campos marcados.");
    }
    return parse.success;
  }

  // Paso 3: Publicar
  function handlePublish() {
    if (!propertyId) return
    
    // Double guard: verificar imágenes antes de publicar
    if (imagesCount < 1) {
      toast.error('Necesitás subir al menos 1 imagen para publicar.');
      return;
    }

    startPublishing(async () => {
      try {
        // Validar consentimiento
        if (!checkedTerms || !checkedPrivacy) {
          setConsentError("Debes aceptar los Términos y Condiciones y la Política de Privacidad para publicar")
          return
        }

        // Loguear consentimiento (best-effort, no bloquea el flujo)
        try {
          if (user?.id && process.env.NEXT_PUBLIC_POLICY_VERSION) {
            await logConsentClient({
              policyVersion: process.env.NEXT_PUBLIC_POLICY_VERSION,
              acceptedTerms: checkedTerms,
              acceptedPrivacy: checkedPrivacy,
              userAgent: navigator.userAgent
            });
          }
        } catch (e) {
          console.warn('Consent log failed (non-blocking)', e);
        }

        const res = await fetch(`/api/properties/${propertyId}/publish`, { 
          method: "POST" 
        })
        
        if (res.ok) {
          // Track complete_publish
          analytics.completePublish(propertyId, selectedPlan)
          
          toast.success("¡Propiedad publicada exitosamente!")
          // Redirigir al detalle
          window.location.href = `/properties/${propertyId}`
          return
        }
        
        const { error } = await res.json().catch(() => ({ error: "Error publicando" }))
        // Si es 400 del validador de imágenes, el mensaje ya será "Necesitás al menos 1 imagen…"
        toast.error(error || "Error publicando propiedad")
      } catch (error) {
        console.error('Error publishing:', error)
        toast.error("Error publicando propiedad")
      }
    })
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
        "Vigencia 30 días"
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
        "Estadísticas avanzadas"
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
        "Agente asignado"
      ],
      color: "bg-yellow-50 border-yellow-300",
      badge: "Premium",
      popular: false
    }
  }

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Autenticación Requerida</h1>
            <p className="text-gray-600 mb-6">
              Necesitás una cuenta para publicar propiedades.
            </p>
            <div className="space-y-3">
              <Link href="/register">
                <Button className="w-full">Crear Cuenta Nueva</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">Iniciar Sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
              Bienvenido, <strong>{user?.name}</strong>
            </span>
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
              Publica tu propiedad en Misiones Arrienda
            </p>
          </div>

          {/* Steps Progress */}
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
                    className="w-full p-3 border border-gray-300 rounded-md bg-white"
                    {...register("propertyType")}
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
                    {...register("price", { valueAsNumber: true })}
                  />
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
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <Input
                    placeholder="Av. San Martín 1234"
                    {...register("address")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md bg-white"
                    {...register("city")}
                  >
                    <option value="">Seleccionar ciudad</option>
                    <option value="Posadas">Posadas</option>
                    <option value="Eldorado">Eldorado</option>
                    <option value="Puerto Iguazú">Puerto Iguazú</option>
                    <option value="Oberá">Oberá</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal
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
                    Teléfono de contacto
                  </label>
                  <Input
                    type="tel"
                    placeholder="Ej: +54 376 123-4567"
                    {...register("contact_phone")}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md resize-none bg-white"
                    rows={4}
                    placeholder="Describe tu propiedad..."
                    {...register("description")}
                  />
                </div>

                {/* Ubicación en el mapa */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Ubicación en el mapa *
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Arrastra el pin para marcar la ubicación exacta de tu propiedad
                  </p>
                  
                  {/* Mensaje de error si no hay coordenadas */}
                  {(!watchedValues.latitude || !watchedValues.longitude) && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                          Seleccioná una ubicación en el mapa para continuar
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <MapPicker
                    value={watchedValues.latitude && watchedValues.longitude ? {
                      lat: watchedValues.latitude,
                      lng: watchedValues.longitude
                    } : null}
                    onChange={(coords) => {
                      setValue('latitude', coords.lat);
                      setValue('longitude', coords.lng);
                    }}
                    className="h-72 rounded-lg border"
                  />
                  {watchedValues.latitude && watchedValues.longitude && (
                    <p className="text-xs text-green-600 mt-2 flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Coordenadas: {watchedValues.latitude.toFixed(4)}, {watchedValues.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  onClick={handleContinueFromStep1}
                  disabled={creatingDraft || !canContinueStep1}
                >
                  {creatingDraft ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Continuar"
                  )}
                </Button>
                {!canContinueStep1 && !creatingDraft && (
                  <p className="text-sm text-red-600 mt-2 ml-4">
                    {!watchedValues.latitude || !watchedValues.longitude 
                      ? "Seleccioná una ubicación en el mapa" 
                      : "Completá todos los campos obligatorios"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Imágenes */}
          {currentStep === 2 && propertyId && userId && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Imágenes de la Propiedad</h2>
              
              <PropertyImageUpload
                propertyId={propertyId!}
                userId={userId!}
                value={images}
                onChange={setImages}
                onChangeCount={handleImageCount}
                maxImages={selectedPlan === 'basico' ? 3 : selectedPlan === 'destacado' ? 8 : 20}
              />

              {imagesCount < 1 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
                    <p className="text-sm text-amber-800">
                      Necesitás subir al menos 1 imagen para continuar.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Anterior
                </Button>
                <Button 
                  onClick={() => {
                    if (!canContinueStep2) {
                      toast.error('Necesitás subir al menos 1 imagen para continuar.');
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  disabled={!canContinueStep2}
                >
                  Continuar
                </Button>
                {!canContinueStep2 && (
                  <p className="mt-2 text-sm text-red-600">
                    Necesitás subir al menos 1 imagen para continuar.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Selección de Plan y Publicación */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Selecciona tu Plan</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

              {/* Resumen de la propiedad */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Resumen de tu Propiedad</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Título:</strong> {watchedValues.title}</p>
                  <p><strong>Precio:</strong> ${watchedValues.price?.toLocaleString()}</p>
                  <p><strong>Ubicación:</strong> {watchedValues.city}</p>
                  <p><strong>Imágenes:</strong> {imagesCount} subidas</p>
                </div>
              </div>

              {/* Consentimiento legal */}
              <ConsentCheckbox
                checkedTerms={checkedTerms}
                checkedPrivacy={checkedPrivacy}
                onChangeTerms={setCheckedTerms}
                onChangePrivacy={setCheckedPrivacy}
                error={consentError}
                className="mb-6"
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Anterior
                </Button>
                <Button 
                  onClick={handlePublish}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={publishing || !checkedTerms || !checkedPrivacy || imagesCount < 1}
                >
                  {publishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Publicar Gratis
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
