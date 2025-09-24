'use client'

import { useState, useRef } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface MessageComposerProps {
  conversationId: string
  onSendMessage: (content: string, type?: 'text' | 'image') => Promise<void>
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export default function MessageComposer({
  conversationId,
  onSendMessage,
  disabled = false,
  placeholder = "Escribe tu mensaje...",
  maxLength = 1000
}: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!message.trim() || sending) return

    try {
      setSending(true)
      await onSendMessage(message.trim(), 'text')
      setMessage('')
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const remainingChars = maxLength - message.length
  const isOverLimit = remainingChars < 0

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-10 w-10 p-0"
          disabled={disabled || sending}
          title="Adjuntar archivo"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || sending}
            className={`
              min-h-[40px] max-h-[120px] resize-none pr-12
              ${isOverLimit ? 'border-red-500 focus:border-red-500' : ''}
            `}
            rows={1}
          />
          
          {/* Character counter */}
          {message.length > maxLength * 0.8 && (
            <div className={`
              absolute bottom-2 right-2 text-xs
              ${isOverLimit ? 'text-red-500' : 'text-gray-400'}
            `}>
              {remainingChars}
            </div>
          )}
        </div>

        {/* Emoji button */}
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-10 w-10 p-0"
          disabled={disabled || sending}
          title="Agregar emoji"
        >
          <Smile className="h-4 w-4" />
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || sending || !message.trim() || isOverLimit}
          size="sm"
          className="shrink-0 h-10 w-10 p-0"
          title="Enviar mensaje"
        >
          <Send className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      {/* Error message for character limit */}
      {isOverLimit && (
        <div className="mt-2 text-sm text-red-500">
          El mensaje excede el límite de {maxLength} caracteres
        </div>
      )}

      {/* Typing indicator placeholder */}
      <div className="mt-2 min-h-[20px]">
        {/* Aquí se puede agregar indicador de "está escribiendo..." */}
      </div>
    </div>
  )
}

// Hook para usar el composer con realtime
export function useMessageComposer(conversationId: string) {
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true)
      // Aquí se puede enviar evento de "typing" via realtime
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      // Aquí se puede enviar evento de "stop typing" via realtime
    }, 3000)
  }

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
  }

  return {
    isTyping,
    handleTypingStart,
    handleTypingStop
  }
}
