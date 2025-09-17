"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, User, Mail, Phone, MapPin, Home, Users, Award, Camera, Save, Edit, Building, CheckCircle } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function InmobiliariaProfilePage() {
  const { user, isAuthenticated, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    companyName: "",
    licenseNumber: "",
    bio: "",
    profileImage: "",
    website: "",
    foundedYear: "",
    teamSize: "",
    specializations: "",
    serviceAreas: "",
    languages: "",
    certifications: "",
    businessHours: "",
    emergencyContact: "",
    socialMedia: ""
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && user.userType !== 'inmobiliaria') {
      router.push(`/profile/${user.userType}`)
      return
    }

    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        location: (user as any).location || "",
        companyName: (user as any).companyName || "",
        licenseNumber: (user as any).licenseNumber || "",
        bio: (user as any).bio || "",
        profileImage: (user as any).profileImage || "",
        website: (user as any).website || "",
        foundedYear: (user as any).foundedYear || "",
        teamSize: (user as any).teamSize || "",
        specializations: (user as any).specializations || "",
        serviceAreas: (user as any).serviceAreas || "",
        languages: (user as any).languages || "",
        certifications: (user as any).certifications || "",
        businessHours: (user as any).businessHours || "",
        emergencyContact: (user as any).emergencyContact || "",
        socialMedia: (user as any).socialMedia || ""
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  {profileData.profileImage ? (
                    <img
                      src={profileData.profileImage}
                      alt="Perfil"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-purple-600" />
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1.5 rounded-full hover:bg-purple-700 transition-colors">
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profileData.companyName || profileData.name}</h1>
                <p className="text-gray-600">{profileData.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    <Building2 className="h-3 w-3 mr-1" />
                    Inmobiliaria
                  </Badge>
                  {profileData.licenseNumber && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificada
                    </Badge>
                  )}
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
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
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
                  <span>Información del Responsable</span>
                </CardTitle>
                <CardDescription>
                  Información del responsable de la inmobiliaria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del responsable
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="Nombre del responsable"
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
                        placeholder="contacto@inmobiliaria.com"
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
              </CardContent>
            </Card>

            {/* Información de la Empresa */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Información de la Inmobiliaria</span>
                </CardTitle>
                <CardDescription>
                  Detalles de la empresa inmobiliaria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la inmobiliaria
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        value={profileData.companyName}
                        onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="Inmobiliaria San Martín"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de matrícula
                    </label>
                    <div className="relative">
                      <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        value={profileData.licenseNumber}
                        onChange={(e) => setProfileData({...profileData, licenseNumber: e.target.value})}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="MAT-12345"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sitio web (opcional)
                    </label>
                    <Input
                      value={profileData.website}
                      onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      disabled={!isEditing}
                      placeholder="www.inmobiliaria.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año de fundación
                    </label>
                    <Select
                      value={profileData.foundedYear}
                      onValueChange={(value) => setProfileData({...profileData, foundedYear: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="Selecciona el año" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2020">2020</SelectItem>
                        <SelectItem value="2015-2019">2015-2019</SelectItem>
                        <SelectItem value="2010-2014">2010-2014</SelectItem>
                        <SelectItem value="2000-2009">2000-2009</SelectItem>
                        <SelectItem value="antes-2000">Antes del 2000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tamaño del equipo
                    </label>
                    <Select
                      value={profileData.teamSize}
                      onValueChange={(value) => setProfileData({...profileData, teamSize: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="¿Cuántas personas trabajan?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="1-2">1-2 personas</SelectItem>
                        <SelectItem value="3-5">3-5 personas</SelectItem>
                        <SelectItem value="6-10">6-10 personas</SelectItem>
                        <SelectItem value="11-20">11-20 personas</SelectItem>
                        <SelectItem value="20+">Más de 20 personas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horarios de atención
                    </label>
                    <Select
                      value={profileData.businessHours}
                      onValueChange={(value) => setProfileData({...profileData, businessHours: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectValue placeholder="¿Cuándo atienden?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                        <SelectItem value="lun-vie-9-18">Lun-Vie 9:00-18:00</SelectItem>
                        <SelectItem value="lun-vie-8-19">Lun-Vie 8:00-19:00</SelectItem>
                        <SelectItem value="lun-sab-9-18">Lun-Sáb 9:00-18:00</SelectItem>
                        <SelectItem value="24-7">24/7 disponible</SelectItem>
                        <SelectItem value="personalizado">Horario personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zonas de servicio
                    </label>
                    <Input
                      value={profileData.serviceAreas}
                      onChange={(e) => setProfileData({...profileData, serviceAreas: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Ej: Posadas, Garupá, Candelaria"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Idiomas que hablan
                    </label>
                    <Input
                      value={profileData.languages}
                      onChange={(e) => setProfileData({...profileData, languages: e.target.value})}
                      disabled={!isEditing}
                      placeholder="Ej: Español, Portugués, Inglés"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especializaciones
                  </label>
                  <Select
                    value={profileData.specializations}
                    onValueChange={(value) => setProfileData({...profileData, specializations: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                      <SelectValue placeholder="¿En qué se especializan?" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                      <SelectItem value="residencial">Propiedades residenciales</SelectItem>
                      <SelectItem value="comercial">Propiedades comerciales</SelectItem>
                      <SelectItem value="lujo">Propiedades de lujo</SelectItem>
                      <SelectItem value="inversion">Inversiones inmobiliarias</SelectItem>
                      <SelectItem value="rural">Propiedades rurales</SelectItem>
                      <SelectItem value="integral">Servicio integral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificaciones y membresías
                  </label>
                  <textarea
                    value={profileData.certifications}
                    onChange={(e) => setProfileData({...profileData, certifications: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                    rows={2}
                    placeholder="Ej: Cámara Inmobiliaria de Misiones, Certificación ISO 9001..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de la empresa
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                    rows={4}
                    placeholder="Describe tu inmobiliaria, servicios que ofreces, experiencia en el mercado, zonas de especialización, valores de la empresa..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contacto de emergencia
                    </label>
                    <Input
                      value={profileData.emergencyContact}
                      onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
                      disabled={!isEditing}
                      placeholder="+54 376 123-4567 (24hs)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Redes sociales
                    </label>
                    <Input
                      value={profileData.socialMedia}
                      onChange={(e) => setProfileData({...profileData, socialMedia: e.target.value})}
                      disabled={!isEditing}
                      placeholder="@inmobiliaria_instagram, Facebook, LinkedIn"
                    />
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
                <CardTitle className="text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Home className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Propiedades</span>
                  </div>
                  <Badge variant="secondary">24</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Clientes</span>
                  </div>
                  <Badge variant="secondary">156</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Operaciones</span>
                  </div>
                  <Badge variant="secondary">89</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Calificación</span>
                  </div>
                  <Badge variant="secondary">4.8⭐</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gestión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/publicar/premium')}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Crear Publicación Premium
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  Mis Propiedades
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Clientes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Reportes
                </Button>
              </CardContent>
            </Card>

            {/* Certificaciones y Verificaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Matrícula Verificada</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Empresa Registrada</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Perfil Completo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cuenta Premium</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contacto Rápido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contacto Directo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  📞 Llamar Ahora
                </Button>
                <Button variant="outline" className="w-full">
                  💬 WhatsApp Business
                </Button>
                <Button variant="outline" className="w-full">
                  📧 Email Corporativo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
