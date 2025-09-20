"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useMessages } from '@/contexts/MessagesContext'
import toast from 'react-hot-toast'

interface SendMessageButtonProps {
  propertyId: string
  propertyTitle: string
  ownerId: string
  ownerName?: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
}

export function SendMessageButton({
  propertyId,
  propertyTitle,
  ownerId,
  ownerName,
  className = '',
  variant = 'default',
  size = 'default'
}: SendMessageButtonProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useSupabaseAuth()
  const { createOrOpenConversation, setActiveConversation } = useMessages()
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    // Verificar autenticación
    if (!isAuthenticated || !user) {
      toast.error('Inicia sesión para enviar un mensaje')
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    // Verificar que no sea el mismo usuario
    if (user.id === ownerId) {
      toast.error('No puedes enviarte un mensaje a ti mismo')
      return
    }

    setIsLoading(true)

    try {
      // Crear o abrir conversación existente
      const conversationId = await createOrOpenConversation(ownerId, propertyId)
      
      if (conversationId) {
        // Establecer conversación activa
        setActiveConversation(conversationId)
        
        // Mostrar mensaje de éxito
        toast.success(`Conversación iniciada con ${ownerName || 'el propietario'}`)
        
        // Redirigir a la página de mensajes
        router.push('/messages')
      } else {
        throw new Error('No se pudo crear la conversación')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error('Error al iniciar la conversación. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSendMessage}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={`${className} ${
        variant === 'default' 
          ? 'bg-rose-500 hover:bg-rose-600 text-white' 
          : ''
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Iniciando...
        </>
      ) : (
        <>
          <MessageCircle className="w-4 h-4 mr-2" />
          Enviar mensaje
        </>
      )}
    </Button>
  )
}

export default SendMessageButton
