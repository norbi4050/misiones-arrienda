"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProfileImageUpload } from "@/components/ui/image-upload"
import { UserCheck, User, Mail, Phone, MapPin, Home, Plus, Settings, Camera, Save, Edit, Building } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function DuenoDirectoProfilePage() {
  const { user, isAuthenticated, isLoading } = useSupabaseAuth()
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
    experience: "",
    propertyTypes: "",
    preferredTenants: "",
    rentRange: "",
    availability: "",
    responseTime: "",
    references: ""
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
        experience: (user as any).experience || "",
        propertyTypes: (user as any).propertyTypes || "",
        preferredTenants: (user as any).preferredTenants || "",
        rentRange: (user as any).rentRange || "",
        availability: (user as any).availability || "",
        responseTime: (user as any).responseTime || "",
        references: (user as any).references || ""
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
                {isEditing ? (
                  <div className="w-20 h-20">
                    <ProfileImageUpload
                      value={profileData.profileImage}
                      onChange={(url) => setProfileData({...profileData, profileImage: url})}
                      disabled={!isEditing}
                      className="w-full"
                    />
                  </div>
                ) : (
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
                )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo de respuesta promedio
                    </label>
                    <Select
                      value={profileData.responseTime}
                      onValueChange={(value) => setProfileData({...profileData, responseTime: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="¿Qué tan rápido respondes?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="inmediato">Menos de 1 hora</SelectItem>
                        <SelectItem value="rapido">1-4 horas</SelectItem>
                        <SelectItem value="mismo-dia">El mismo día</SelectItem>
                        <SelectItem value="24-horas">Dentro de 24 horas</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Disponibilidad para mostrar propiedades
                    </label>
                    <Select
                      value={profileData.availability}
                      onValueChange={(value) => setProfileData({...profileData, availability: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="¿Cuándo puedes mostrar?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="cualquier-momento">Cualquier momento</SelectItem>
                        <SelectItem value="horario-laboral">Horario laboral</SelectItem>
                        <SelectItem value="tardes-fines">Tardes y fines de semana</SelectItem>
                        <SelectItem value="fines-semana">Solo fines de semana</SelectItem>
                        <SelectItem value="coordinar">A coordinar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sobre mí como propietario
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    rows={3}
                    placeholder="Cuéntanos sobre tu experiencia como propietario, tu filosofía de alquiler, qué valoras en los inquilinos..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipos de propiedades que ofreces
                    </label>
                    <Select
                      value={profileData.propertyTypes}
                      onValueChange={(value) => setProfileData({...profileData, propertyTypes: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="¿Qué tipo de propiedades tienes?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="casas">Solo casas</SelectItem>
                        <SelectItem value="departamentos">Solo departamentos</SelectItem>
                        <SelectItem value="mixto">Casas y departamentos</SelectItem>
                        <SelectItem value="comercial">Propiedades comerciales</SelectItem>
                        <SelectItem value="todos">Todo tipo de propiedades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rango de alquileres que manejas
                    </label>
                    <Select
                      value={profileData.rentRange}
                      onValueChange={(value) => setProfileData({...profileData, rentRange: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="¿En qué rango de precios?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="economico">Económico (hasta $120k)</SelectItem>
                        <SelectItem value="medio">Medio ($120k - $200k)</SelectItem>
                        <SelectItem value="medio-alto">Medio-Alto ($200k - $300k)</SelectItem>
                        <SelectItem value="alto">Alto (más de $300k)</SelectItem>
                        <SelectItem value="variado">Variado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de inquilinos que prefieres
                  </label>
                  <Select
                    value={profileData.preferredTenants}
                    onValueChange={(value) => setProfileData({...profileData, preferredTenants: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                      <SelectValue placeholder="¿Qué tipo de inquilinos buscas?" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                      <SelectItem value="familias">Familias</SelectItem>
                      <SelectItem value="profesionales">Profesionales</SelectItem>
                      <SelectItem value="estudiantes">Estudiantes</SelectItem>
                      <SelectItem value="parejas">Parejas</SelectItem>
                      <SelectItem value="cualquiera">Cualquier perfil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencias y garantías que solicitas
                  </label>
                  <textarea
                    value={profileData.references}
                    onChange={(e) => setProfileData({...profileData, references: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50"
                    rows={2}
                    placeholder="Ej: Recibo de sueldo, garantía propietaria, referencias laborales..."
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
                      Años de experiencia como propietario
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
                        <SelectItem value="5-10">5-10 años</SelectItem>
                        <SelectItem value="10+">Más de 10 años</SelectItem>
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

            {/* Consejos para Dueños Directos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consejos para Propietarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• <strong>Responde rápido:</strong> Los inquilinos valoran la comunicación ágil</p>
                  <p>• <strong>Fotos de calidad:</strong> Buenas imágenes atraen más consultas</p>
                  <p>• <strong>Precio competitivo:</strong> Investiga el mercado local</p>
                  <p>• <strong>Mantén actualizado:</strong> Revisa regularmente tus publicaciones</p>
                  <p>• <strong>Sé transparente:</strong> Menciona todos los gastos y condiciones</p>
                </div>
              </CardContent>
            </Card>

            {/* Herramientas Útiles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Herramientas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-sm">
                  📊 Calculadora de Rentabilidad
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  📋 Modelo de Contrato
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  💰 Consultar Precios de Mercado
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
