"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LogoUploader } from "@/components/inmobiliarias/LogoUploader"
import { PlanCard } from "@/components/plan/PlanCard"
import { Building2, MapPin, Phone, Globe, FileText, CheckCircle, AlertCircle, Facebook, Instagram, Music2, Save, X, ExternalLink, Eye } from "lucide-react"
import { toast } from "sonner"
import { validateCUIT, autoFormatCUIT } from "@/lib/validations/cuit"

interface CompanyProfile {
  companyName: string
  phone: string
  address: string
  cuit?: string
  website?: string
  facebook?: string
  instagram?: string
  tiktok?: string
  description?: string
  licenseNumber?: string
  logoUrl?: string
  isVerified: boolean
  verifiedAt?: string | null
}

export default function MiEmpresaPage() {
  const { user, isLoading, isAuthenticated } = useSupabaseAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.userType !== 'inmobiliaria') {
      router.push('/')
      return
    }

    if (user) {
      loadProfile()
    }
  }, [user, isLoading, isAuthenticated, router])

  const loadProfile = async () => {
    try {
      setLoadingProfile(true)
      const response = await fetch('/api/inmobiliarias/profile')
      
      if (!response.ok) {
        throw new Error('Error al cargar el perfil')
      }
      
      const { profile: data } = await response.json()
      
      setProfile({
        companyName: data.company_name || '',
        phone: data.phone || '',
        address: data.address || '',
        cuit: data.cuit || '',
        website: data.website || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        tiktok: data.tiktok || '',
        description: data.description || '',
        licenseNumber: data.license_number || '',
        logoUrl: data.logo_url || '',
        isVerified: data.verified || false,
        verifiedAt: data.verified_at || null
      })
      
      // Si faltan datos obligatorios, activar modo edición
      if (!data.company_name || !data.phone || !data.address) {
        setIsEditing(true)
      }
    } catch (error) {
      console.error('Error cargando perfil:', error)
      toast.error('Error al cargar el perfil')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    
    setErrors({})
    
    // Validaciones
    const newErrors: Record<string, string> = {}
    if (!profile.companyName?.trim()) newErrors.companyName = 'Campo requerido'
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
      // Scroll al primer error
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
          company_name: profile.companyName,
          phone: profile.phone,
          address: profile.address,
          cuit: profile.cuit?.trim() || null,
          website: profile.website?.trim() || null,
          facebook: profile.facebook?.trim() || null,
          instagram: profile.instagram?.trim() || null,
          tiktok: profile.tiktok?.trim() || null,
          description: profile.description?.trim() || null,
          license_number: profile.licenseNumber?.trim() || null
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Error al guardar')
      }
      
      toast.success('Perfil actualizado correctamente')
      setIsEditing(false)
      loadProfile() // Recargar datos
      
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
    loadProfile()
  }

  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Error al cargar el perfil</p>
          <Button onClick={loadProfile} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const isProfileComplete = profile.companyName && profile.phone && profile.address

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
                  {profile.companyName || 'Mi Empresa'}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  {profile.isVerified ? (
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
            
            {!isEditing && (
              <div className="flex gap-2">
                {user && isProfileComplete && (
                  <Link href={`/inmobiliaria/${user.id}`} target="_blank">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Ver perfil público
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              </div>
            )}
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

        {/* ⭐ B4: Sección Mi Plan */}
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
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
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
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!isEditing}
                    className={`pl-10 ${errors.address ? 'border-red-500' : ''}`}
                    data-error={!!errors.address}
                    placeholder="Av. Corrientes 1234, Posadas"
                  />
                </div>
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Identidad Opcional */}
          <div className="space-y-4 mb-8 pb-8 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Información Adicional
              <span className="ml-2 text-sm text-gray-500">Opcional</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CUIT
                  {profile.cuit && profile.isVerified && (
                    <span className="ml-2 inline-flex items-center text-green-600 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificado
                    </span>
                  )}
                </label>
                <Input
                  value={profile.cuit}
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
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
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
                  value={profile.website}
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
                    value={profile.facebook}
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
                    value={profile.instagram}
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
                    value={profile.tiktok}
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
                value={profile.description}
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
          
          {/* Logo */}
          <div className="space-y-4 mb-8 pb-8 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Logo de la Empresa
              <span className="ml-2 text-sm text-gray-500">Opcional</span>
            </h3>
            <LogoUploader
              currentLogoUrl={profile.logoUrl}
              onUploadSuccess={(logoUrl) => {
                setProfile({ ...profile, logoUrl })
              }}
              onDeleteSuccess={() => {
                setProfile({ ...profile, logoUrl: '' })
              }}
              disabled={isEditing}
            />
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
      </div>
    </div>
  )
}
