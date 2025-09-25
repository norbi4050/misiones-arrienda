"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ConsentCheckbox } from "@/components/ui/ConsentCheckbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Home, MapPin, DollarSign, Calendar, Heart, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from 'react-hot-toast'
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { logConsentClient } from "@/lib/consent/logConsent.client"
import { CURRENT_POLICY_VERSION } from "@/lib/consent/logConsent"

export default function NuevoRoommatePage() {
  const { user, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Estado para consentimiento
  const [checkedTerms, setCheckedTerms] = useState(false)
  const [checkedPrivacy, setCheckedPrivacy] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: "",
      age: 0,
      gender: "",
      occupation: "",
      bio: "",
      city: "",
      neighborhood: "",
      budgetMin: 0,
      budgetMax: 0,
      preferredGender: "INDIFERENTE",
      petFriendly: false,
      smoker: false,
      lifestyle: "TRANQUILO",
      interests: [] as string[],
      contactPhone: "",
      contactEmail: "",
      availableFrom: "",
      images: []
    }
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form
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

  // Si no está autenticado, redirigir al login
  if (!user) {
    router.push('/login?redirect=/roommates/nuevo')
    return null
  }

  const onSubmit = async (data: any) => {
    setConsentError(null)
    
    // Validar consentimiento
    if (!checkedTerms || !checkedPrivacy) {
      setConsentError("Debes aceptar los Términos y Condiciones y la Política de Privacidad para crear un perfil de roommate")
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Loguear consentimiento antes de proceder
      if (user?.id) {
        try {
          await logConsentClient({
            policyVersion: CURRENT_POLICY_VERSION,
            acceptedTerms: checkedTerms,
            acceptedPrivacy: checkedPrivacy,
            userAgent: navigator.userAgent
          })
        } catch (consentLogError) {
          console.error('Error logging consent:', consentLogError)
          // Continuar aunque falle el logging
        }
      }

      const response = await fetch('/api/roommates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          user_id: user?.id,
          contact_name: user?.name,
          contact_email: user?.email || data.contactEmail
        })
      })

      if (response.ok) {
        const roommate = await response.json()
        toast.success('¡Perfil de roommate creado exitosamente!')
        router.push(`/roommates/${roommate.id}`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el perfil de roommate')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar la solicitud. Intenta nuevamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const cities = ['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles', 'Leandro N. Alem']
  const interests = ['Deportes', 'Música', 'Lectura', 'Cocinar', 'Viajar', 'Tecnología', 'Arte', 'Naturaleza']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/roommates" className="text-blue-600 hover:text-blue-500 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Roommates
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
              Crear Perfil de Roommate
            </h1>
            <p className="text-gray-600">
              Completa tu perfil para encontrar el compañero de casa ideal
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input
                      id="name"
                      placeholder="Tu nombre completo"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="age">Edad *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="100"
                      placeholder="25"
                      {...register("age", { valueAsNumber: true })}
                    />
                    {errors.age && (
                      <p className="text-sm text-red-600 mt-1">{errors.age.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender">Género *</Label>
                    <Select onValueChange={(value) => setValue("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                        <SelectItem value="FEMENINO">Femenino</SelectItem>
                        <SelectItem value="OTRO">Otro</SelectItem>
                        <SelectItem value="PREFIERO_NO_DECIR">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="occupation">Ocupación *</Label>
                    <Input
                      id="occupation"
                      placeholder="Ej: Estudiante, Profesional, etc."
                      {...register("occupation")}
                    />
                    {errors.occupation && (
                      <p className="text-sm text-red-600 mt-1">{errors.occupation.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Descripción personal *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Cuéntanos sobre ti, tu personalidad, estilo de vida..."
                    rows={4}
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ubicación y Presupuesto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Ubicación y Presupuesto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="city">Ciudad *</Label>
                    <Select onValueChange={(value) => setValue("city", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && (
                      <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="neighborhood">Barrio</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Ej: Centro, Villa Bonita..."
                      {...register("neighborhood")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="budgetMin">Presupuesto mínimo (ARS) *</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      min="0"
                      placeholder="50000"
                      {...register("budgetMin", { valueAsNumber: true })}
                    />
                    {errors.budgetMin && (
                      <p className="text-sm text-red-600 mt-1">{errors.budgetMin.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="budgetMax">Presupuesto máximo (ARS) *</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      min="0"
                      placeholder="150000"
                      {...register("budgetMax", { valueAsNumber: true })}
                    />
                    {errors.budgetMax && (
                      <p className="text-sm text-red-600 mt-1">{errors.budgetMax.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Preferencias de Convivencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="preferredGender">Género preferido del roommate</Label>
                    <Select onValueChange={(value) => setValue("preferredGender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona preferencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                        <SelectItem value="FEMENINO">Femenino</SelectItem>
                        <SelectItem value="INDIFERENTE">Me es indiferente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="lifestyle">Estilo de vida</Label>
                    <Select onValueChange={(value) => setValue("lifestyle", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRANQUILO">Tranquilo</SelectItem>
                        <SelectItem value="SOCIABLE">Sociable</SelectItem>
                        <SelectItem value="FIESTERO">Fiestero</SelectItem>
                        <SelectItem value="DEPORTISTA">Deportista</SelectItem>
                        <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="petFriendly"
                      checked={watchedValues.petFriendly}
                      onCheckedChange={(checked) => setValue("petFriendly", checked)}
                    />
                    <Label htmlFor="petFriendly">Acepto mascotas</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smoker"
                      checked={watchedValues.smoker}
                      onCheckedChange={(checked) => setValue("smoker", checked)}
                    />
                    <Label htmlFor="smoker">Soy fumador</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="availableFrom">Disponible desde</Label>
                  <Input
                    id="availableFrom"
                    type="date"
                    {...register("availableFrom")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Intereses */}
            <Card>
              <CardHeader>
                <CardTitle>Intereses y Hobbies</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Selecciona tus intereses</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest: string) => (
                      <Badge
                        key={interest}
                        variant={watchedValues.interests?.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentInterests = (watchedValues.interests || []) as string[]
                          if (currentInterests.includes(interest)) {
                            setValue("interests", currentInterests.filter((i: string) => i !== interest))
                          } else {
                            setValue("interests", [...currentInterests, interest])
                          }
                        }}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contactPhone">Teléfono de contacto</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+54 376 123-4567"
                      {...register("contactPhone")}
                    />
                    {errors.contactPhone && (
                      <p className="text-sm text-red-600 mt-1">{errors.contactPhone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Email de contacto</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="tu@email.com"
                      defaultValue={user?.email}
                      {...register("contactEmail")}
                    />
                    {errors.contactEmail && (
                      <p className="text-sm text-red-600 mt-1">{String(errors.contactEmail.message)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consentimiento Legal */}
            <Card>
              <CardHeader>
                <CardTitle>Términos y Condiciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ConsentCheckbox
                  checkedTerms={checkedTerms}
                  checkedPrivacy={checkedPrivacy}
                  onChangeTerms={setCheckedTerms}
                  onChangePrivacy={setCheckedPrivacy}
                  error={consentError}
                />
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex gap-4 justify-end">
              <Link href="/roommates">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isProcessing || !checkedTerms || !checkedPrivacy}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando perfil...
                  </>
                ) : (
                  'Crear Perfil de Roommate'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
