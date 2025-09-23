'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PropertyImageUploader } from '@/components/ui/property-image-uploader'
import { ArrowLeft, Save, Loader2, FileText, Eye, Upload } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

// Schema para el formulario de edición
const editFormSchema = z.object({
  title: z.string().min(3, 'Título muy corto').max(140, 'Título muy largo'),
  description: z.string().min(10, 'Descripción muy corta').max(2000, 'Descripción muy larga'),
  price: z.number().min(0, 'Precio debe ser positivo'),
  currency: z.string(),
  city: z.string().min(1, 'Ciudad requerida'),
  province: z.string().min(1, 'Provincia requerida'),
  address: z.string().optional(),
  property_type: z.enum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO']),
  operation_type: z.enum(['RENT', 'SALE']),
  bedrooms: z.number().min(0, 'Dormitorios no pueden ser negativos'),
  bathrooms: z.number().min(0, 'Baños no pueden ser negativos'),
  area: z.number().min(0, 'Área debe ser positiva'),
  images_urls: z.array(z.string()),
  amenities: z.array(z.string()),
  features: z.array(z.string()),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional()
})

type EditFormData = z.infer<typeof editFormSchema>

interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: string
  city: string
  province: string
  address?: string
  propertyType: string
  operationType: string
  bedrooms: number
  bathrooms: number
  area: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  images: string[]
  images_urls: string[]
  amenities: string[]
  features: string[]
}

