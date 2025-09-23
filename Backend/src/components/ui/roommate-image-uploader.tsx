'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, GripVertical, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { keysToPublicUrls } from '@/lib/community-images'

interface RoommateImageUploaderProps {
  postId: string
  userId: string
  value: string[] // keys actuales en images_urls
  onChange: (keys: string[]) => void // devuelve las keys en el nuevo orden
  disabled?: boolean
  className?: string
}

interface UploadError {
  file: string
  message: string
}

export default function RoommateImageUploader({
  postId,
  userId,
  value,
  onChange,
  disabled = false,
  className = ''
}: RoommateImageUploaderProps) {

  const [uploading, setUploading] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Configuración de validación
  const MAX_IMAGES = 10
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  // Validar archivo
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Formato no soportado. Use: ${ACCEPTED_TYPES.join(', ')}`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `Archivo muy grande. Máximo 5MB permitido`
    }

    return null
  }

  // Generar nombre de archivo único
  const generateFileName = (originalName: string): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
    
    // Evitar .jpg.jpg
    const cleanExtension = extension === 'jpeg' ? 'jpg' : extension
    return `${timestamp}-${random}.${cleanExtension}`
  }

  // Subir archivo a Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileName = generateFileName(file.name)

      // Crear cliente Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase.storage
        .from('community-images')
        .upload(`${userId}/${postId}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error subiendo archivo:', error)
        return null
      }

      // Retornar la key completa con prefijo community-images
      return `community-images/${data.path}`

    } catch (error) {
      console.error('Error en upload:', error)
      return null
    }
  }

  // Procesar archivos seleccionados
  const processFiles = async (files: FileList | File[]) => {
    if (disabled || uploading) return

    const fileArray = Array.from(files)

    // Verificar límite de imágenes
    if (value.length + fileArray.length > MAX_IMAGES) {
      setUploadErrors([{
        file: 'Límite excedido',
        message: `Máximo ${MAX_IMAGES} imágenes permitidas. Tienes ${value.length}, intentas subir ${fileArray.length}`
      }])
      return
    }

    setUploading(true)
    setUploadErrors([])

    const newKeys: string[] = []
    const errors: UploadError[] = []

    for (const file of fileArray) {
      // Validar archivo
      const validationError = validateFile(file)
      if (validationError) {
        errors.push({
          file: file.name,
          message: validationError
        })
        continue
      }

      // Subir archivo
      const key = await uploadFile(file)
      if (key) {
        newKeys.push(key)
      } else {
        errors.push({
          file: file.name,
          message: 'Error al subir archivo'
        })
      }
    }

    // Actualizar estado
    if (newKeys.length > 0) {
      onChange([...value, ...newKeys])
    }

    if (errors.length > 0) {
      setUploadErrors(errors)
    }

    setUploading(false)
  }

  // Manejar selección de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Limpiar input para permitir seleccionar el mismo archivo
    e.target.value = ''
  }

  // Manejar drag & drop para upload
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  // Remover imagen
  const removeImage = (index: number) => {
    if (disabled) return
    
    const newKeys = value.filter((_, i) => i !== index)
    onChange(newKeys)
  }

  // Manejar drag & drop para reordenar
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOverReorder = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropReorder = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newKeys = [...value]
    const draggedKey = newKeys[draggedIndex]
    
    // Remover del índice original
    newKeys.splice(draggedIndex, 1)
    
    // Insertar en nuevo índice
    newKeys.splice(dropIndex, 0, draggedKey)
    
    onChange(newKeys)
    setDraggedIndex(null)
  }

  // Generar URLs públicas para preview
  const previewUrls = keysToPublicUrls(value)

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Área de upload */}
      {value.length < MAX_IMAGES && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDropFiles}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : disabled || uploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            isDragOver ? 'text-blue-500' : 'text-gray-400'
          }`} />
          
          {uploading ? (
            <div>
              <p className="text-gray-600 font-medium">Subiendo imágenes...</p>
              <div className="w-32 h-2 bg-gray-200 rounded-full mx-auto mt-2">
                <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          ) : isDragOver ? (
            <p className="text-blue-600 font-medium">Suelta las imágenes aquí</p>
          ) : (
            <div>
              <p className="text-gray-600 font-medium mb-2">
                Arrastra imágenes aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500">
                JPG, PNG, WebP • Máximo 5MB • {value.length}/{MAX_IMAGES} imágenes
              </p>
            </div>
          )}
        </div>
      )}

      {/* Errores de upload */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center text-red-800 font-medium mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            Errores de subida
          </div>
          <ul className="space-y-1">
            {uploadErrors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                <strong>{error.file}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview de imágenes */}
      {value.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Imágenes ({value.length}/{MAX_IMAGES})
            </h4>
            <p className="text-xs text-gray-500">
              Arrastra para reordenar • La primera será la portada
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((key, index) => {
              const url = previewUrls[index]
              const isFirst = index === 0

              return (
                <div
                  key={key}
                  draggable={!disabled}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOverReorder}
                  onDrop={(e) => handleDropReorder(e, index)}
                  className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden ${
                    disabled ? 'cursor-not-allowed' : 'cursor-move'
                  } ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  {/* Imagen */}
                  {url ? (
                    <img
                      src={url}
                      alt={`Roommate imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* Badge de portada */}
                  {isFirst && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Portada
                    </div>
                  )}

                  {/* Controles */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                      
                      {/* Handle para drag */}
                      {!disabled && (
                        <div className="bg-white bg-opacity-90 p-2 rounded-full cursor-move">
                          <GripVertical className="w-4 h-4 text-gray-600" />
                        </div>
                      )}

                      {/* Botón eliminar */}
                      {!disabled && (
                        <button
                          onClick={() => removeImage(index)}
                          className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 text-white p-2 rounded-full transition-all"
                          title="Eliminar imagen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Número de orden */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        // Estado sin imágenes
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin imágenes disponibles aún
          </h3>
          <p className="text-gray-600 text-sm">
            Agrega fotos de la habitación y espacios comunes para atraer más interés
          </p>
        </div>
      )}

      {/* Información de ayuda */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Consejos para mejores fotos</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• La primera imagen será la portada en el feed</li>
          <li>• Incluye fotos de la habitación, baño y espacios comunes</li>
          <li>• Usa buena iluminación natural cuando sea posible</li>
          <li>• Muestra el estado real del lugar</li>
          <li>• Arrastra las imágenes para cambiar el orden</li>
        </ul>
      </div>
    </div>
  )
}

