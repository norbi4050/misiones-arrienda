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
import { ArrowLeft, Upload, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ProfileFormData {
  role: 'BUSCO' | 'OFREZCO' | ''
  city: string
  neighborhood: string
  budgetMin: number | ''
  budgetMax: number | ''
  bio: string
  photos: string[]
  age: number | ''
  petPref: string
  smokePref: string
  diet: string
  scheduleNotes: string
  tags: string[]
  acceptsMessages: boolean
}

const initialFormData: ProfileFormData = {
  role: '',
  city: '',
  neighborhood: '',
  budgetMin: '',
  budgetMax: '',
  bio: '',
  photos: [],
  age: '',
  petPref: 'INDIFERENTE',
  smokePref: 'INDIFERENTE',
  diet: 'NINGUNA',
  scheduleNotes: '',
  tags: [],
  acceptsMessages: true
}

const commonTags = [
  'limpio', 'ordenado', 'sociable', 'tranquilo', 'responsable',
  'estudiante', 'profesional', 'gym', 'cocinar', 'música',
  'mascotas', 'no_fiestas', 'flexible', 'puntual', 'respetuoso'
]

const cities = ['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles', 'Leandro N. Alem']

export default function PublicarPerfilPage() {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState('')
  const router = useRouter()

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
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

  const addPhoto = (url: string) => {
    if (url && !formData.photos.includes(url) && formData.photos.length < 5) {
      handleInputChange('photos', [...formData.photos, url])
    }
  }

  const removePhoto = (photoToRemove: string) => {
    handleInputChange('photos', formData.photos.filter(photo => photo !== photoToRemove))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.role) {
      newErrors.role = 'Selecciona si buscas o ofreces habitación'
    }

    if (!formData.city) {
      newErrors.city = 'La ciudad es obligatoria'
    }

    if (!formData.budgetMin || formData.budgetMin <= 0) {
      newErrors.budgetMin = 'El presupuesto mínimo es obligatorio'
    }

    if (!formData.budgetMax || formData.budgetMax <= 0) {
      newErrors.budgetMax = 'El presupuesto máximo es obligatorio'
    }

    if (formData.budgetMin && formData.budgetMax && formData.budgetMin > formData.budgetMax) {
      newErrors.budgetMax = 'El presupuesto máximo debe ser mayor al mínimo'
    }

    if (formData.age && (formData.age < 18 || formData.age > 100)) {
      newErrors.age = 'La edad debe estar entre 18 y 100 años'
    }

    if (!formData.bio || formData.bio.length < 50) {
      newErrors.bio = 'La descripción debe tener al menos 50 caracteres'
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'La descripción no puede exceder 500 caracteres'
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
        ...formData,
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
        age: formData.age ? Number(formData.age) : undefined
      }

      const response = await fetch('/api/comunidad/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        const profile = await response.json()
        router.push(`/comunidad/${profile.id}`)
      } else {
        const errorData = await response.json()
        alert('Error al crear el perfil: ' + (errorData.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error submitting profile:', error)
      alert('Error al crear el perfil. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/comunidad">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crear Perfil de Comunidad</h1>
              <p className="text-gray-600 mt-1">Completa tu perfil para encontrar compañeros de casa</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="role">¿Qué estás buscando? *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUSCO">Busco habitación/compañeros</SelectItem>
                      <SelectItem value="OFREZCO">Ofrezco habitación/casa</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                </div>

                <div>
                  <Label htmlFor="city">Ciudad *</Label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecciona tu ciudad" />
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
                    className={errors.age ? 'border-red-500' : ''}
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>
              </div>

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
                    {formData.bio.length}/500 caracteres
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
                  placeholder="Ej: Trabajo de 9 a 17, estudio de noche, entreno por las mañanas..."
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
                    placeholder="Ej: gamer, cocinero, madrugador..."
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
                <Label htmlFor="photoUrl">Agregar foto (URL)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="photoUrl"
                    placeholder="https://ejemplo.com/mi-foto.jpg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        addPhoto(input.value)
                        input.value = ''
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                      if (input?.value) {
                        addPhoto(input.value)
                        input.value = ''
                      }
                    }}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-500 text-sm mt-1">Máximo 5 fotos</p>
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

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptsMessages"
                  checked={formData.acceptsMessages}
                  onCheckedChange={(checked) => handleInputChange('acceptsMessages', checked)}
                />
                <Label htmlFor="acceptsMessages">
                  Acepto recibir mensajes de otros usuarios
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex gap-4 justify-end">
            <Link href="/comunidad">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando perfil...' : 'Crear Perfil'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
