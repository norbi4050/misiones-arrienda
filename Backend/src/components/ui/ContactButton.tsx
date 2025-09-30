'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createBrowserSupabase } from '@/lib/supabase/browser'

interface ContactButtonProps {
  propertyId: string
  ownerId: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
}

export default function ContactButton({
  propertyId,
  ownerId,
  className = '',
  variant = 'default',
  size = 'default'
}: ContactButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth.getUser().then(({ data }: any) => {
      setCurrentUserId(data.user?.id || null)
    })
  }, [])

  // Si el usuario actual es el dueño, no mostrar el botón
  if (currentUserId && currentUserId === ownerId) {
    return (
      <div className={`text-sm text-gray-600 italic ${className}`}>
        Este es tu anuncio
      </div>
    )
  }

  const handleContact = async () => {
    setIsLoading(true)
    
    try {
      // Crear/abrir hilo usando el nuevo contrato
      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          propertyId, 
          toUserId: ownerId
        })
      })

      if (response.status === 401) {
        toast.error('Iniciá sesión para enviar mensajes')
        router.push('/login')
        return
      }

      if (!response.ok) {
        toast.error('Error al crear conversación')
        return
      }

      const data = await response.json()
      const threadId = data.threadId

      // Navegar al hilo de mensajes
      router.push(`/messages?thread=${threadId}`)

    } catch (error) {
      console.error('Error creating thread:', error)
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleContact}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <Send className="h-4 w-4 mr-2" />
      {isLoading ? 'Conectando...' : 'Contactar'}
    </Button>
  )
}
