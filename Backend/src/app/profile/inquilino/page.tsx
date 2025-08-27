"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Mail, Phone, MapPin, Heart, History, Settings, Camera, Save, Edit } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function InquilinoProfilePage() {
  const { user, isAuthenticated, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    searchType: "",
    budgetRange: "",
    bio: "",
    profileImage: "",
    preferredAreas: "",
    familySize: "",
    petFriendly: "",
    moveInDate: "",
    employmentStatus: "",
    monthlyIncome: ""
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.userType !== 'inquilino') {
      router.push(`/profile/${user.userType}`)
      return
    }

    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        location: (user as any).location || "",
        searchType: (user as any).searchType || "",
        budgetRange: (user as any).budgetRange || "",
        bio: (user as any).bio || "",
        profileImage: (user as any).profileImage || "",
        preferredAreas: (user as any).preferredAreas || "",
        familySize: (user as any).familySize || "",
        petFriendly: (user as any).petFriendly || "",
        moveInDate: (user as any).moveInDate || "",
        employmentStatus: (user as any).employmentStatus || "",
        monthlyIncome: (user as any).monthlyIncome || ""
      })
    }
  }, [user, isAuthenticated, isLoading, router])

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
        toast.success("Perfil actualizado exitosamente")
        setIsEditing(false)
      } else {
        toast.error("Error al actualizar el perfil")
      }
    } catch (error) {
      toast.error("Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
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
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  {profileData.profileImage ? (
                    <img 
                      src={profileData.profileImage} 
                      alt="Perfil" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <Search className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors">
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Search className="h-3 w-3 mr-1" />
                    Inquilino
                  </Badge>
                  {profileData.location && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profileData.location}
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
          {/* Información Personal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Personal</span>
                </CardTitle>
                <CardDescription>
                  Actualiza tu información personal y preferencias de búsqueda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="+54 376 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="Posadas, Misiones"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tamaño de familia
                    </label>
                    <Select 
                      value={profileData.familySize} 
                      onValueChange={(value) => setProfileData({...profileData, familySize: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="Selecciona el tamaño" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="1">Solo yo</SelectItem>
                        <SelectItem value="2">Pareja (2 personas)</SelectItem>
                        <SelectItem value="3-4">Familia pequeña (3-4 personas)</SelectItem>
                        <SelectItem value="5+">Familia grande (5+ personas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Situación laboral
                    </label>
                    <Select 
                      value={profileData.employmentStatus} 
                      onValueChange={(value) => setProfileData({...profileData, employmentStatus: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="Selecciona tu situación" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="empleado">Empleado en relación de dependencia</SelectItem>
                        <SelectItem value="autonomo">Trabajador autónomo</SelectItem>
                        <SelectItem value="profesional">Profesional independiente</SelectItem>
                        <SelectItem value="jubilado">Jubilado/Pensionado</SelectItem>
                        <SelectItem value="estudiante">Estudiante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ingresos mensuales aproximados
                    </label>
                    <Select 
                      value={profileData.monthlyIncome} 
                      onValueChange={(value) => setProfileData({...profileData, monthlyIncome: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="Selecciona el rango" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="hasta-100k">Hasta $100.000</SelectItem>
                        <SelectItem value="100k-200k">$100.000 - $200.000</SelectItem>
                        <SelectItem value="200k-400k">$200.000 - $400.000</SelectItem>
                        <SelectItem value="400k-600k">$400.000 - $600.000</SelectItem>
                        <SelectItem value="600k+">Más de $600.000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha deseada de mudanza
                    </label>
                    <Select 
                      value={profileData.moveInDate} 
                      onValueChange={(value) => setProfileData({...profileData, moveInDate: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="¿Cuándo te mudas?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="inmediato">Inmediatamente</SelectItem>
                        <SelectItem value="1-mes">En 1 mes</SelectItem>
                        <SelectItem value="2-3-meses">En 2-3 meses</SelectItem>
                        <SelectItem value="6-meses">En 6 meses</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zonas de interés
                  </label>
                  <Input
                    value={profileData.preferredAreas}
                    onChange={(e) => setProfileData({...profileData, preferredAreas: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Ej: Centro, Villa Cabello, Itaembé Guazú"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sobre mí y mis necesidades
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    rows={3}
                    placeholder="Cuéntanos sobre ti, tu estilo de vida, qué buscas en una propiedad, si tienes mascotas, etc..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preferencias de Búsqueda */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Preferencias de Búsqueda</span>
                </CardTitle>
                <CardDescription>
                  Configura tus preferencias para recibir mejores recomendaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de búsqueda
                    </label>
                    <Select 
                      value={profileData.searchType} 
                      onValueChange={(value) => setProfileData({...profileData, searchType: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="alquiler">Para alquilar</SelectItem>
                        <SelectItem value="compra">Para comprar</SelectItem>
                        <SelectItem value="ambos">Ambos (alquiler y compra)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presupuesto mensual para alquiler
                    </label>
                    <Select 
                      value={profileData.budgetRange} 
                      onValueChange={(value) => setProfileData({...profileData, budgetRange: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="Selecciona tu presupuesto" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="hasta-80k">Hasta $80.000</SelectItem>
                        <SelectItem value="80k-120k">$80.000 - $120.000</SelectItem>
                        <SelectItem value="120k-180k">$120.000 - $180.000</SelectItem>
                        <SelectItem value="180k-250k">$180.000 - $250.000</SelectItem>
                        <SelectItem value="250k+">Más de $250.000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mi Actividad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Favoritos</span>
                  </div>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Búsquedas</span>
                  </div>
                  <Badge variant="secondary">28</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Propiedades vistas</span>
                  </div>
                  <Badge variant="secondary">156</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Alertas activas</span>
                  </div>
                  <Badge variant="secondary">3</Badge>
                </div>
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
