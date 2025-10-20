'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MessageButtonClientProps {
  userId: string
  isOwnPost: boolean
}

export default function MessageButtonClient({ userId, isOwnPost }: MessageButtonClientProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendMessage = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          toUserId: userId,
          propertyId: null
        })
      })

      if (response.status === 401) {
        toast.error('Inicia sesión para enviar mensajes')
        router.push('/login')
        return
      }

      if (!response.ok) {
        const error = await response.json()

        // Manejar error específico de auto-mensaje
        if (error.error === 'SELF_MESSAGE_NOT_ALLOWED') {
          toast.error(error.message || 'No puedes enviarte mensajes a ti mismo')
          return
        }

        toast.error(error.message || 'Error al crear conversación')
        return
      }

      const data = await response.json()
      const conversationId = data.conversationId

      // Redirigir al hilo de mensajes
      router.push(`/messages/${conversationId}`)
      toast.success(data.existing ? 'Abriendo conversación' : 'Conversación creada')

    } catch (error) {
      console.error('Error al crear conversación:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (isOwnPost) {
    return (
      <div className="text-sm text-gray-600 italic text-center py-2">
        Este es tu anuncio
      </div>
    )
  }

  return (
    <Button
      onClick={handleSendMessage}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Conectando...
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