// Componente simplificado para mostrar solo previews (sin upload)
interface RoommateImagePreviewProps {
  keys: string[]
  className?: string
}

export function RoommateImagePreview({ keys, className = '' }: RoommateImagePreviewProps) {
  const urls = keysToPublicUrls(keys)

  if (keys.length === 0) {
    return (
      <div className={`text-center py-6 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 text-sm">Sin imágenes disponibles aún</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
      {urls.map((url, index) => (
        <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={url}
            alt={`Roommate imagen ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          
          {/* Badge de portada */}
          {index === 0 && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              Portada
            </div>
          )}

          {/* Número */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  )
}

// Hook para manejar el estado del uploader
export function useRoommateImageUploader(initialKeys: string[] = []) {
  const [keys, setKeys] = useState<string[]>(initialKeys)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<UploadError[]>([])

  const updateKeys = (newKeys: string[]) => {
    setKeys(newKeys)
    setErrors([]) // Limpiar errores al actualizar
  }

  const addKey = (key: string) => {
    setKeys(prev => [...prev, key])
  }

  const removeKey = (index: number) => {
    setKeys(prev => prev.filter((_, i) => i !== index))
  }

  const reorderKeys = (fromIndex: number, toIndex: number) => {
    setKeys(prev => {
      const newKeys = [...prev]
      const [movedKey] = newKeys.splice(fromIndex, 1)
      newKeys.splice(toIndex, 0, movedKey)
      return newKeys
    })
  }

  const clearKeys = () => {
    setKeys([])
    setErrors([])
  }

  // Generar URLs para preview
  const previewUrls = keysToPublicUrls(keys)

  return {
    keys,
    previewUrls,
    uploading,
    errors,
    updateKeys,
    addKey,
    removeKey,
    reorderKeys,
    clearKeys,
    setUploading,
    setErrors
  }
}
