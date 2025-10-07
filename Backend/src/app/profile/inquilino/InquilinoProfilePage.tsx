"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AvatarUniversal from "@/components/ui/avatar-universal"
import ErrorBoundary from "@/components/ui/error-boundary"
import { Search, User, MapPin, Heart, History, Settings, Save, Edit, Loader2 } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { fetchUserProfile } from "@/lib/apiClient"

/**
 * SCHEMA ACTUAL user_profiles (user_id TEXT):
 * ✅ ACTIVOS: role, city, neighborhood, budget_min, budget_max, bio, photos[], age, 
 *             pet_pref, smoke_pref, diet, schedule_notes, tags[], accepts_messages,
 *             highlighted_until, is_suspended, expires_at, is_paid
 * 
 * ❌ DEPRECATED: users.profile_image/avatar/logo_url (usar user_profiles.avatar_url)
 * 
 * 🔄 MAPEO: camelCase (frontend) ↔ snake_case (database)
 */

interface InquilinoProfilePageProps {
  userId: string;
}

function InquilinoProfilePageContent({ userId }: InquilinoProfilePageProps) {
  const { user, isAuthenticated, isLoading, refreshUserProfile } = useSupabaseAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [userStats, setUserStats] = useState({
    favorites: 0,
    searches: 0,
    propertiesViewed: 0,
    activeAlerts: 0,
    memberSince: 'Reciente'
  })

  const [profileData, setProfileData] = useState({
    role: "BUSCO" as "BUSCO" | "OFREZCO" | "TENANT" | "OWNER" | "AGENCY",
    city: "",
    neighborhood: "",
    budgetMin: null as number | null,
    budgetMax: null as number | null,
    bio: "",
    photos: null as string[] | null,
    age: null as number | null,
    petPref: null as "SI_PET" | "NO_PET" | "INDIFERENTE" | null,
    smokePref: null as "FUMADOR" | "NO_FUMADOR" | "INDIFERENTE" | null,
    diet: null as "NINGUNA" | "VEGETARIANO" | "VEGANO" | "CELIACO" | "OTRO" | null,
    scheduleNotes: "",
    tags: null as string[] | null,
    acceptsMessages: true,
    highlightedUntil: null as string | null,
    isSuspended: false,
    expiresAt: null as string | null,
    isPaid: false
  })

  // Función para cargar estadísticas reales del usuario
  const loadUserStats = async () => {
    if (!user) return

    try {
      setIsLoadingStats(true)
      const response = await fetch('/api/users/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUserStats(result.data)
        }
      } else {
        console.warn('No se pudieron cargar las estadísticas del usuario')
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Mounted guard para evitar flicker de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      // Cargar datos del perfil desde la API
      const loadProfileData = async () => {
        try {
          const result = await fetchUserProfile()
          setProfileData({
            role: result.profile.role || "BUSCO",
            city: result.profile.city || "",
            neighborhood: result.profile.neighborhood || "",
            budgetMin: result.profile.budgetMin || null,
            budgetMax: result.profile.budgetMax || null,
            bio: result.profile.bio || "",
            photos: result.profile.photos || null,
            age: result.profile.age || null,
            petPref: result.profile.petPref || null,
            smokePref: result.profile.smokePref || null,
            diet: result.profile.diet || null,
            scheduleNotes: result.profile.scheduleNotes || "",
            tags: result.profile.tags || null,
            acceptsMessages: result.profile.acceptsMessages !== undefined ? result.profile.acceptsMessages : true,
            highlightedUntil: result.profile.highlightedUntil || null,
            isSuspended: result.profile.isSuspended || false,
            expiresAt: result.profile.expiresAt || null,
            isPaid: result.profile.isPaid || false
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error desconocido"
          if (errorMessage === "Profile not found") {
            // Si no existe el perfil, usar valores por defecto
            setProfileData({
              role: "BUSCO",
              city: "",
              neighborhood: "",
              budgetMin: null,
              budgetMax: null,
              bio: "",
              photos: null,
              age: null,
              petPref: null,
              smokePref: null,
              diet: null,
              scheduleNotes: "",
              tags: null,
              acceptsMessages: true,
              highlightedUntil: null,
              isSuspended: false,
              expiresAt: null,
              isPaid: false
            })
            toast.success("Perfil nuevo - completa tu información")
          } else {
            console.error("Error loading profile:", error)
            toast.error(errorMessage || "Error al cargar el perfil")
          }
        }
      }

      loadProfileData()
      loadUserStats()
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Perfil guardado exitosamente")
        setIsEditing(false)

        if (refreshUserProfile) {
          await refreshUserProfile()
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al actualizar el perfil")
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error("Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <AvatarUniversal
                  userId={user?.id}
                  size="xl"
                  showUpload={isEditing}
                  fallbackText={user?.name || "Usuario"}
                  onAvatarChange={(newUrl) => {
                    toast.success("Avatar actualizado")
                  }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name || "Usuario"}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Search className="h-3 w-3 mr-1" />
                    {profileData.role === "BUSCO" ? "Busco alojamiento" : "Ofrezco alojamiento"}
                  </Badge>
                  {profileData.city && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profileData.city}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  <span>Editar Perfil</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Básica</span>
                </CardTitle>
                <CardDescription>
                  Datos principales de tu perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Rol *
                    </label>
                    <Select
                      value={profileData.role}
                      onValueChange={(value) => setProfileData({...profileData, role: value as "BUSCO" | "OFREZCO" | "TENANT" | "OWNER" | "AGENCY"})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="role" aria-describedby="role-help">
                        <SelectValue placeholder="Selecciona tu rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUSCO">🔍 Busco alojamiento</SelectItem>
                        <SelectItem value="OFREZCO">🏠 Ofrezco alojamiento</SelectItem>
                      </SelectContent>
                    </Select>
                    <div id="role-help" className="mt-1 text-xs text-gray-500">
                      Define si buscas o ofreces alojamiento
                    </div>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad *
                    </label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Posadas, Misiones"
                      aria-describedby="city-help"
                    />
                    <div id="city-help" className="mt-1 text-xs text-gray-500">
                      Ciudad donde buscas o ofreces alojamiento
                    </div>
                  </div>

                  <div>
                    <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
                      Barrio
                    </label>
                    <Input
                      id="neighborhood"
                      value={profileData.neighborhood || ""}
                      onChange={(e) => setProfileData({...profileData, neighborhood: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Centro, Villa Cabello, etc."
                      aria-describedby="neighborhood-help"
                    />
                    <div id="neighborhood-help" className="mt-1 text-xs text-gray-500">
                      Barrio específico (opcional)
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Sobre mí
                  </label>
                  <textarea
                    id="bio"
                    value={profileData.bio || ""}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    rows={3}
                    placeholder="Cuéntanos sobre ti, tu estilo de vida, qué buscas en una propiedad..."
                    aria-describedby="bio-help"
                  />
                  <div id="bio-help" className="mt-1 text-xs text-gray-500">
                    Describe tu personalidad y lo que buscas
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Presupuesto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>💰</span>
                  <span>Presupuesto</span>
                </CardTitle>
                <CardDescription>
                  Rango de precios que manejas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700 mb-1">
                      Mínimo (ARS)
                    </label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={profileData.budgetMin || ""}
                      onChange={(e) => setProfileData({...profileData, budgetMin: e.target.value ? parseInt(e.target.value) : null})}
                      onBlur={(e) => {
                        // Formateo visual al perder foco
                        const value = parseInt(e.target.value)
                        if (value && !isNaN(value)) {
                          e.target.value = value.toLocaleString('es-AR')
                        }
                      }}
                      disabled={!isEditing}
                      placeholder="50.000"
                      min="0"
                      aria-describedby="budgetMin-help"
                    />
                    <div id="budgetMin-help" className="mt-1 text-xs text-gray-500">
                      Presupuesto mínimo mensual
                    </div>
                  </div>

                  <div>
                    <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo (ARS)
                    </label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={profileData.budgetMax || ""}
                      onChange={(e) => setProfileData({...profileData, budgetMax: e.target.value ? parseInt(e.target.value) : null})}
                      onBlur={(e) => {
                        // Formateo visual al perder foco
                        const value = parseInt(e.target.value)
                        if (value && !isNaN(value)) {
                          e.target.value = value.toLocaleString('es-AR')
                        }
                      }}
                      disabled={!isEditing}
                      placeholder="150.000"
                      min="0"
                      aria-describedby="budgetMax-help"
                    />
                    <div id="budgetMax-help" className="mt-1 text-xs text-gray-500">
                      Presupuesto máximo mensual
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferencias de Convivencia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🏡</span>
                  <span>Preferencias de Convivencia</span>
                </CardTitle>
                <CardDescription>
                  Tus preferencias para compartir espacio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="petPref" className="block text-sm font-medium text-gray-700 mb-1">
                      🐕 Mascotas
                    </label>
                    <Select
                      value={profileData.petPref || ""}
                      onValueChange={(value) => setProfileData({...profileData, petPref: (value || null) as "SI_PET" | "NO_PET" | "INDIFERENTE" | null})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="petPref" aria-describedby="petPref-help">
                        <SelectValue placeholder="¿Mascotas?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SI_PET">✅ Acepto mascotas</SelectItem>
                        <SelectItem value="NO_PET">❌ No acepto mascotas</SelectItem>
                        <SelectItem value="INDIFERENTE">🤷 Me da igual</SelectItem>
                      </SelectContent>
                    </Select>
                    <div id="petPref-help" className="mt-1 text-xs text-gray-500">
                      Tu posición sobre mascotas
                    </div>
                  </div>

                  <div>
                    <label htmlFor="smokePref" className="block text-sm font-medium text-gray-700 mb-1">
                      🚬 Fumar
                    </label>
                    <Select
                      value={profileData.smokePref || ""}
                      onValueChange={(value) => setProfileData({...profileData, smokePref: (value || null) as "FUMADOR" | "NO_FUMADOR" | "INDIFERENTE" | null})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="smokePref" aria-describedby="smokePref-help">
                        <SelectValue placeholder="¿Fumar?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FUMADOR">🚬 Soy fumador</SelectItem>
                        <SelectItem value="NO_FUMADOR">🚭 No fumo</SelectItem>
                        <SelectItem value="INDIFERENTE">🤷 Me da igual</SelectItem>
                      </SelectContent>
                    </Select>
                    <div id="smokePref-help" className="mt-1 text-xs text-gray-500">
                      Tu relación con el tabaco
                    </div>
                  </div>

                  <div>
                    <label htmlFor="diet" className="block text-sm font-medium text-gray-700 mb-1">
                      🥗 Dieta
                    </label>
                    <Select
                      value={profileData.diet || ""}
                      onValueChange={(value) => setProfileData({...profileData, diet: (value || null) as "NINGUNA" | "VEGETARIANO" | "VEGANO" | "CELIACO" | "OTRO" | null})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="diet" aria-describedby="diet-help">
                        <SelectValue placeholder="Tipo de dieta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NINGUNA">🍽️ Sin restricciones</SelectItem>
                        <SelectItem value="VEGETARIANO">🥬 Vegetariano</SelectItem>
                        <SelectItem value="VEGANO">🌱 Vegano</SelectItem>
                        <SelectItem value="CELIACO">🌾 Celíaco</SelectItem>
                        <SelectItem value="OTRO">🔄 Otra dieta</SelectItem>
                      </SelectContent>
                    </Select>
                    <div id="diet-help" className="mt-1 text-xs text-gray-500">
                      Restricciones alimentarias
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalles Adicionales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📋</span>
                  <span>Detalles Adicionales</span>
                </CardTitle>
                <CardDescription>
                  Información complementaria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                      Edad
                    </label>
                    <Input
                      id="age"
                      type="number"
                      value={profileData.age || ""}
                      onChange={(e) => setProfileData({...profileData, age: e.target.value ? parseInt(e.target.value) : null})}
                      disabled={!isEditing}
                      placeholder="25"
                      min="18"
                      max="100"
                      aria-describedby="age-help"
                    />
                    <div id="age-help" className="mt-1 text-xs text-gray-500">
                      Tu edad (opcional)
                    </div>
                  </div>

                  <div>
                    <label htmlFor="scheduleNotes" className="block text-sm font-medium text-gray-700 mb-1">
                      Horarios y rutina
                    </label>
                    <Input
                      id="scheduleNotes"
                      value={profileData.scheduleNotes}
                      onChange={(e) => setProfileData({...profileData, scheduleNotes: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Ej: Trabajo de 9 a 17, estudiante nocturno"
                      aria-describedby="scheduleNotes-help"
                    />
                    <div id="scheduleNotes-help" className="mt-1 text-xs text-gray-500">
                      Describe tus horarios habituales
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Etiquetas
                  </label>
                  <Input
                    id="tags"
                    value={profileData.tags?.join(', ') || ""}
                    onChange={(e) => {
                      const tagsArray = e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0)
                      setProfileData({...profileData, tags: tagsArray.length > 0 ? tagsArray : null})
                    }}
                    disabled={!isEditing}
                    placeholder="estudiante, pareja sin hijos, limpio, sociable"
                    aria-describedby="tags-help"
                  />
                  <div id="tags-help" className="mt-1 text-xs text-gray-500">
                    Palabras clave separadas por comas
                  </div>
                  {profileData.tags && profileData.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {profileData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptsMessages"
                    checked={profileData.acceptsMessages}
                    onChange={(e) => setProfileData({...profileData, acceptsMessages: e.target.checked})}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-describedby="acceptsMessages-help"
                  />
                  <label htmlFor="acceptsMessages" className="text-sm text-gray-700">
                    Acepto recibir mensajes de otros usuarios
                  </label>
                  <div id="acceptsMessages-help" className="sr-only">
                    Permite que otros usuarios te contacten directamente
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estadísticas Reales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Mi Actividad
                  {isLoadingStats && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
                <CardDescription>
                  Miembro desde {userStats.memberSince}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Favoritos</span>
                  </div>
                  <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                    {isLoadingStats ? '...' : userStats.favorites}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Búsquedas realizadas</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    {isLoadingStats ? '...' : userStats.searches}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Propiedades vistas</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    {isLoadingStats ? '...' : userStats.propertiesViewed}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Alertas activas</span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                    {isLoadingStats ? '...' : userStats.activeAlerts}
                  </Badge>
                </div>

                {/* Mensaje motivacional basado en actividad */}
                {!isLoadingStats && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      {userStats.favorites === 0 && userStats.searches === 0
                        ? "¡Comienza a explorar propiedades para ver tu actividad aquí!"
                        : userStats.favorites > 5
                        ? "¡Excelente! Tienes varias propiedades en favoritos. ¿Ya contactaste a los propietarios?"
                        : userStats.searches > 10
                        ? "Has realizado varias búsquedas. ¡Guarda tus favoritas para no perderlas!"
                        : "¡Sigue explorando! Encuentra la propiedad perfecta para ti."
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  Ver Favoritos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <History className="h-4 w-4 mr-2" />
                  Historial de Búsquedas
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Crear Alerta de Búsqueda
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InquilinoProfilePage(props: InquilinoProfilePageProps) {
  return (
    <ErrorBoundary>
      <InquilinoProfilePageContent {...props} />
    </ErrorBoundary>
  )
}
