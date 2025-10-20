"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlanCard } from "@/components/plan/PlanCard"
import dynamic from 'next/dynamic'

// PERF: Lazy load componentes pesados para mejorar rendimiento
const LogoUploader = dynamic(
  () => import('@/components/inmobiliarias/LogoUploader').then(mod => ({ default: mod.LogoUploader })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4 h-32">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false
  }
)

const BusinessHoursEditor = dynamic(
  () => import('@/components/inmobiliarias/BusinessHoursEditor'),
  { 
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-48">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    ),
    ssr: false
  }
)

const TeamEditor = dynamic(
  () => import('@/components/inmobiliarias/TeamEditor'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-48">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    ),
    ssr: false
  }
)

const MapPickerClient = dynamic(
  () => import('@/components/property/MapPickerClient'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4 h-64">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-full bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false
  }
)

import AvatarUniversal from "@/components/ui/avatar-universal"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { Building2, MapPin, Phone, Globe, FileText, CheckCircle, AlertCircle, Facebook, Instagram, Music2, Save, X, ExternalLink, Eye, User, Shield } from "lucide-react"
import { toast } from "sonner"
import { validateCUIT, autoFormatCUIT } from "@/lib/validations/cuit"
import { BusinessHours, TeamMember, DEFAULT_BUSINESS_HOURS } from "@/types/inmobiliaria"

interface CompanyProfile {
  id: string
  user_id: string
  company_name: string
  phone: string
  commercial_phone: string | null
  address: string
  cuit: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  tiktok: string | null
  description: string | null
  license_number: string | null
  avatar: string | null  // Avatar personal para mensajes/navbar
  logo_url: string | null  // Logo para perfil público
  verified: boolean
  verified_at: string | null
  business_hours: BusinessHours
  latitude: number | null  // Coordenadas para mapa
  longitude: number | null  // Coordenadas para mapa
  show_team_public: boolean
  show_hours_public: boolean
  show_map_public: boolean
  show_stats_public: boolean
}

interface MiEmpresaClientProps {
  initialProfile: CompanyProfile
  initialTeam: TeamMember[]
  userId: string
}

