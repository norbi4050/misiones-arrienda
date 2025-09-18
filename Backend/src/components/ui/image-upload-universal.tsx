'use client'

import React, { useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from './button'
import { Progress } from './progress'
import { X, Upload, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react'
import { cn } from "@/utils"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface ImageUploadUniversalProps {
  bucket: 'avatars' | 'properties' | 'documents'
  userId: string
  onUploadComplete?: (urls: string[]) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  className?: string
  multiple?: boolean
  showPreview?: boolean
  existingImages?: string[]
}

interface UploadFile {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  url?: string
}

export function ImageUploadUniversal({
  bucket,
  userId,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  multiple = false,
  showPreview = true,
  existingImages = []
}: ImageUploadUniversalProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Configuración por bucket
  const bucketConfig = {
    avatars: {
      maxSizeMB: 5,
      acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      folder: `${userId}/avatar`
    },
    properties: {
      maxSizeMB: 10,
      acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      folder: `${userId}/properties`
    },
    documents: {
      maxSizeMB: 20,
      acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'],
      folder: `${userId}/documents`
    }
  }

  const config = bucketConfig[bucket]

  const validateFile = useCallback((file: File): string | null => {
    // Validar tipo
    if (!config.acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Tipos aceptados: ${config.acceptedTypes.join(', ')}`
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > config.maxSizeMB) {
      return `El archivo es muy grande. Tamaño máximo: ${config.maxSizeMB}MB`
    }

    return null
  }, [config])

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = []
    const currentFileCount = files.length + existingImages.length

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]

      // Verificar límite de archivos
      if (currentFileCount + newFiles.length >= maxFiles) {
        onUploadError?.(`Máximo ${maxFiles} archivos permitidos`)
        break
      }

      // Validar archivo
      const validationError = validateFile(file)
      if (validationError) {
        onUploadError?.(validationError)
        continue
      }

      // Crear preview
      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : ''

      newFiles.push({
        file,
        preview,
        progress: 0,
        status: 'pending'
      })
    }

    setFiles(prev => [...prev, ...newFiles])
  }, [files.length, existingImages.length, maxFiles, validateFile, onUploadError])

  const uploadFile = async (uploadFile: UploadFile, index: number): Promise<string> => {
    const { file } = uploadFile
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = bucket === 'avatars'
      ? `${userId}/avatar/${fileName}`
      : `${config.folder}/${fileName}`

    // Actualizar estado a uploading
    setFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, status: 'uploading' as const } : f
    ))

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      // Actualizar estado a completed
      setFiles(prev => prev.map((f, i) =>
        i === index ? {
          ...f,
          status: 'completed' as const,
          progress: 100,
          url: publicUrl
        } : f
      ))

      return publicUrl
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

      // Actualizar estado a error
      setFiles(prev => prev.map((f, i) =>
        i === index ? {
          ...f,
          status: 'error' as const,
          error: errorMessage
        } : f
      ))

      throw error
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    const uploadedUrls: string[] = []
    const errors: string[] = []

    try {
      // Subir archivos en paralelo
      const uploadPromises = files.map((file, index) =>
        uploadFile(file, index)
          .then(url => uploadedUrls.push(url))
          .catch(error => errors.push(error.message))
      )

      await Promise.allSettled(uploadPromises)

      if (uploadedUrls.length > 0) {
        onUploadComplete?.(uploadedUrls)
      }

      if (errors.length > 0) {
        onUploadError?.(errors.join(', '))
      }

    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Error durante la carga')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const file = newFiles[index]
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
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
  }, [handleFiles])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Área de carga */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={config.acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Upload className="w-6 h-6 text-gray-600" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              Arrastra archivos aquí o{' '}
              <button
                type="button"
                onClick={openFileDialog}
                className="text-blue-600 hover:text-blue-500 underline"
              >
                selecciona archivos
              </button>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Máximo {maxFiles} archivos, {config.maxSizeMB}MB cada uno
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tipos: {config.acceptedTypes.join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              {/* Preview o icono */}
              <div className="flex-shrink-0">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    {file.file.type.startsWith('image/') ? (
                      <ImageIcon className="w-6 h-6 text-gray-500" />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Información del archivo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>

                {/* Barra de progreso */}
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="mt-1" />
                )}

                {/* Estado */}
                {file.status === 'error' && (
                  <div className="flex items-center mt-1 text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{file.error}</span>
                  </div>
                )}

                {file.status === 'completed' && (
                  <p className="text-xs text-green-600 mt-1">✓ Subido exitosamente</p>
                )}
              </div>

              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón de carga */}
      {files.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.every(f => f.status === 'completed')}
            className="min-w-[120px]"
          >
            {isUploading ? 'Subiendo...' : 'Subir Archivos'}
          </Button>
        </div>
      )}

      {/* Imágenes existentes */}
      {showPreview && existingImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Imágenes actuales
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Imagen ${index + 1}`}
                className="w-full h-20 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
