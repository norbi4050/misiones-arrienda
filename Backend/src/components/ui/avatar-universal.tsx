'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { withVersion } from '@/lib/url'

interface AvatarUniversalProps {
  userId?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackText?: string
  showUpload?: boolean
  onAvatarChange?: (newAvatarUrl: string) => void
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-lg'
}

export default function AvatarUniversal({
  userId,
  size = 'md',
  className = '',
  fallbackText,
  showUpload = false,
  onAvatarChange
}: AvatarUniversalProps) {
  const { user } = useSupabaseAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Usar userId prop o userId del usuario autenticado
  const targetUserId = userId || user?.id

  // Generar texto de fallback
  const getFallbackText = () => {
    if (fallbackText) return fallbackText.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return '?'
  }

  // Cargar avatar del usuario
  const loadAvatar = async () => {
    if (!targetUserId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/users/avatar?userId=${targetUserId}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // FUENTE ÚNICA: user_profiles.avatar_url (con fallback a users.profile_image/avatar/logo_url)
        const baseUrl = data?.url || '';
        const v = data?.v || 0;
        const src = withVersion(baseUrl, v);
        
        if (baseUrl) {
          setAvatarUrl(src)
        } else {
          // Sin avatar válido → usar fallback ui-avatars
          setAvatarUrl(null)
        }
      } else if (response.status === 404) {
        // ✅ FIX: 404 es normal cuando el usuario no tiene avatar - no es un error
        setAvatarUrl(null)
        setError(null)  // No mostrar error al usuario
      } else {
        // Solo loggear errores HTTP reales (500, 403, etc.)
        console.error('Error loading avatar:', response.status)
        setError(null)  // ✅ FIX: No mostrar error visual al usuario
        setAvatarUrl(null)
      }
    } catch (err) {
      console.error('Error loading avatar:', err)
      setError(null)  // ✅ FIX: No mostrar error visual
      setAvatarUrl(null)
    } finally {
      setLoading(false)
    }
  }

  // Subir nuevo avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !targetUserId) return

    // Validar tamaño del archivo (2MB = 2 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `Archivo muy grande. Máximo: 2MB. Tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      setError(errorMsg)
      // Limpiar error después de 5 segundos
      setTimeout(() => setError(null), 5000)
      return
    }

    try {
      setLoading(true)
      setError(null) // Limpiar errores previos

      // Crear FormData para subir archivo
      const formData = new FormData()
      formData.append('file', file)

      // Subir archivo al endpoint correcto (maneja upload + update en una sola llamada)
      const uploadResponse = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!uploadResponse.ok) {
        throw new Error('Error al subir archivo')
      }

      const uploadData = await uploadResponse.json()

      if (uploadData.success && uploadData.url) {
        // FIX: Agregar timestamp a la URL para forzar refresh del navegador
        const urlWithVersion = uploadData.v
          ? withVersion(uploadData.url, uploadData.v)
          : `${uploadData.url}?t=${Date.now()}`

        setAvatarUrl(urlWithVersion)
        onAvatarChange?.(uploadData.url)

        // Recargar avatar después de un delay pequeño para asegurar que el servidor tiene la nueva versión
        setTimeout(async () => {
          await loadAvatar()
        }, 500)
      }

    } catch (err) {
      console.error('Error uploading avatar:', err)
      setError('Error al subir avatar')
    } finally {
      setLoading(false)
    }
  }

  // Cargar avatar al montar componente
  useEffect(() => {
    loadAvatar()
  }, [targetUserId])

  const baseClasses = `
    relative inline-flex items-center justify-center 
    rounded-full bg-gray-300 overflow-hidden
    ${sizeClasses[size]} ${className}
  `

  if (loading) {
    return (
      <div className={`${baseClasses} animate-pulse bg-gray-200`}>
        <div className="w-full h-full bg-gray-300 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className={baseClasses}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            className="object-cover"
            sizes={`${sizeClasses[size].split(' ')[0].replace('w-', '')}px`}
            unoptimized
            priority
            onError={() => {
              // ✅ FIX: No mostrar error visual, solo usar fallback
              setAvatarUrl(null)
            }}
          />
        ) : (
          <span className="font-medium text-gray-600 select-none">
            {getFallbackText()}
          </span>
        )}
      </div>

      {/* Botón de upload si está habilitado */}
      {showUpload && targetUserId === user?.id && (
        <div className="absolute -bottom-1 -right-1">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={loading}
            />
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-600 transition-colors">
              📷
            </div>
          </label>
        </div>
      )}

      {/* Mostrar errores de validación o upload */}
      {error && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}

// Hook personalizado para usar el avatar
export function useAvatar(userId?: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAvatar = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/users/avatar?userId=${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Nueva API devuelve { url, v } o { avatarUrl, ... } (backward compatibility)
        const baseUrl = data?.url || data?.avatarUrl || '';
        const v = data?.v || 0;
        const src = withVersion(baseUrl, v);
        
        if (baseUrl) {
          setAvatarUrl(src)
        } else {
          // Sin avatar, pero no es error
          setAvatarUrl(null)
        }
      } else if (response.status === 404) {
        // ✅ FIX: 404 es normal cuando el usuario no tiene avatar
        setAvatarUrl(null)
      } else {
        // Solo loggear errores HTTP reales (500, 403, etc.)
        console.error('Error loading avatar:', response.status)
        setAvatarUrl(null)
      }
    } catch (err) {
      console.error('Error loading avatar:', err)
      setAvatarUrl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvatar()
  }, [userId])

  return { avatarUrl, loading, refetch: loadAvatar }
}
