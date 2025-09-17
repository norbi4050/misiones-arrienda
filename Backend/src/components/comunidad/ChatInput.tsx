'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Escribe un mensaje..."
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isLoading || disabled) return

    const messageToSend = message.trim()
    setMessage('')
    setIsLoading(true)

    try {
      await onSendMessage(messageToSend)
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      // Restaurar el mensaje en caso de error
      setMessage(messageToSend)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t bg-white">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        className="flex-1"
        maxLength={1000}
      />

      <Button
        type="submit"
        size="sm"
        disabled={!message.trim() || isLoading || disabled}
        className="px-3"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </form>
  )
}
