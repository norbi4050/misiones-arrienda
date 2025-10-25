'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { CommunityPost } from '@/types/community'

interface EditCommunityPostClientProps {
  post: CommunityPost
}

interface FormData {
  role: 'BUSCO' | 'OFREZCO'
  title: string
  city: string
  neighborhood: string
  budgetMin: number | ''
  budgetMax: number | ''
  price: number | ''
  bio: string
  photos: string[]
  age: number | ''
  petPref: string
  smokePref: string
  diet: string
  roomType: string
  scheduleNotes: string
  tags: string[]
  acceptsMessages: boolean
}

const commonTags = [
  'limpio', 'ordenado', 'sociable', 'tranquilo', 'responsable',
  'estudiante', 'profesional', 'gym', 'cocinar', 'música',
  'mascotas', 'no_fiestas', 'flexible', 'puntual', 'respetuoso'
]

const cities = ['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles', 'Leandro N. Alem']

export function EditCommunityPostClient({ post }: EditCommunityPostClientProps) {
  const [formData, setFormData] = useState<FormData>({
    role: post.role,
    title: post.title,
    city: post.city,
    neighborhood: post.neighborhood || '',
    budgetMin: post.budget_min || '',
    budgetMax: post.budget_max || '',
    price: post.price || '',
    bio: post.description,
    photos: post.images || [],
    age: post.occupants || '',
    petPref: post.pet_pref,
    smokePref: post.smoke_pref,
    diet: post.diet,
    roomType: post.room_type,
    scheduleNotes: post.lease_term || '',
    tags: post.tags || [],
    acceptsMessages: true
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      handleInputChange('tags', [...formData.tags, tag])
    }
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (formData.photos.length + files.length > 5) {
      toast.error('Máximo 5 fotos permitidas')
      return
    }

    setUploadingImages(true)

    try {
      const newPhotos: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} no es una imagen válida`)
          continue
        }

        if (file.size > 2 * 1024 * 1024) {
          toast.error(`${file.name} es muy grande. Máximo 2MB`)
          continue
        }

        const formDataUpload = new FormData()
        formDataUpload.append('file', file)

        const response = await fetch('/api/users/avatar', {
          method: 'POST',
          body: formDataUpload
        })

        if (response.ok) {
          const data = await response.json()
          newPhotos.push(data.url)
        } else {
          toast.error(`Error subiendo ${file.name}`)
        }
      }

      if (newPhotos.length > 0) {
        handleInputChange('photos', [...formData.photos, ...newPhotos])
        toast.success(`${newPhotos.length} foto(s) agregada(s)`)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Error subiendo imágenes')
    } finally {
      setUploadingImages(false)
    }
  }

  const removePhoto = (photoToRemove: string) => {
    handleInputChange('photos', formData.photos.filter(photo => photo !== photoToRemove))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title || formData.title.length < 10) {
      newErrors.title = 'El título debe tener al menos 10 caracteres'
    }

    if (formData.title && formData.title.length > 100) {
      newErrors.title = 'El título no puede exceder 100 caracteres'
    }

    if (!formData.city) {
      newErrors.city = 'La ciudad es obligatoria'
    }

    if (formData.role === 'OFREZCO' && (!formData.price || formData.price <= 0)) {
      newErrors.price = 'El precio es obligatorio si ofreces habitación'
    }

    if (formData.role === 'BUSCO') {
      if (!formData.budgetMin || formData.budgetMin <= 0) {
        newErrors.budgetMin = 'El presupuesto mínimo es obligatorio'
      }

      if (!formData.budgetMax || formData.budgetMax <= 0) {
        newErrors.budgetMax = 'El presupuesto máximo es obligatorio'
      }
    }

    if (formData.budgetMin && formData.budgetMax && formData.budgetMin > formData.budgetMax) {
      newErrors.budgetMax = 'El presupuesto máximo debe ser mayor al mínimo'
    }

    if (!formData.bio || formData.bio.length < 50) {
      newErrors.bio = 'La descripción debe tener al menos 50 caracteres'
    }

    if (formData.bio && formData.bio.length > 1000) {
      newErrors.bio = 'La descripción no puede exceder 1000 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const submitData = {
        role: formData.role,
        title: formData.title,
        description: formData.bio,
        city: formData.city,
        neighborhood: formData.neighborhood || undefined,
        price: formData.role === 'OFREZCO' ? Number(formData.price) : undefined,
        budgetMin: formData.role === 'BUSCO' ? Number(formData.budgetMin) : undefined,
        budgetMax: formData.role === 'BUSCO' ? Number(formData.budgetMax) : undefined,
        roomType: formData.roomType,
        petPref: formData.petPref,
        smokePref: formData.smokePref,
        diet: formData.diet,
        tags: formData.tags,
        images: formData.photos,
        amenities: [],
        occupants: formData.age ? Number(formData.age) : undefined,
        leaseTerm: formData.scheduleNotes || undefined
      }

      const response = await fetch(`/api/comunidad/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Cambios guardados exitosamente')
        router.push(`/comunidad/mis-publicaciones?updated=${post.id}`)
      } else {
        // Procesar errores de validación estructurados
        if (data.error === 'VALIDATION_ERROR' && data.issues) {
          const newErrors: Record<string, string> = {}
          
          for (const issue of data.issues) {
            const key = (issue.path || 'general').toString()
            if (!newErrors[key]) newErrors[key] = issue.message
          }
          
          setErrors(newErrors)
          
          // Scrollear al primer error
          const firstErrorKey = Object.keys(newErrors)[0]
          if (firstErrorKey !== 'general') {
            const element = document.getElementById(firstErrorKey)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element?.focus?.()
          }
          
          toast.error('Por favor corrige los errores en el formulario')
        } else {
          toast.error(data.details || data.error || 'Error al guardar')
        }
      }
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error('Error al actualizar el post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/comunidad/mis-publicaciones" prefetch={false}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Publicación</h1>
              <p className="text-gray-600 mt-1">Actualiza la información de tu anuncio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Título del anuncio *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ej: Busco compañero de depto en Posadas Centro"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                <p className="text-gray-500 text-sm mt-1">{formData.title.length}/100 caracteres</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="role">¿Qué estás buscando? *</Label>
                  <Select value={formData.role} onValueChange={(value: any) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUSCO">Busco habitación/compañeros</SelectItem>
                      <SelectItem value="OFREZCO">Ofrezco habitación/casa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="roomType">Tipo de habitación *</Label>
                  <Select value={formData.roomType} onValueChange={(value) => handleInputChange('roomType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVADA">Habitación privada</SelectItem>
                      <SelectItem value="COMPARTIDA">Habitación compartida</SelectItem>
                      <SelectItem value="ESTUDIO">Estudio/monoambiente</SelectItem>
                      <SelectItem value="CASA_COMPLETA">Casa completa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <Label htmlFor="neighborhood">Barrio</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Ej: Centro, Villa Bonita..."
                  />
                </div>

                <div>
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Tu edad"
                  />
                </div>
              </div>

              {formData.role === 'OFREZCO' && (
                <div>
                  <Label htmlFor="price">Precio mensual (ARS) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="80000"
                    className={errors.price ? 'border-red-500' : ''}
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                </div>
              )}

              {formData.role === 'BUSCO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="budgetMin">Presupuesto mínimo (ARS) *</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      min="0"
                      value={formData.budgetMin}
                      onChange={(e) => handleInputChange('budgetMin', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="50000"
                      className={errors.budgetMin ? 'border-red-500' : ''}
                    />
                    {errors.budgetMin && <p className="text-red-500 text-sm mt-1">{errors.budgetMin}</p>}
                  </div>

                  <div>
                    <Label htmlFor="budgetMax">Presupuesto máximo (ARS) *</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      min="0"
                      value={formData.budgetMax}
                      onChange={(e) => handleInputChange('budgetMax', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="150000"
                      className={errors.budgetMax ? 'border-red-500' : ''}
                    />
                    {errors.budgetMax && <p className="text-red-500 text-sm mt-1">{errors.budgetMax}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="bio">Cuéntanos sobre ti *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Describe tu personalidad, estilo de vida, qué buscas en un compañero de casa..."
                  rows={4}
                  className={errors.bio ? 'border-red-500' : ''}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
                  <p className="text-gray-500 text-sm ml-auto">
                    {formData.bio.length}/1000 caracteres
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferencias */}
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Convivencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="petPref">Mascotas</Label>
                  <Select value={formData.petPref} onValueChange={(value) => handleInputChange('petPref', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SI_PET">Acepto mascotas</SelectItem>
                      <SelectItem value="NO_PET">No acepto mascotas</SelectItem>
                      <SelectItem value="INDIFERENTE">Me es indiferente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="smokePref">Fumar</Label>
                  <Select value={formData.smokePref} onValueChange={(value) => handleInputChange('smokePref', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FUMADOR">Soy fumador</SelectItem>
                      <SelectItem value="NO_FUMADOR">No fumo</SelectItem>
                      <SelectItem value="INDIFERENTE">Me es indiferente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="diet">Dieta</Label>
                  <Select value={formData.diet} onValueChange={(value) => handleInputChange('diet', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NINGUNA">Sin restricciones</SelectItem>
                      <SelectItem value="VEGETARIANO">Vegetariano</SelectItem>
                      <SelectItem value="VEGANO">Vegano</SelectItem>
                      <SelectItem value="CELIACO">Celíaco</SelectItem>
                      <SelectItem value="OTRO">Otras restricciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="scheduleNotes">Horarios y rutina</Label>
                <Textarea
                  id="scheduleNotes"
                  value={formData.scheduleNotes}
                  onChange={(e) => handleInputChange('scheduleNotes', e.target.value)}
                  placeholder="Ej: Trabajo de 9 a 17, estudio de noche..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selecciona las características que te describen</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.tags.includes(tag)) {
                          removeTag(tag)
                        } else {
                          addTag(tag)
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="newTag">Agregar característica personalizada</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="newTag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ej: gamer, cocinero..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(newTag)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addTag(newTag)}
                    disabled={!newTag}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div>
                  <Label>Tus características seleccionadas:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="default" className="cursor-pointer">
                        {tag}
                        <X
                          className="w-3 h-3 ml-1"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="photoUpload">Subir fotos</Label>
                <div className="mt-1">
                  <input
                    id="photoUpload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImages || formData.photos.length >= 5}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {uploadingImages ? 'Subiendo imágenes...' : `Máximo 5 fotos (${formData.photos.length}/5)`}
                </p>
              </div>

              {formData.photos.length > 0 && (
                <div>
                  <Label>Fotos agregadas:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removePhoto(photo)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-4 justify-end">
            <Link href="/comunidad/mis-publicaciones" prefetch={false}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading || uploadingImages}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
