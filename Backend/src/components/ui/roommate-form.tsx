'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Eye, Upload, Calendar, MapPin, Home, DollarSign, FileText, Users } from 'lucide-react'
import { roommateFormSchema, validatePublishReady } from '@/lib/validations/roommate'
import { RoommateFormData, ROOMMATE_CONSTANTS } from '@/types/roommate'

interface RoommateFormProps {
  initialData?: Partial<RoommateFormData>
  onSubmit: (data: RoommateFormData) => Promise<void>
  onSaveDraft?: (data: RoommateFormData) => Promise<void>
  onPublish?: (data: RoommateFormData) => Promise<void>
  loading?: boolean
  mode?: 'create' | 'edit'
  className?: string
}

export default function RoommateForm({
  initialData,
  onSubmit,
  onSaveDraft,
  onPublish,
  loading = false,
  mode = 'create',
  className = ''
}: RoommateFormProps) {

  const [publishValidation, setPublishValidation] = useState({
    isReady: false,
    missingFields: [] as string[],
    warnings: [] as string[]
  })

  // Configurar React Hook Form con Zod
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
    reset
  } = useForm<RoommateFormData>({
    resolver: zodResolver(roommateFormSchema),
    defaultValues: {
      title: '',
      description: '',
      city: '',
      province: 'Misiones',
      roomType: 'PRIVATE',
      monthlyRent: 0,
      availableFrom: new Date().toISOString().split('T')[0],
      preferences: '',
      images: [],
      imagesUrls: [],
      status: 'DRAFT',
      ...initialData
    },
    mode: 'onChange'
  })

  // Observar cambios en el formulario para validación de publish
  const watchedValues = watch()

  useEffect(() => {
    const validation = validatePublishReady(watchedValues)
    setPublishValidation(validation)
  }, [watchedValues])

  // Resetear formulario cuando cambian los datos iniciales
  useEffect(() => {
    if (initialData) {
      reset({
        title: '',
        description: '',
        city: '',
        province: 'Misiones',
        roomType: 'PRIVATE',
        monthlyRent: 0,
        availableFrom: new Date().toISOString().split('T')[0],
        preferences: '',
        images: [],
        imagesUrls: [],
        status: 'DRAFT',
        ...initialData
      })
    }
  }, [initialData, reset])

  // Opciones de ciudades principales de Misiones
  const cities = [
    'Posadas',
    'Puerto Iguazú',
    'Oberá',
    'Eldorado',
    'Apóstoles',
    'Leandro N. Alem',
    'Puerto Rico',
    'Montecarlo',
    'Jardín América',
    'Wanda'
  ]

  // Manejar envío del formulario
  const handleFormSubmit = async (data: RoommateFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Error enviando formulario:', error)
    }
  }

  // Manejar guardar como borrador
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return
    
    try {
      const data = watchedValues
      await onSaveDraft({ ...data, status: 'DRAFT' })
    } catch (error) {
      console.error('Error guardando borrador:', error)
    }
  }

  // Manejar publicar
  const handlePublish = async () => {
    if (!onPublish || !publishValidation.isReady) return
    
    try {
      const data = watchedValues
      await onPublish({ ...data, status: 'PUBLISHED' })
    } catch (error) {
      console.error('Error publicando:', error)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            {mode === 'create' ? 'Crear Post de Roommate' : 'Editar Post de Roommate'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Completa la información para encontrar tu roommate ideal
          </p>
        </div>

        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Información Básica
          </h3>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="Ej: Busco roommate para departamento en centro de Posadas"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {watchedValues.title?.length || 0}/{ROOMMATE_CONSTANTS.TITLE_MAX_LENGTH} caracteres
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describe el lugar, tus preferencias, estilo de vida, etc."
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {watchedValues.description?.length || 0}/{ROOMMATE_CONSTANTS.DESCRIPTION_MAX_LENGTH} caracteres
            </p>
          </div>
        </div>

        {/* Ubicación */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Ubicación
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad *
              </label>
              <select
                {...register('city')}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Seleccionar ciudad</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <select
                {...register('province')}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="Misiones">Misiones</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detalles de la habitación */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Home className="w-5 h-5 mr-2" />
            Detalles de la Habitación
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de habitación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Habitación *
              </label>
              <select
                {...register('roomType')}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="PRIVATE">Habitación Privada</option>
                <option value="SHARED">Habitación Compartida</option>
              </select>
              {errors.roomType && (
                <p className="mt-1 text-sm text-red-600">{errors.roomType.message}</p>
              )}
            </div>

            {/* Renta mensual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Renta Mensual (ARS) *
              </label>
              <input
                {...register('monthlyRent', { valueAsNumber: true })}
                type="number"
                min="0"
                step="1000"
                placeholder="50000"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              {errors.monthlyRent && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyRent.message}</p>
              )}
            </div>

            {/* Fecha disponible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Disponible Desde *
              </label>
              <input
                {...register('availableFrom')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              {errors.availableFrom && (
                <p className="mt-1 text-sm text-red-600">{errors.availableFrom.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preferencias */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Preferencias y Estilo de Vida
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferencias (opcional)
            </label>
            <textarea
              {...register('preferences')}
              rows={3}
              placeholder="Ej: No fumador, mascotas permitidas, horarios flexibles, estudiante/profesional, etc."
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            {errors.preferences && (
              <p className="mt-1 text-sm text-red-600">{errors.preferences.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {watchedValues.preferences?.length || 0}/{ROOMMATE_CONSTANTS.PREFERENCES_MAX_LENGTH} caracteres
            </p>
          </div>
        </div>

        {/* Estado de publicación */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Estado de Publicación</h4>
          
          {publishValidation.isReady ? (
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium">Listo para publicar</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium">Faltan campos obligatorios</span>
              </div>
              {publishValidation.missingFields.length > 0 && (
                <ul className="text-xs text-gray-600 ml-4 space-y-1">
                  {publishValidation.missingFields.map((field, index) => (
                    <li key={index}>• {field}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {publishValidation.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-gray-700">Recomendaciones:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {publishValidation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          {/* Guardar como borrador */}
          {onSaveDraft && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading || !isDirty}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Borrador
            </button>
          )}

          {/* Guardar cambios */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          {/* Publicar */}
          {onPublish && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading || !publishValidation.isReady}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              {loading ? 'Publicando...' : 'Guardar y Publicar'}
            </button>
          )}
        </div>

        {/* Información de ayuda */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Consejos para un mejor post</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Usa un título descriptivo que incluya la ubicación</li>
            <li>• Describe claramente el tipo de habitación y servicios incluidos</li>
            <li>• Menciona tus preferencias sobre estilo de vida y horarios</li>
            <li>• Agrega fotos de la habitación y espacios comunes</li>
            <li>• Sé honesto sobre el precio y gastos adicionales</li>
          </ul>
        </div>
      </form>
    </div>
  )
}

// Componente de preview del formulario
interface RoommateFormPreviewProps {
  data: RoommateFormData
  className?: string
}

export function RoommateFormPreview({ data, className = '' }: RoommateFormPreviewProps) {
  
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateStr))
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-blue-600" />
          Vista Previa
        </h3>
        <p className="text-sm text-gray-600">Así se verá tu post para otros usuarios</p>
      </div>

      <div className="space-y-4">
        {/* Título */}
        <h2 className="text-xl font-bold text-gray-900">{data.title || 'Sin título'}</h2>

        {/* Información clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.monthlyRent ? formatPrice(data.monthlyRent) : '$0'}
            </div>
            <div className="text-sm text-gray-600">por mes</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {data.roomType === 'PRIVATE' ? 'Privada' : 'Compartida'}
            </div>
            <div className="text-sm text-gray-600">tipo de habitación</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {data.city || 'Sin ubicación'}
            </div>
            <div className="text-sm text-gray-600">{data.province}</div>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
          <p className="text-gray-700 whitespace-pre-wrap">
            {data.description || 'Sin descripción'}
          </p>
        </div>

        {/* Fecha disponible */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Disponibilidad</h4>
          <p className="text-gray-700">
            Disponible desde {data.availableFrom ? formatDate(data.availableFrom) : 'fecha no especificada'}
          </p>
        </div>

        {/* Preferencias */}
        {data.preferences && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Preferencias</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{data.preferences}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook para manejar el estado del formulario
export function useRoommateForm(initialData?: Partial<RoommateFormData>) {
  const [formData, setFormData] = useState<RoommateFormData>({
    title: '',
    description: '',
    city: '',
    province: 'Misiones',
    roomType: 'PRIVATE',
    monthlyRent: 0,
    availableFrom: new Date().toISOString().split('T')[0],
    preferences: '',
    images: [],
    imagesUrls: [],
    status: 'DRAFT',
    ...initialData
  })

  const [isDirty, setIsDirty] = useState(false)
  const [isValid, setIsValid] = useState(false)

  const updateFormData = (updates: Partial<RoommateFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      city: '',
      province: 'Misiones',
      roomType: 'PRIVATE',
      monthlyRent: 0,
      availableFrom: new Date().toISOString().split('T')[0],
      preferences: '',
      images: [],
      imagesUrls: [],
      status: 'DRAFT',
      ...initialData
    })
    setIsDirty(false)
  }

  // Validar formulario
  useEffect(() => {
    const validation = roommateFormSchema.safeParse(formData)
    setIsValid(validation.success)
  }, [formData])

  return {
    formData,
    updateFormData,
    resetForm,
    isDirty,
    isValid
  }
}
