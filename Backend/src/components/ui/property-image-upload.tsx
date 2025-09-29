'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

interface PropertyImageUploadProps {
  propertyId: string
  userId?: string
  value?: string[]
  onChange?: (images: string[]) => void
  onChangeCount?: (count: number) => void
  maxImages?: number
  className?: string
  disabled?: boolean
}

// Validación client-side
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Tipo no permitido: ${file.type}. Solo se permiten: JPG, PNG, WebP` 
    }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Archivo muy grande: ${Math.round(file.size / 1024 / 1024)}MB. Máximo: 2MB` 
    }
  }
  
  return { valid: true }
}

export default function PropertyImageUpload({
  propertyId,
  userId,
  value = [],
  onChange,
  onChangeCount,
  maxImages = 8,
  className = '',
  disabled = false
}: PropertyImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentImages = value || []
  const canAddMore = currentImages.length < maxImages

  // Refresh images from server
  const refreshImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/images`)
      if (response.ok) {
        const data = await response.json()
        const images = data.images || []
        onChange?.(images)
        onChangeCount?.(images.length)
        return images
      }
      return []
    } catch (error) {
      console.error('Error refreshing images:', error)
      return []
    }
  }, [propertyId, onChange, onChangeCount])

  // Load initial images on mount and when propertyId changes
  useEffect(() => {
    if (propertyId) {
      refreshImages()
    }
  }, [propertyId, refreshImages])

  // Handle file upload
  const handleUpload = useCallback(async (files: FileList) => {
    if (!files.length || disabled) return

    // Validar archivos
    const validFiles: File[] = []
    const errors: string[] = []

    Array.from(files).forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      toast.error(`Errores de validación:\n${errors.join('\n')}`)
    }

    if (validFiles.length === 0) return

    // Verificar límite
    const totalAfterUpload = currentImages.length + validFiles.length
    if (totalAfterUpload > maxImages) {
      const allowed = maxImages - currentImages.length
      toast.error(`Solo puedes subir ${allowed} imagen(es) más. Límite: ${maxImages}`)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`${data.uploaded} imagen(es) subida(s) correctamente`)
        
        if (data.errors && data.errors.length > 0) {
          toast.error(`Algunos archivos fallaron:\n${data.errors.join('\n')}`)
        }

        // Refresh para obtener lista actualizada
        await refreshImages()
      } else {
        throw new Error(data.error || 'Error al subir imágenes')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al subir imágenes')
    } finally {
      setIsUploading(false)
    }
  }, [propertyId, currentImages.length, maxImages, disabled, refreshImages])

  // Handle file deletion
  const handleDelete = useCallback(async (imageUrl: string) => {
    if (disabled) return

    try {
      // Extraer key del URL
      const url = new URL(imageUrl.split('?')[0]) // Remover query params
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === 'property-images')
      
      if (bucketIndex === -1) {
        throw new Error('URL de imagen inválida')
      }

      const key = pathParts.slice(bucketIndex + 1).join('/')

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Imagen eliminada')
        await refreshImages()
      } else {
        throw new Error(data.error || 'Error al eliminar imagen')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar imagen')
    }
  }, [propertyId, disabled, refreshImages])

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }, [handleUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleUpload])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">Subiendo imágenes...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Arrastra imágenes aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP • Máximo 2MB • {currentImages.length}/{maxImages} imágenes
              </p>
            </div>
          )}
        </div>
      )}

      {/* Current Images Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div key={imageUrl} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={imageUrl}
                  alt={`Imagen ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback en caso de error
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-apartment-1.jpg'
                  }}
                />
                
                {/* Delete button */}
                {!disabled && (
                  <button
                    onClick={() => handleDelete(imageUrl)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Eliminar imagen"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}

                {/* Image index badge */}
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-xs bg-black bg-opacity-50 text-white">
                    {index + 1}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Messages */}
      {currentImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No hay imágenes subidas</p>
        </div>
      )}

      {currentImages.length >= maxImages && (
        <div className="flex items-center justify-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
          <span className="text-sm text-amber-700">
            Has alcanzado el límite de {maxImages} imágenes
          </span>
        </div>
      )}

      {/* Manual Upload Button (alternative to drag & drop) */}
      {canAddMore && !isUploading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Seleccionar imágenes
          </Button>
        </div>
      )}
    </div>
  )
}
