"use client"

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import React from 'react'
import { ImageUploadUniversal } from './image-upload-universal'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  className?: string
  disabled?: boolean
  showPreview?: boolean
  uploadText?: string
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = '',
  disabled = false,
  showPreview = true,
  uploadText = 'Subir imágenes'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Validar tipo de archivo
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no válido. Solo se permiten: ${acceptedTypes.join(', ')}`
    }

    // Validar tamaño
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      return `El archivo es muy grande. Máximo ${maxSizeMB}MB permitido.`
    }

    return null
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const processFiles = async (files: FileList) => {
    if (disabled) return

    const fileArray = Array.from(files)

    // Verificar límite de imágenes
    if (value.length + fileArray.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`)
      return
    }

    setIsUploading(true)

    try {
      const newImages: string[] = []

      for (const file of fileArray) {
        // Validar archivo
        const error = validateFile(file)
        if (error) {
          toast.error(error)
          continue
        }

        // Convertir a base64 para preview inmediato
        const base64 = await convertToBase64(file)
        newImages.push(base64)
      }

      if (newImages.length > 0) {
        onChange([...value, ...newImages])
        toast.success(`${newImages.length} imagen(es) agregada(s)`)
      }
    } catch (error) {
      console.error('Error processing files:', error)
      toast.error('Error al procesar las imágenes')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [value, maxImages, disabled])

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index)
    onChange(newImages)
    toast.success('Imagen eliminada')
  }

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Procesando imágenes...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              {uploadText}
            </p>
            <p className="text-xs text-gray-500">
              Arrastra y suelta o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Máximo {maxImages} imágenes, {maxSizeMB}MB cada una
            </p>
          </div>
        )}
      </div>

      {/* Image Previews */}
      {showPreview && value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Imágenes seleccionadas ({value.length}/{maxImages})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imageUrl}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEg2M0M2MS44OTU0IDc0IDYxIDc0Ljg5NTQgNjEgNzZWMTI0QzYxIDEyNS4xMDUgNjEuODk1NCAxMjYgNjMgMTI2SDEzN0MxMzguMTA1IDEyNiAxMzkgMTI1LjEwNSAxMzkgMTI0Vjc2QzEzOSA3NC44OTU0IDEzOC4xMDUgNzQgMTM3IDc0SDExM00xMTMgNzRWNjhDMTEzIDY2Ljg5NTQgMTEyLjEwNSA2NiAxMTEgNjZIODlDODcuODk1NCA2NiA4NyA2Ni44OTU0IDg3IDY4Vjc0TTExMyA3NEg4N00xMDAgMTEwQzEwNS41MjMgMTEwIDExMCAxMDUuNTIzIDExMCAxMDBDMTEwIDk0LjQ3NzIgMTA1LjUyMyA5MCAxMDAgOTBDOTQuNDc3MiA5MCA5MCA5NC40NzcyIDkwIDEwMEM5MCAxMDUuNTIzIDk0LjQ3NzIgMTEwIDEwMCAxMTBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
                    }}
                  />
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Image number */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {value.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-sm text-gray-600">
            {value.length} de {maxImages} imágenes
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onChange([])
              toast.success('Todas las imágenes eliminadas')
            }}
            disabled={disabled}
          >
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  )
}

// Componente específico para foto de perfil
interface ProfileImageUploadProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
  className?: string
  userId: string
}

export function ProfileImageUpload({
  value,
  onChange,
  disabled = false,
  className = '',
  userId
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const handleUploadComplete = async (urls: string[]) => {
    if (urls.length > 0) {
      const imageUrl = urls[0]
      const oldAvatarUrl = value // Store the current avatar URL before updating

      try {
        // Make PATCH request to /api/users/profile
        const response = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profileImage: imageUrl }),
        })

        if (response.ok) {
          onChange(imageUrl)
          toast.success('✅ Avatar guardado')

          // Clean up old avatar from storage if it exists
          if (oldAvatarUrl) {
            try {
              // Extract file path from Supabase URL
              // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[userId]/[filename]
              const urlParts = oldAvatarUrl.split('/storage/v1/object/public/avatars/')
              if (urlParts.length === 2) {
                const filePath = urlParts[1] // This will be [userId]/[filename]

                const { error } = await supabase.storage
                  .from('avatars')
                  .remove([filePath])

                if (error) {
                  console.error('Error deleting old avatar:', error)
                } else {
                  }
              }
            } catch (deleteError) {
              console.error('Error during old avatar cleanup:', deleteError)
            }
          }

          // Refresh the page to update header avatar
          router.refresh()
        } else {
          throw new Error('Error al guardar el avatar')
        }
      } catch (error) {
        console.error('Error saving profile image:', error)
        toast.error('Error al guardar el avatar')
      }
    }
    setUploading(false)
  }

  const handleUploadError = (error: string) => {
    toast.error(error)
    setUploading(false)
  }

  return (
    <div className={className}>
      <ImageUploadUniversal
        bucket="avatars"
        userId={userId}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        maxFiles={1}
        maxSizeMB={2}
        acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
        multiple={false}
        showPreview={true}
        existingImages={value ? [value] : []}
      />
    </div>
  )
}