export default function MiEmpresaClient({ 
  initialProfile, 
  initialTeam,
  userId 
}: MiEmpresaClientProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<CompanyProfile>(initialProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSaveBusinessHours = async (hours: BusinessHours) => {
    try {
      const response = await fetch('/api/inmobiliarias/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_hours: hours })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar horarios')
      }
      
      setProfile({ ...profile, business_hours: hours })
      toast.success('Horarios actualizados correctamente')
    } catch (error) {
      console.error('Error guardando horarios:', error)
      throw error
    }
  }

  const handleSaveTeam = async (team: TeamMember[]) => {
    try {
      const response = await fetch('/api/inmobiliarias/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar equipo')
      }
      
      toast.success('Equipo actualizado correctamente')
      router.refresh() // Revalidar datos del servidor
    } catch (error) {
      console.error('Error guardando equipo:', error)
      throw error
    }
  }

  const handleSave = async () => {
    setErrors({})
    
    // Validaciones
    const newErrors: Record<string, string> = {}
    if (!profile.company_name?.trim()) newErrors.companyName = 'Campo requerido'
    if (!profile.phone?.trim()) newErrors.phone = 'Campo requerido'
    if (!profile.address?.trim()) newErrors.address = 'Campo requerido'
    
    // Validar CUIT si se proporciona
    if (profile.cuit?.trim()) {
      const cuitValidation = validateCUIT(profile.cuit)
      if (!cuitValidation.valid) {
        newErrors.cuit = cuitValidation.error || 'CUIT inválido'
      }
    }
    
    // Validar website si se proporciona
    if (profile.website?.trim()) {
      try {
        new URL(profile.website)
      } catch {
        newErrors.website = 'URL inválida (debe incluir http:// o https://)'
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]')
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      toast.error('Por favor corrige los errores en el formulario')
      return
    }
    
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/inmobiliarias/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: profile.company_name,
          phone: profile.phone,
          commercial_phone: profile.commercial_phone?.trim() || null,
          address: profile.address,
          cuit: profile.cuit?.trim() || null,
          website: profile.website?.trim() || null,
          facebook: profile.facebook?.trim() || null,
          instagram: profile.instagram?.trim() || null,
          tiktok: profile.tiktok?.trim() || null,
          description: profile.description?.trim() || null,
          license_number: profile.license_number?.trim() || null,
          show_team_public: profile.show_team_public,
          show_hours_public: profile.show_hours_public,
          show_map_public: profile.show_map_public,
          show_stats_public: profile.show_stats_public
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Error al guardar')
      }
      
      toast.success('Perfil actualizado correctamente')

      // FASE 5: Geocodificación automática si el mapa está activado
      if (profile.show_map_public && profile.address?.trim()) {
        try {
          console.log('[Geocode] Obteniendo coordenadas para:', profile.address)

          // Llamar directamente a Nominatim (sin endpoint intermediario)
          const encodedAddress = encodeURIComponent(profile.address)
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=ar`

          const geocodeResponse = await fetch(nominatimUrl, {
            headers: {
              'User-Agent': 'MisionesArrienda/1.0 (contact@misiones-arrienda.com)'
            }
          })

          if (geocodeResponse.ok) {
            const results = await geocodeResponse.json()

            if (results && results.length > 0) {
              const lat = parseFloat(results[0].lat)
              const lng = parseFloat(results[0].lon)

              console.log('[Geocode] Coordenadas obtenidas:', lat, lng)

              // Actualizar coordenadas en BD (enviar campos requeridos para pasar validación)
              const updateCoordsResponse = await fetch('/api/inmobiliarias/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  company_name: profile.company_name,
                  phone: profile.phone,
                  address: profile.address,
                  latitude: lat,
                  longitude: lng
                })
              })

              if (updateCoordsResponse.ok) {
                console.log('[Geocode] Coordenadas guardadas en BD')
                toast.success('📍 Ubicación geocodificada correctamente')

                // Actualizar estado local
                setProfile({ ...profile, latitude: lat, longitude: lng })
              } else {
                console.warn('[Geocode] Error guardando coordenadas en BD')
              }
            } else {
              console.warn('[Geocode] No se encontraron resultados para:', profile.address)
            }
          } else {
            console.warn('[Geocode] Error en llamada a Nominatim:', geocodeResponse.status)
          }
        } catch (geocodeError) {
          console.warn('[Geocode] Error en geocodificación automática:', geocodeError)
          // No bloquear la UX, solo advertir en consola
        }
      }

      setIsEditing(false)
      router.refresh() // PERF: Revalidar datos del servidor

    } catch (error) {
      console.error('Error guardando perfil:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setErrors({})
    setProfile(initialProfile) // Restaurar datos iniciales
  }

  const isProfileComplete = profile.company_name && profile.phone && profile.address

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.company_name || 'Mi Empresa'}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  {profile.verified ? (
                    <span className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verificado
                    </span>
                  ) : (
                    <span className="flex items-center text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Sin verificar
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isProfileComplete && (
                <Link href={`/inmobiliaria/${userId}`} prefetch={false} target="_blank">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Ver perfil público
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              )}
            </div>
          </div>
          
          {!isProfileComplete && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Completá estos datos para publicar propiedades
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Los campos marcados con * son obligatorios
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mi Plan */}
        <div className="mb-6">
          <PlanCard />
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Información de la Empresa</h2>
          
          {/* Identidad Obligatoria */}
          <div className="space-y-4 mb-8 pb-8 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Identidad
              <span className="ml-2 text-sm text-red-600">* Obligatorio</span>
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Comercial *
              </label>
              <Input
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                disabled={!isEditing}
                className={errors.companyName ? 'border-red-500' : ''}
                data-error={!!errors.companyName}
                placeholder="Ej: Inmobiliaria Misiones Premium"
              />
              {errors.companyName && (
                <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                    data-error={!!errors.phone}
                    placeholder="+54 376 123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Teléfono principal de contacto
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono Comercial
                  <span className="ml-2 text-xs text-gray-500">Opcional</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    value={profile.commercial_phone || ''}
                    onChange={(e) => setProfile({ ...profile, commercial_phone: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="+54 376 987-6543"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Se mostrará en el perfil público
                </p>
              </div>
            </div>
            
            {/* Campo de dirección - solo visible cuando NO hay dirección o NO está editando */}
            {(!isEditing || !profile.address) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <AddressAutocomplete
                  value={profile.address}
                  onChange={(value) => setProfile({ ...profile, address: value })}
                  onSelect={(suggestion) => {
                    console.log('[AddressAutocomplete] Dirección seleccionada:', suggestion.display_name)
                    // La dirección ya se actualiza con onChange
                    // Las coordenadas se geocodificarán al guardar
                  }}
                  placeholder="Ej: Av. Corrientes 1234, Posadas"
                  disabled={!isEditing}
                  error={!!errors.address}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                )}
              </div>
            )}

            {/* Mapa para ubicación exacta - reemplaza el campo de dirección en modo edición */}
            {isEditing && profile.address && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    📍 Ubicación de tu Empresa
                  </label>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, address: '', latitude: null, longitude: null })}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Cambiar dirección
                  </button>
                </div>
                <p className="text-xs text-gray-700 mb-1 font-medium">
                  {profile.address}
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Arrastra el pin o haz clic en el mapa para ajustar la ubicación exacta
                </p>
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                  <MapPickerClient
                    value={profile.latitude && profile.longitude ? { lat: profile.latitude, lng: profile.longitude } : null}
                    onChange={(coords) => {
                      console.log('[MapPicker] Coordenadas seleccionadas:', coords)
                      setProfile({ ...profile, latitude: coords.lat, longitude: coords.lng })
                    }}
                  />
                </div>
                {profile.latitude && profile.longitude && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Coordenadas: {profile.latitude.toFixed(6)}, {profile.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Información Adicional */}
          <div className="space-y-4 mb-8 pb-8 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Información Adicional
              <span className="ml-2 text-sm text-gray-500">Opcional</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CUIT
                  {profile.cuit && profile.verified && (
                    <span className="ml-2 inline-flex items-center text-green-600 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificado
                    </span>
                  )}
                </label>
                <Input
                  value={profile.cuit || ''}
                  onChange={(e) => {
                    const formatted = autoFormatCUIT(e.target.value)
                    setProfile({ ...profile, cuit: formatted })
                  }}
                  disabled={!isEditing}
                  className={errors.cuit ? 'border-red-500' : ''}
                  data-error={!!errors.cuit}
                  placeholder="XX-XXXXXXXX-X"
                  maxLength={13}
                />
                {errors.cuit ? (
                  <p className="text-sm text-red-600 mt-1">{errors.cuit}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Completá tu CUIT para obtener el badge de verificación
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matrícula / Licencia
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    value={profile.license_number || ''}
                    onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="CUCICBA-12345"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio Web
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  disabled={!isEditing}
                  className={`pl-10 ${errors.website ? 'border-red-500' : ''}`}
                  data-error={!!errors.website}
                  placeholder="https://www.ejemplo.com"
                />
              </div>
              {errors.website && (
                <p className="text-sm text-red-600 mt-1">{errors.website}</p>
              )}
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    value={profile.facebook || ''}
                    onChange={(e) => setProfile({ ...profile, facebook: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="@usuario"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    value={profile.instagram || ''}
                    onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="@usuario"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TikTok
                </label>
                <div className="relative">
                  <Music2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    value={profile.tiktok || ''}
                    onChange={(e) => setProfile({ ...profile, tiktok: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Sobre Nosotros */}
          <div className="space-y-4 mb-8 pb-8 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Sobre Nosotros
              <span className="ml-2 text-sm text-gray-500">Opcional</span>
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la Empresa
              </label>
              <Textarea
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                disabled={!isEditing}
                rows={4}
                placeholder="Cuéntanos sobre tu inmobiliaria, experiencia, especialidades..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta descripción se mostrará en tu perfil público
              </p>
            </div>
          </div>
          
          {/* Avatar Personal */}
          <div className="space-y-4 mb-8 pb-8 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Avatar Personal
              <span className="ml-2 text-sm text-gray-500">Opcional</span>
            </h3>
            <div className="flex items-start space-x-4">
              <AvatarUniversal
                userId={userId}
                size="xl"
                showUpload={isEditing}
                fallbackText={profile.company_name || 'Empresa'}
                onAvatarChange={(newUrl) => {
                  toast.success('Avatar actualizado correctamente')
                  router.refresh()
                }}
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Este avatar se mostrará en el navbar, mensajes y comunidad.
                </p>
                <p className="text-xs text-gray-500">
                  Recomendado: Foto del representante de la inmobiliaria o logo cuadrado (formato circular).
                </p>
                {isEditing && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Haz clic en el avatar para cambiar la imagen
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Logo de Empresa */}
          <div className="space-y-4 mb-8 pb-8 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Logo de la Empresa
              <span className="ml-2 text-sm text-gray-500">Opcional</span>
            </h3>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Este logo se mostrará en tu perfil público de inmobiliaria.
              </p>
              <LogoUploader
                currentLogoUrl={profile.logo_url || ''}
                onUploadSuccess={(logoUrl) => {
                  setProfile({ ...profile, logo_url: logoUrl })
                }}
                onDeleteSuccess={() => {
                  setProfile({ ...profile, logo_url: null })
                }}
                disabled={!isEditing}
              />
            </div>
          </div>
          
          {/* Configuración de Privacidad */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Configuración de Privacidad
            </h3>
            <p className="text-sm text-gray-600">
              Controlá qué información se muestra en tu perfil público
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.show_stats_public}
                  onChange={(e) => setProfile({ ...profile, show_stats_public: e.target.checked })}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="text-sm text-gray-700">
                  Mostrar estadísticas (propiedades activas, precio promedio, etc.)
                </span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.show_hours_public}
                  onChange={(e) => setProfile({ ...profile, show_hours_public: e.target.checked })}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="text-sm text-gray-700">
                  Mostrar horarios de atención
                </span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.show_map_public}
                  onChange={(e) => setProfile({ ...profile, show_map_public: e.target.checked })}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Mostrar mapa de ubicación
                  </span>
                  {profile.show_map_public && profile.latitude && profile.longitude && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Geocodificado
                    </span>
                  )}
                  {profile.show_map_public && (!profile.latitude || !profile.longitude) && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Se geocodificará al guardar
                    </span>
                  )}
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.show_team_public}
                  onChange={(e) => setProfile({ ...profile, show_team_public: e.target.checked })}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="text-sm text-gray-700">
                  Mostrar equipo de trabajo
                </span>
              </label>
            </div>
          </div>
          
          {/* Botones de Acción */}
          {isEditing && (
            <div className="flex space-x-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Horarios de Atención */}
        {!isEditing && profile.business_hours && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <BusinessHoursEditor
              initialHours={profile.business_hours}
              onSave={handleSaveBusinessHours}
            />
          </div>
        )}

        {/* Nuestro Equipo */}
        {!isEditing && initialTeam && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <TeamEditor
              initialTeam={initialTeam}
              onSave={handleSaveTeam}
            />
          </div>
        )}
      </div>
    </div>
  )
}
