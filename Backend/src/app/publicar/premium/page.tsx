"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link, Sparkles, AlertCircle, CheckCircle, ExternalLink, Loader2, Crown, Zap } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface UnfurlData {
  title?: string
  description?: string
  images: string[]
  price?: {
    amount: number
    currency: string
    period?: string
  }
  operation?: 'sale' | 'rent'
  propertyType?: string
  address?: string
  coords?: {
    lat: number
    lng: number
  }
  bedrooms?: number
  bathrooms?: number
  areaM2?: number
  features: string[]
  sourceUrl: string
  canEmbed: boolean
  importQuality: 'high' | 'medium' | 'low'
}

export default function PremiumPublishPage() {
  const { user, isAuthenticated, isLoading } = useSupabaseAuth()
  const router = useRouter()
  
  const [url, setUrl] = useState("")
  const [isUnfurling, setIsUnfurling] = useState(false)
  const [unfurlData, setUnfurlData] = useState<UnfurlData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  
  // Mock premium plan check
  const hasPremiumPlan = true // TODO: Implement real premium plan check

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    operation: "",
    propertyType: "",
    address: "",
    bedrooms: "",
    bathrooms: "",
    areaM2: "",
    images: [] as string[]
  })

  const handleUnfurl = async () => {
    if (!url.trim()) {
      toast.error("Por favor ingresa una URL válida")
      return
    }

    setIsUnfurling(true)
    try {
      const response = await fetch('/api/unfurl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setUnfurlData(data.unfurlData)
        
        // Pre-fill form with extracted data
        setFormData({
          title: data.unfurlData.title || "",
          description: data.unfurlData.description || "",
          price: data.unfurlData.price?.amount?.toString() || "",
          operation: data.unfurlData.operation || "",
          propertyType: data.unfurlData.propertyType || "",
          address: data.unfurlData.address || "",
          bedrooms: data.unfurlData.bedrooms?.toString() || "",
          bathrooms: data.unfurlData.bathrooms?.toString() || "",
          areaM2: data.unfurlData.areaM2?.toString() || "",
          images: data.unfurlData.images || []
        })
        
        setIsEditing(true)
        toast.success(data.message || "Datos extraídos exitosamente")
      } else {
        if (data.requiresPremium) {
          toast.error("Esta función requiere un plan premium")
        } else {
          toast.error(data.error || "Error al procesar la URL")
          // Still show form for manual completion
          setIsEditing(true)
        }
      }
    } catch (error) {
      toast.error("Error de conexión")
      setIsEditing(true) // Allow manual completion
    } finally {
      setIsUnfurling(false)
    }
  }

  const handlePublish = async () => {
    if (!formData.title || !formData.price || !formData.operation) {
      toast.error("Por favor completa los campos requeridos")
      return
    }

    setIsPublishing(true)
    try {
      const response = await fetch('/api/properties/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sourceUrl: url,
          importQuality: unfurlData?.importQuality || 'manual'
        })
      })

      if (response.ok) {
        toast.success("Propiedad publicada exitosamente")
        router.push('/dashboard')
      } else {
        toast.error("Error al publicar la propiedad")
      }
    } catch (error) {
      toast.error("Error al publicar la propiedad")
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <CardTitle>Función Premium</CardTitle>
            <CardDescription>
              Esta funcionalidad está disponible solo para usuarios autenticados
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/login')} className="w-full">
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
                Publicación Premium
              </h1>
              <p className="text-gray-600 mt-1">
                Pega el link de tu anuncio y autocompletamos los datos por ti
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </div>

        {/* URL Input Section */}
        {!isEditing && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="h-5 w-5 mr-2" />
                Autocompletar con Link
              </CardTitle>
              <CardDescription>
                {hasPremiumPlan 
                  ? "Pega la URL de tu anuncio y extraeremos automáticamente título, precio, fotos y más detalles"
                  : "Esta función está disponible solo con planes premium"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasPremiumPlan ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                    <div>
                      <p className="text-amber-800 font-medium">
                        Autocompletar con link está disponible en Combos
                      </p>
                      <p className="text-amber-700 text-sm mt-1">
                        Ahorra tiempo pegando tu URL y publicá más rápido
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => router.push('/pricing')}
                  >
                    Ver Combos
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="https://ejemplo.com/propiedad/123"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isUnfurling}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleUnfurl}
                      disabled={isUnfurling || !url.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isUnfurling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Autocompletar
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Sitios compatibles:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Open Graph</Badge>
                      <Badge variant="outline">Schema.org</Badge>
                      <Badge variant="outline">oEmbed</Badge>
                      <Badge variant="outline">Meta tags</Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual Form or Edit Form */}
        {(isEditing || !hasPremiumPlan) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Detalles de la Propiedad</span>
                {unfurlData && (
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="secondary" 
                      className={
                        unfurlData.importQuality === 'high' ? 'bg-green-100 text-green-800' :
                        unfurlData.importQuality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {unfurlData.importQuality === 'high' ? 'Alta calidad' :
                       unfurlData.importQuality === 'medium' ? 'Calidad media' :
                       'Datos básicos'}
                    </Badge>
                    {unfurlData.canEmbed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(unfurlData.sourceUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver original
                      </Button>
                    )}
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {unfurlData 
                  ? "Revisa y edita los datos extraídos antes de publicar"
                  : "Completa manualmente los detalles de tu propiedad"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                    {unfurlData?.title && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Dato sugerido
                      </Badge>
                    )}
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ej: Casa 3 dormitorios con piscina en Posadas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                    {unfurlData?.price && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Dato sugerido
                      </Badge>
                    )}
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="150000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operación *
                  </label>
                  <Select 
                    value={formData.operation} 
                    onValueChange={(value) => setFormData({...formData, operation: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona operación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Venta</SelectItem>
                      <SelectItem value="rent">Alquiler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Propiedad
                    {unfurlData?.propertyType && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Dato sugerido
                      </Badge>
                    )}
                  </label>
                  <Select 
                    value={formData.propertyType} 
                    onValueChange={(value) => setFormData({...formData, propertyType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="departamento">Departamento</SelectItem>
                      <SelectItem value="local">Local Comercial</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="ph">PH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                    {unfurlData?.address && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Dato sugerido
                      </Badge>
                    )}
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Ej: Av. Mitre 1234, Posadas"
                  />
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dormitorios
                    {unfurlData?.bedrooms && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Dato sugerido
                      </Badge>
                    )}
                  </label>
                  <Input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                    placeholder="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baños
                    {unfurlData?.bathrooms && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Dato sugerido
                      </Badge>
                    )}
                  </label>
                  <Input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                    placeholder="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie (m²)
                    {unfurlData?.areaM2 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Dato sugerido
                      </Badge>
                    )}
                  </label>
                  <Input
                    type="number"
                    value={formData.areaM2}
                    onChange={(e) => setFormData({...formData, areaM2: e.target.value})}
                    placeholder="120"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                  {unfurlData?.description && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Dato sugerido
                    </Badge>
                  )}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={4}
                  placeholder="Describe las características principales de la propiedad..."
                />
              </div>

              {/* Images Preview */}
              {unfurlData?.images && unfurlData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes Extraídas
                    <Badge variant="outline" className="ml-2 text-xs">
                      {unfurlData.images.length} imagen{unfurlData.images.length > 1 ? 'es' : ''}
                    </Badge>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {unfurlData.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md border"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setUnfurlData(null)
                    setUrl("")
                    setFormData({
                      title: "",
                      description: "",
                      price: "",
                      operation: "",
                      propertyType: "",
                      address: "",
                      bedrooms: "",
                      bathrooms: "",
                      areaM2: "",
                      images: []
                    })
                  }}
                >
                  Volver
                </Button>
                
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing || !formData.title || !formData.price || !formData.operation}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    "Publicar Propiedad"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
