'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload, Building2, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LogoUploaderProps {
  currentLogoUrl?: string | null
  onUploadSuccess: (logoUrl: string) => void
  onDeleteSuccess: () => void
  disabled?: boolean
  className?: string
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

export function LogoUploader({
  currentLogoUrl,
  onUploadSuccess,
  onDeleteSuccess,
  disabled = false,
  className
}: LogoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validar archivo
  const validateFile = useCallback((file: File): string | null => {
    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Solo se permiten archivos PNG, JPG o JPEG'
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return `El archivo es muy grande (${sizeMB}MB). Tamaño máximo: 2MB`
    }

    return null
  }, [])

  // Manejar selección de archivo
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    
    if (error) {
      toast.error(error)
      return
    }

    // Crear preview
    const preview = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(preview)
  }, [validateFile])

  // Manejar cambio de input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setDragActive(true)
    }
  }, [disabled])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [disabled, handleFileSelect])

  // Subir logo
  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/inmobiliarias/logo', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Error al subir el logo')
      }

      // Limpiar preview local
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setSelectedFile(null)
      setPreviewUrl(null)

      // Notificar éxito
      toast.success('Logo subido exitosamente')
      onUploadSuccess(data.logoUrl)

    } catch (error) {
      console.error('Error subiendo logo:', error)
      toast.error(error instanceof Error ? error.message : 'Error al subir el logo')
    } finally {
      setIsUploading(false)
    }
  }

  // Eliminar logo
  const handleDelete = async () => {
    if (!currentLogoUrl) return

    if (!confirm('¿Estás seguro de que deseas eliminar el logo?')) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch('/api/inmobiliarias/logo', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el logo')
      }

      toast.success('Logo eliminado exitosamente')
      onDeleteSuccess()

    } catch (error) {
      console.error('Error eliminando logo:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el logo')
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancelar selección
  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  // Abrir selector de archivos
  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  // Limpiar preview al desmontar
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Si hay un logo seleccionado para subir
  if (selectedFile && previewUrl) {
    return (
      <div className={cn("w-full", className)}>
        <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
          <div className="flex items-start space-x-4">
            {/* Preview */}
            <div className="flex-shrink-0">
              <img
                src={previewUrl}
                alt="Preview del logo"
                className="w-32 h-32 object-contain bg-white rounded-lg border-2 border-gray-200"
              />
            </div>

            {/* Información */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Logo seleccionado
              </h4>
              <p className="text-sm text-gray-600 truncate mb-1">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              {/* Botones */}
              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar y Subir
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isUploading}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Usa un logo cuadrado con fondo transparente para mejores resultados
        </p>
      </div>
    )
  }

  // Si ya hay un logo subido
  if (currentLogoUrl) {
    return (
      <div className={cn("w-full", className)}>
        <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
          <div className="flex items-start space-x-4">
            {/* Logo actual */}
            <div className="flex-shrink-0">
              <img
                src={currentLogoUrl}
                alt="Logo de la empresa"
                className="w-32 h-32 object-contain bg-gray-50 rounded-lg border-2 border-gray-200"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-logo.png'
                }}
              />
            </div>

            {/* Información y acciones */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-medium text-gray-900">
                  Logo actual
                </h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Este logo se muestra en tu perfil público y en tus publicaciones
              </p>

              {/* Botones */}
              <div className="flex space-x-2">
                <Button
                  onClick={openFileDialog}
                  disabled={disabled || isDeleting}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Reemplazar Logo
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={disabled || isDeleting}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Logo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Input oculto para reemplazo */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        <p className="text-xs text-gray-500 mt-2">
          💡 Formatos: PNG, JPG, JPEG | Tamaño máximo: 2MB
        </p>
      </div>
    )
  }

  // Estado inicial: sin logo
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragActive 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400 bg-gray-50",
          disabled && "opacity-50 cursor-not-allowed"
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
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-gray-200 rounded-full">
            <Building2 className="w-8 h-8 text-gray-500" />
          </div>
          
          <div>
            <p className="text-base font-medium text-gray-900 mb-1">
              Subir logo de la empresa
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG o JPEG • Máximo 2MB
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              openFileDialog()
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Seleccionar Archivo
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-start space-x-2 text-xs text-gray-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Recomendaciones:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Usa un logo cuadrado (1:1) para mejores resultados</li>
              <li>Fondo transparente (PNG) se ve mejor</li>
              <li>Resolución mínima recomendada: 512x512px</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
