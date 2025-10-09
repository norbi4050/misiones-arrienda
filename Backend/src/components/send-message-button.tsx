'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useMessages } from '@/contexts/MessagesContext'

interface SendMessageButtonProps {
  propertyId: string
  propertyOwnerId: string
  propertyTitle: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export function SendMessageButton({
  propertyId,
  propertyOwnerId,
  propertyTitle,
  className = '',
  size = 'lg',
  variant = 'primary'
}: SendMessageButtonProps) {
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const { createConversation } = useMessages()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSendMessage = async () => {
    // Verificar autenticación
    if (!user) {
      router.push('/login')
      return
    }

    // Prevenir auto-mensajes
    if (user.id === propertyOwnerId) {
      setError('No puedes enviarte mensajes a ti mismo')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Crear conversación usando el contexto
      const conversationId = await createConversation(
        propertyId,
        propertyOwnerId,
        `Hola, estoy interesado en la propiedad "${propertyTitle}". ¿Podrías darme más información?`
      )

      if (conversationId) {
        // Redirigir a la conversación
        router.push(`/messages/${conversationId}`)
      } else {
        throw new Error('No se pudo crear la conversación')
      }
      
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'Error al enviar mensaje')
    } finally {
      setLoading(false)
    }
  }

  // Estilos según tamaño
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  // Estilos según variante
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-blue-500 border border-blue-500'
  }

  const baseClasses = `
    font-semibold rounded-lg transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `

  return (
    <div className="space-y-2">
      <button
        onClick={handleSendMessage}
        disabled={loading || authLoading}
        className={baseClasses}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            Enviando...
          </>
        ) : (
          <>
            <span>💬</span>
            Enviar mensaje
          </>
        )}
      </button>

      {error && (
        <p className="text-red-500 text-sm text-center">
          {error}
        </p>
      )}
    </div>
  )
}
