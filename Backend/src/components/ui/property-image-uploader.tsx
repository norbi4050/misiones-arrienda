'use client'

import React, { useState, useRef, useCallback } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { Button } from './button'
import { X, Upload, Image as ImageIcon, Loader2, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from "@/utils"

interface PropertyImageUploaderProps {
  value: string[] // Array de keys de storage
  onChange: (keys: string[]) => void
  userId: string
  propertyId: string
  maxImages?: number
  className?: string
  disabled?: boolean
}

interface ImageItem {
  key: string
  url: string
  isUploading?: boolean
}

export function PropertyImageUploader({
  value = [],
  onChange,
  userId,
  propertyId,
  maxImages = 10,
  className,
  disabled = false
}: PropertyImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseBrowser()

  // Convertir keys a URLs para preview
  const imageItems: ImageItem[] = value.map(key => ({
    key,
    url: key.startsWith('http') || key.startsWith('/') 
      ? key 
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${key}`
  }))

  const validateFile = useCallback((file: File): string | null => {
    // Validar tipo
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Tipos aceptados: ${acceptedTypes.join(', ')}`
    }

    // Validar tamaño (10MB máximo)
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > 10) {
      return `El archivo es muy grande. Tamaño máximo: 10MB`
    }

    return null
  }, [])

  const uploadFile = async (file: File): Promise<string> => {
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `${userId}/${propertyId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    return filePath // Retornar la key, no la URL
  }

  const handleFiles = async (fileList: FileList) => {
    if (disabled || isUploading) return

    const files = Array.from(fileList)
    
    // Verificar límite de archivos
    if (value.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`)
      return
    }

    // Validar archivos
    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        toast.error(validationError)
        return
      }
    }

    setIsUploading(true)

    try {
      const uploadPromises = files.map(file => uploadFile(file))
      const uploadedKeys = await Promise.all(uploadPromises)
      
      // Agregar nuevas keys al array
      const newKeys = [...value, ...uploadedKeys]
      onChange(newKeys)
      
      toast.success(`${uploadedKeys.length} imagen(es) subida(s) exitosamente`)
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Error al subir las imágenes')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newKeys = value.filter((_, i) => i !== index)
    onChange(newKeys)
    toast.success('Imagen eliminada del listado')
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
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
      handleFiles(e.dataTransfer.files)
    }
  }, [value.length, maxImages, disabled, isUploading])

  const openFileDialog = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Drag and drop para reordenar
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newKeys = [...value]
    const draggedKey = newKeys[draggedIndex]
    
    // Remover el elemento arrastrado
    newKeys.splice(draggedIndex, 1)
    
    // Insertar en la nueva posición
    newKeys.splice(dropIndex, 0, draggedKey)
    
    onChange(newKeys)
    setDraggedIndex(null)
    toast.success('Orden de imágenes actualizado')
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
        )}
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
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Subiendo imágenes...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Subir imágenes de la propiedad
            </p>
            <p className="text-xs text-gray-500">
              Arrastra y suelta o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Máximo {maxImages} imágenes, 10MB cada una. JPG, PNG, WebP
            </p>
          </div>
        )}
      </div>

      {/* Image Previews with Drag & Drop */}
      {imageItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Imágenes de la propiedad ({imageItems.length}/{maxImages})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageItems.map((item, index) => (
              <div 
                key={item.key}
                className="relative group cursor-move"
                draggable={!disabled}
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDrop={(e) => handleImageDrop(e, index)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-blue-300 transition-colors">
                  <img
                    src={item.url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEg2M0M2MS44OTU0IDc0IDYxIDc0Ljg5NTQgNjEgNzZWMTI0QzYxIDEyNS4xMDUgNjEuODk1NCAxMjYgNjMgMTI2SDEzN0MxMzguMTA1IDEyNiAxMzkgMTI1LjEwNSAxMzkgMTI0Vjc2QzEzOSA3NC44OTU0IDEzOC4xMDUgNzQgMTM3IDc0SDExM00xMTMgNzRWNjhDMTEzIDY2Ljg5NTQgMTEyLjEwNSA2NiAxMTEgNjZIODlDODcuODk1NCA2NiA4NyA2Ni44OTU0IDg3IDY4Vjc0TTExMyA3NEg4N00xMDAgMTEwQzEwNS41MjMgMTEwIDExMCAxMDUuNTIzIDExMCAxMDBDMTEwIDk0LjQ3NzIgMTA1LjUyMyA5MCAxMDAgOTBDOTQuNDc3MiA5MCA5MCA5NC40NzcyIDkwIDEwMEM5MCAxMDUuNTIzIDk0LjQ3NzIgMTEwIDEwMCAxMTBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
                    }}
                  />
                </div>

                {/* Drag handle */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 text-white p-1 rounded">
                    <GripVertical className="h-3 w-3" />
                  </div>
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
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>

                {/* Primera imagen badge */}
                {index === 0 && (
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado sin imágenes */}
      {imageItems.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">Sin imágenes disponibles aún</p>
          <p className="text-xs">Agrega fotos para mostrar tu propiedad</p>
        </div>
      )}

      {/* Quick Actions */}
      {imageItems.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t">
          <p className="text-sm text-gray-600">
            {imageItems.length} de {maxImages} imágenes
          </p>
          <div className="flex gap-2">
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
        </div>
      )}

      {/* Instrucciones de uso */}
      {imageItems.length > 1 && (
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          💡 <strong>Tip:</strong> Arrastra las imágenes para cambiar el orden. La primera imagen será la principal.
        </div>
      )}
    </div>
  )
}
