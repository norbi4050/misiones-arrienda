"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCheck, User, Mail, Phone, MapPin, Home, Plus, Settings, Camera, Save, Edit, Building } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function DuenoDirectoProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    propertyCount: "",
    bio: "",
    profileImage: "",
    experience: ""
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.userType !== 'dueno_directo') {
      router.push(`/profile/${user.userType}`)
      return
    }

    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        location: (user as any).location || "",
        propertyCount: (user as any).propertyCount || "",
        bio: (user as any).bio || "",
        profileImage: (user as any).profileImage || "",
        experience: (user as any).experience || ""
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  {profileData.profileImage ? (
                    <img 
                      src={profileData.profileImage} 
                      alt="Perfil" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <UserCheck className="h-8 w-8 text-green-600" />
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-green-600 text-white p-1.5 rounded-full hover:bg-green-700 transition-colors">
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Dueño Directo
                  </Badge>
                  {profileData.location && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profileData.location}
                    </div>
                  )}
                  {profileData.propertyCount && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Home className="h-4 w-4 mr-1" />
                      {profileData.propertyCount} propiedades
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
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
                  Actualiza tu información personal y detalles como propietario
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sobre mí
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    rows={3}
                    placeholder="Cuéntanos sobre tu experiencia como propietario y el tipo de propiedades que ofreces..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información de Propiedades */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Home className="h-5 w-5" />
                  <span>Información de Propiedades</span>
                </CardTitle>
                <CardDescription>
                  Detalles sobre tus propiedades y experiencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad de propiedades
                    </label>
                    <Select 
                      value={profileData.propertyCount} 
                      onValueChange={(value) => setProfileData({...profileData, propertyCount: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="Selecciona la cantidad" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="1">1 propiedad</SelectItem>
                        <SelectItem value="2-3">2-3 propiedades</SelectItem>
                        <SelectItem value="4-5">4-5 propiedades</SelectItem>
                        <SelectItem value="6+">Más de 6 propiedades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Años de experiencia
                    </label>
                    <Select 
                      value={profileData.experience} 
                      onValueChange={(value) => setProfileData({...profileData, experience: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="Selecciona tu experiencia" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="nuevo">Nuevo (menos de 1 año)</SelectItem>
                        <SelectItem value="1-3">1-3 años</SelectItem>
                        <SelectItem value="3-5">3-5 años</SelectItem>
                        <SelectItem value="5+">Más de 5 años</SelectItem>
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
                <CardTitle className="text-lg">Mis Propiedades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Home className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Publicadas</span>
                  </div>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Alquiladas</span>
                  </div>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Consultas</span>
                  </div>
                  <Badge variant="secondary">12</Badge>
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
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar Propiedad
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  Mis Propiedades
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </CardContent>
            </Card>

            {/* Consejos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consejos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Mantén tus propiedades actualizadas</p>
                  <p>• Responde rápido a las consultas</p>
                  <p>• Usa fotos de alta calidad</p>
                  <p>• Describe detalladamente tus propiedades</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
