'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import { Progress } from './progress'
import { Camera, Upload, X, AlertTriangle, Check } from 'lucide-react'
import { cn } from "@/utils"
import { useUser } from '@/contexts/UserContext'
import toast from 'react-hot-toast'

interface AvatarUploadProps {
  currentImageUrl?: string | null
  onUploadComplete?: (imageUrl: string) => void
  onUploadError?: (error: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showPreview?: boolean
}

export function AvatarUpload({
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  className,
  size = 'md',
  showPreview = true
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { refreshProfile, getAvatarUrlWithCacheBust } = useUser()

  // Configuración de tamaños
  const sizeConfig = {
    sm: { container: 'w-16 h-16', text: 'text-xs' },
    md: { container: 'w-24 h-24', text: 'text-sm' },
    lg: { container: 'w-32 h-32', text: 'text-base' }
  }

  const config = sizeConfig[size]

  const validateFile = useCallback((file: File): string | null => {
    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido. Use JPEG, PNG, WebP o GIF'
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return 'Archivo muy grande. Máximo 5MB'
    }

    return null
  }, [])

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Crear FormData
      const formData = new FormData()
      formData.append('file', file)

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      // Subir archivo
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error subiendo avatar')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error subiendo avatar')
      }

      // PASO CRÍTICO: Refrescar perfil y router después del upload exitoso (sin carreras)
      console.log('🔄 Avatar subido exitosamente, refrescando perfil...')
      await refreshProfile() // fetch sin caché del perfil
      router.refresh() // una sola vez

      // Limpiar preview
      setPreviewUrl(null)

      // Callbacks
      onUploadComplete?.(data.user?.profile_image || data.imageUrl)
      
      console.log('✅ Avatar actualizado y perfil refrescado')

    } catch (error) {
      console.error('❌ Error subiendo avatar:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      onUploadError?.(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      onUploadError?.(validationError)
      toast.error(validationError)
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Subir archivo
    uploadFile(file)
  }, [validateFile, onUploadError])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
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

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const clearPreview = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Obtener URL actual con cache-busting
  const currentAvatarUrl = getAvatarUrlWithCacheBust() || currentImageUrl
  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      {/* Área de avatar */}
      <div
        className={cn(
          "relative rounded-full border-2 border-dashed transition-all duration-200 cursor-pointer group",
          config.container,
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {/* Imagen actual o placeholder */}
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
            <Camera className="w-6 h-6 text-gray-400" />
          </div>
        )}

        {/* Overlay de hover */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>

        {/* Botón de limpiar preview */}
        {previewUrl && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearPreview()
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Indicador de éxito */}
        {uploadProgress === 100 && !isUploading && (
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      {isUploading && (
        <div className="w-full max-w-xs">
          <Progress value={uploadProgress} className="h-2" />
          <p className={cn("text-center mt-1 text-gray-600", config.text)}>
            Subiendo... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Texto de ayuda */}
      {!isUploading && (
        <div className="text-center">
          <p className={cn("text-gray-600", config.text)}>
            Haz clic o arrastra una imagen
          </p>
          <p className={cn("text-gray-400 mt-1", config.text)}>
            JPEG, PNG, WebP, GIF (máx. 5MB)
          </p>
        </div>
      )}

      {/* Botón alternativo */}
      <Button
        variant="outline"
        size="sm"
        onClick={openFileDialog}
        disabled={isUploading}
        className="mt-2"
      >
        <Camera className="w-4 h-4 mr-2" />
        Cambiar Avatar
      </Button>
    </div>
  )
}
