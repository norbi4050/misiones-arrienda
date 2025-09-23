'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Eye, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { roommateFormSchema, validatePublishReady, RoommateFormData } from '@/lib/validations/roommate'
import RoommateImageUploader from '@/components/ui/roommate-image-uploader'
import { keysToPublicUrls } from '@/lib/roommates-images'

interface EditRoommatePageProps {
  params: { id: string }
}

export default function EditRoommatePage({ params }: EditRoommatePageProps) {
  const router = useRouter()
  const { id } = params

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [roommate, setRoommate] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // React Hook Form con Zod
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<RoommateFormData>({
    resolver: zodResolver(roommateFormSchema),
    mode: 'onChange'
  })

  // Watch para validación en tiempo real
  const watchedData = watch()
  const publishValidation = validatePublishReady(watchedData)

  // Cargar datos del roommate
  useEffect(() => {
    const fetchRoommate = async () => {
      try {
        const response = await fetch(`/api/roommates/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Roommate no encontrado')
          } else if (response.status === 403) {
            setError('No tienes permisos para editar este roommate')
          } else {
            setError('Error al cargar roommate')
          }
          return
        }

        const data = await response.json()
        
        // Verificar que puede editar
        if (!data.canEdit) {
          setError('No tienes permisos para editar este roommate')
          return
        }

        setRoommate(data)

        // Llenar formulario
        setValue('title', data.title)
        setValue('description', data.description)
        setValue('city', data.city)
        setValue('province', data.province)
        setValue('roomType', data.roomType)
        setValue('monthlyRent', data.monthlyRent)
        setValue('availableFrom', data.availableFrom?.split('T')[0]) // Solo fecha
        setValue('preferences', data.preferences || '')
        setValue('imagesUrls', data.imagesUrls || [])
        setValue('status', data.status)

      } catch (err) {
        console.error('Error fetching roommate:', err)
        setError('Error al cargar roommate')
      } finally {
        setLoading(false)
      }
    }

    fetchRoommate()
  }, [id, setValue])

  // Manejar cambio de imágenes
  const handleImagesChange = (newKeys: string[]) => {
    setValue('imagesUrls', newKeys, { shouldDirty: true })
  }

  // Guardar cambios
  const onSubmit = async (data: RoommateFormData) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/roommates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar')
      }

      const updatedRoommate = await response.json()
      setRoommate(updatedRoommate)
      
      // Mostrar éxito
      alert('Roommate actualizado exitosamente')

    } catch (err) {
      console.error('Error saving roommate:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Publicar roommate
  const handlePublish = async () => {
    if (!publishValidation.isReady) {
      alert(`Faltan campos obligatorios: ${publishValidation.missingFields.join(', ')}`)
      return
    }

    setPublishing(true)
    setError(null)

    try {
      const response = await fetch(`/api/roommates/${id}/publish`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al publicar')
      }

      alert('Roommate publicado exitosamente')
      router.push(`/roommates/${roommate.slug || id}`)

    } catch (err) {
      console.error('Error publishing roommate:', err)
      setError(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setPublishing(false)
    }
  }

  // Despublicar roommate
  const handleUnpublish = async () => {
    setPublishing(true)
    setError(null)

    try {
      const response = await fetch(`/api/roommates/${id}/unpublish`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al despublicar')
      }

      alert('Roommate despublicado exitosamente')
      setRoommate(prev => ({ ...prev, status: 'DRAFT' }))

    } catch (err) {
      console.error('Error unpublishing roommate:', err)
      setError(err instanceof Error ? err.message : 'Error al despublicar')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando roommate...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/roommates"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Volver al Feed
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/roommates/${roommate.slug || id}`}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al detalle
            </Link>

            <div className="flex items-center space-x-3">
              {/* Estado actual */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                roommate.status === 'PUBLISHED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {roommate.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
              </span>

              {/* Preview */}
              <Link
                href={`/roommates/${roommate.slug || id}`}
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                Vista previa
              </Link>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Editar Roommate
          </h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información de tu búsqueda de roommate
          </p>
        </div>

        {/* Error global */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Información básica */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Título */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Busco roommate para departamento en centro"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </label>
                <select
                  {...register('city')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar ciudad</option>
                  <option value="Posadas">Posadas</option>
                  <option value="Eldorado">Eldorado</option>
                  <option value="Puerto Iguazú">Puerto Iguazú</option>
                  <option value="Oberá">Oberá</option>
                  <option value="Leandro N. Alem">Leandro N. Alem</option>
                </select>
                {errors.city && (
                  <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              {/* Provincia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <input
                  {...register('province')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Misiones"
                />
              </div>

              {/* Tipo de habitación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Habitación *
                </label>
                <select
                  {...register('roomType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="PRIVATE">Habitación Privada</option>
                  <option value="SHARED">Habitación Compartida</option>
                </select>
                {errors.roomType && (
                  <p className="text-red-600 text-sm mt-1">{errors.roomType.message}</p>
                )}
              </div>

              {/* Renta mensual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renta Mensual *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    {...register('monthlyRent', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="1000"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                {errors.monthlyRent && (
                  <p className="text-red-600 text-sm mt-1">{errors.monthlyRent.message}</p>
                )}
              </div>

              {/* Disponible desde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disponible Desde *
                </label>
                <input
                  {...register('availableFrom')}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.availableFrom && (
                  <p className="text-red-600 text-sm mt-1">{errors.availableFrom.message}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe el lugar, ambiente, ubicación y lo que buscas en un roommate..."
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Preferencias */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferencias (Opcional)
                </label>
                <textarea
                  {...register('preferences')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: No fumador, estudiante, profesional, mascotas permitidas, etc."
                />
                {errors.preferences && (
                  <p className="text-red-600 text-sm mt-1">{errors.preferences.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Imágenes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Imágenes</h2>
            
            <RoommateImageUploader
              postId={id}
              userId={roommate?.userId || ''}
              value={watchedData.imagesUrls || []}
              onChange={handleImagesChange}
              disabled={saving || publishing}
            />
          </div>

          {/* Estado de publicación */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estado de Publicación</h2>
            
            {/* Validación publish-ready */}
            <div className="mb-6">
              <div className={`p-4 rounded-lg border ${
                publishValidation.isReady 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    publishValidation.isReady ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className={`font-medium ${
                    publishValidation.isReady ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {publishValidation.isReady ? 'Listo para publicar' : 'Faltan campos obligatorios'}
                  </span>
                </div>
                
                {publishValidation.missingFields.length > 0 && (
                  <ul className="text-sm text-yellow-700 ml-6 list-disc">
                    {publishValidation.missingFields.map((field, index) => (
                      <li key={index}>Falta: {field}</li>
                    ))}
                  </ul>
                )}
                
                {publishValidation.warnings.length > 0 && (
                  <ul className="text-sm text-blue-700 ml-6 list-disc mt-2">
                    {publishValidation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              
              {/* Guardar borrador */}
              <button
                type="submit"
                disabled={saving || publishing || !isDirty}
                className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>

              {/* Publicar/Despublicar */}
              {roommate.status === 'DRAFT' ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!publishValidation.isReady || saving || publishing}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
                >
                  {publishing ? 'Publicando...' : 'Publicar'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={saving || publishing}
                  className="flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
                >
                  {publishing ? 'Despublicando...' : 'Despublicar'}
                </button>
              )}
            </div>
          </div>

        </form>

        {/* Sidebar de ayuda */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Consejos para tu post</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Sé específico sobre la ubicación y características del lugar</li>
            <li>• Menciona qué tipo de persona buscas como roommate</li>
            <li>• Incluye fotos reales de la habitación y espacios comunes</li>
            <li>• Actualiza la fecha de disponibilidad regularmente</li>
            <li>• Responde rápido a los mensajes para generar confianza</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