export default function EditarPropiedadPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useUser()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPublishReady, setIsPublishReady] = useState(false)
  const [saveType, setSaveType] = useState<'draft' | 'save' | 'publish'>('save')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      currency: 'ARS',
      images_urls: [],
      amenities: [],
      features: []
    }
  })

  const watchedImages = watch('images_urls')
  const watchedData = watch()

  // Cargar datos de la propiedad
  useEffect(() => {
    if (!isAuthenticated || !params.id) return

    const loadProperty = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/properties/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Propiedad no encontrada o no tienes permisos para editarla')
          }
          throw new Error('Error al cargar la propiedad')
        }

        const data = await response.json()
        setProperty(data)

        // Poblar formulario con datos existentes
        reset({
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency || 'ARS',
          city: data.city,
          province: data.province,
          address: data.address || '',
          property_type: data.propertyType,
          operation_type: data.operationType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          area: data.area,
          images_urls: data.images_urls || [],
          amenities: data.amenities || [],
          features: data.features || []
        })

      } catch (error) {
        console.error('Error loading property:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [isAuthenticated, params.id, reset])

  // Verificar si está listo para publicar
  useEffect(() => {
    const ready = !!(
      watchedData.title && watchedData.title.length >= 3 &&
      watchedData.description && watchedData.description.length >= 10 &&
      watchedData.price && watchedData.price > 0 &&
      watchedData.city &&
      watchedData.province &&
      watchedData.property_type &&
      watchedData.operation_type &&
      watchedData.bedrooms !== undefined &&
      watchedData.bathrooms !== undefined &&
      watchedData.area && watchedData.area > 0
    )
    setIsPublishReady(ready)
  }, [watchedData])

  // Manejar guardado
  const onSubmit = async (data: EditFormData) => {
    if (!property) return

    try {
      const updateData: any = {
        ...data,
        // Convertir nombres de campos para API
        propertyType: data.property_type,
        operationType: data.operation_type
      }

      // Si es guardar como borrador, forzar status DRAFT
      if (saveType === 'draft') {
        updateData.status = 'DRAFT'
      }

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la propiedad')
      }

      const result = await response.json()
      
      // Si es guardar y publicar, llamar al endpoint de publicar
      if (saveType === 'publish' && isPublishReady) {
        const publishResponse = await fetch(`/api/properties/${property.id}/publish`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (publishResponse.ok) {
          toast.success('Propiedad guardada y publicada exitosamente')
        } else {
          toast.success('Propiedad guardada, pero no se pudo publicar')
        }
      } else {
        const message = saveType === 'draft' 
          ? 'Borrador guardado exitosamente'
          : 'Propiedad actualizada exitosamente'
        toast.success(message)
      }
      
      // Redirigir después de 1 segundo
      setTimeout(() => {
        router.push('/mis-propiedades')
      }, 1000)

    } catch (error) {
      console.error('Error saving property:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al guardar: ${errorMessage}`)
    }
  }

  // Si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Editar Propiedad</h1>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para editar propiedades.</p>
          <Link href="/login">
            <Button>Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Cargando propiedad...</span>
        </div>
      </div>
    )
  }

  // Error
  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-800">{error || 'Propiedad no encontrada'}</p>
            <div className="flex gap-2 justify-center mt-4">
              <Link href="/mis-propiedades">
                <Button variant="outline" size="sm">
                  Volver a Mis Propiedades
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.reload()}
                size="sm"
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/mis-propiedades">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Editar Propiedad</h1>
          <p className="text-gray-600 mt-1">
            Modifica los detalles de tu propiedad
          </p>
        </div>
        <Link href={`/properties/${property.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            Vista Previa
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título */}
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ej: Hermoso departamento en el centro"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe tu propiedad en detalle..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Precio y Moneda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select onValueChange={(value) => setValue('currency', value)} defaultValue="ARS">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Ej: Posadas"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="province">Provincia *</Label>
                <Input
                  id="province"
                  {...register('province')}
                  placeholder="Ej: Misiones"
                  className={errors.province ? 'border-red-500' : ''}
                />
                {errors.province && (
                  <p className="text-sm text-red-600 mt-1">{errors.province.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Ej: Av. Corrientes 1234"
              />
            </div>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property_type">Tipo de Propiedad *</Label>
                <Select onValueChange={(value) => setValue('property_type', value as any)}>
                  <SelectTrigger className={errors.property_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOUSE">Casa</SelectItem>
                    <SelectItem value="APARTMENT">Departamento</SelectItem>
                    <SelectItem value="PH">PH</SelectItem>
                    <SelectItem value="STUDIO">Estudio</SelectItem>
                    <SelectItem value="COMMERCIAL">Comercial</SelectItem>
                    <SelectItem value="LAND">Terreno</SelectItem>
                    <SelectItem value="OFFICE">Oficina</SelectItem>
                    <SelectItem value="WAREHOUSE">Depósito</SelectItem>
                  </SelectContent>
                </Select>
                {errors.property_type && (
                  <p className="text-sm text-red-600 mt-1">{errors.property_type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="operation_type">Tipo de Operación *</Label>
                <Select onValueChange={(value) => setValue('operation_type', value as any)}>
                  <SelectTrigger className={errors.operation_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar operación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RENT">Alquiler</SelectItem>
                    <SelectItem value="SALE">Venta</SelectItem>
                  </SelectContent>
                </Select>
                {errors.operation_type && (
                  <p className="text-sm text-red-600 mt-1">{errors.operation_type.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Dormitorios *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  {...register('bedrooms', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.bedrooms ? 'border-red-500' : ''}
                />
                {errors.bedrooms && (
                  <p className="text-sm text-red-600 mt-1">{errors.bedrooms.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bathrooms">Baños *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  {...register('bathrooms', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.bathrooms ? 'border-red-500' : ''}
                />
                {errors.bathrooms && (
                  <p className="text-sm text-red-600 mt-1">{errors.bathrooms.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="area">Área (m²) *</Label>
                <Input
                  id="area"
                  type="number"
                  min="0"
                  {...register('area', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.area ? 'border-red-500' : ''}
                />
                {errors.area && (
                  <p className="text-sm text-red-600 mt-1">{errors.area.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Imágenes de la Propiedad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user && property && (
              <PropertyImageUploader
                value={watchedImages || []}
                onChange={(keys) => setValue('images_urls', keys)}
                userId={user.id}
                propertyId={property.id}
                maxImages={10}
                disabled={isSubmitting}
              />
            )}
          </CardContent>
        </Card>

        {/* Estado de publicación */}
        {!isPublishReady && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Propiedad incompleta para publicar
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Completa todos los campos obligatorios para poder publicar
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <Link href="/mis-propiedades" className="sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            {/* Guardar como borrador */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSaveType('draft')
                handleSubmit(onSubmit)()
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting && saveType === 'draft' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Guardar como Borrador
                </>
              )}
            </Button>

            {/* Guardar */}
            <Button
              type="button"
              onClick={() => {
                setSaveType('save')
                handleSubmit(onSubmit)()
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting && saveType === 'save' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>

            {/* Guardar y publicar */}
            <Button
              type="button"
              onClick={() => {
                setSaveType('publish')
                handleSubmit(onSubmit)()
              }}
              disabled={isSubmitting || !isPublishReady}
              className="flex-1"
              title={!isPublishReady ? 'Completa todos los campos obligatorios para publicar' : ''}
            >
              {isSubmitting && saveType === 'publish' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Guardar y Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
