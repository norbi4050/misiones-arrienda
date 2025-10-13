'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { analytics } from '@/lib/analytics/track'

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
    
    // ⭐ ANALYTICS: Track contact click
    try {
      analytics.contactClick(propertyId, 'message');
    } catch (e) {
      console.warn('[Analytics] contactClick failed:', e);
    }
    
    try {
      console.log('[Messages] 📤 Contactando propietario:', { ownerId, propertyId })
      
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
        console.log('[Messages] ⚠️ Usuario no autenticado, redirigiendo a login')
        toast.error('Iniciá sesión para enviar mensajes')
        router.push('/login')
        return
      }

      if (!response.ok) {
        const error = await response.json()
        console.error('[Messages] ❌ Error al crear conversación:', error)
        toast.error(error.details || 'Error al crear conversación')
        return
      }

      const data = await response.json()
      const conversationId = data.conversationId

      console.log('[Messages] ✅ Conversación creada/abierta:', conversationId)

      // ⭐ ANALYTICS: Track message sent (conversation created)
      try {
        analytics.messageSent(conversationId, propertyId);
      } catch (e) {
        console.warn('[Analytics] messageSent failed:', e);
      }

        // Navegar al hilo de mensajes
      router.push(`/messages/${conversationId}`)

    } catch (error: any) {
      console.error('[Messages] ❌ Exception creating thread:', error)
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
