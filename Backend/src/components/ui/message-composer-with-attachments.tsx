'use client'

import { useState, useRef } from 'react'
import { Send, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AttachmentButton, UploadQueue, useUploadQueue, type QueuedFile } from '@/components/messages'
import { createClient } from 'lib/supabase/browser'

interface MessageComposerProps {
  conversationId: string
  onSendMessage: (content: string, type?: 'text' | 'image', attachmentIds?: string[]) => Promise<void>
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  planTier?: 'free' | 'pro' | 'business'
}

export default function MessageComposerWithAttachments({
  conversationId,
  onSendMessage,
  disabled = false,
  placeholder = "Escribe tu mensaje...",
  maxLength = 1000,
  planTier = 'free'
}: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Upload queue management
  const {
    queue,
    addFiles,
    updateFile,
    removeFile,
    clearCompleted,
    hasUploading,
    allDone
  } = useUploadQueue()

  const supabase = createClient()

  // Handle file selection
  const handleFilesSelected = async (files: File[]) => {
    const newFiles = addFiles(files)
    
    // Start uploading each file
    for (const queuedFile of newFiles) {
      await uploadFile(queuedFile)
    }
  }

  // Upload a single file
  const uploadFile = async (queuedFile: QueuedFile) => {
    try {
      updateFile(queuedFile.id, { status: 'uploading', progress: 0 })

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        updateFile(queuedFile.id, { 
          status: 'error', 
          error: 'No autenticado' 
        })
        return
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('file', queuedFile.file)
      formData.append('threadId', conversationId)

      // Upload with progress simulation (real progress requires XMLHttpRequest)
      updateFile(queuedFile.id, { progress: 30 })

      const response = await fetch('/api/messages/attachments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      updateFile(queuedFile.id, { progress: 70 })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir archivo')
      }

      const data = await response.json()
      
      updateFile(queuedFile.id, { 
        status: 'done', 
        progress: 100,
        attachmentId: data.attachment.id
      })

    } catch (error) {
      console.error('Upload error:', error)
      updateFile(queuedFile.id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  // Handle send message
  const handleSend = async () => {
    if ((!message.trim() && queue.length === 0) || sending || hasUploading) return

    try {
      setSending(true)

      // Get completed attachment IDs
      const attachmentIds = queue
        .filter(f => f.status === 'done' && f.attachmentId)
        .map(f => f.attachmentId!)

      // Send message
      await onSendMessage(
        message.trim() || '📎 Archivo adjunto', 
        'text',
        attachmentIds.length > 0 ? attachmentIds : undefined
      )

      // Clear message and completed uploads
      setMessage('')
      clearCompleted()
      
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

  const handleCancelUpload = (id: string) => {
    // TODO: Implement actual upload cancellation
    removeFile(id)
  }

  const remainingChars = maxLength - message.length
  const isOverLimit = remainingChars < 0
  const canSend = (message.trim() || allDone) && !sending && !hasUploading && !isOverLimit

  return (
    <div className="border-t bg-white p-4">
      {/* Upload Queue */}
      {queue.length > 0 && (
        <div className="mb-3">
          <UploadQueue
            files={queue}
            onRemove={removeFile}
            onCancel={handleCancelUpload}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <div className="shrink-0">
          <AttachmentButton
            onFilesSelected={handleFilesSelected}
            disabled={disabled || sending || hasUploading}
            planTier={planTier}
          />
        </div>

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

        {/* Emoji button - Placeholder for future implementation */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 h-10 w-10 p-0"
          disabled={true}
          title="Emojis (próximamente)"
        >
          <Smile className="h-4 w-4 text-gray-400" />
        </Button>

        {/* Send button */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          size="sm"
          className="shrink-0 h-10 w-10 p-0"
          title={hasUploading ? "Esperando uploads..." : "Enviar mensaje"}
        >
          <Send className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      {/* Error/Warning messages */}
      {isOverLimit && (
        <div className="mt-2 text-sm text-red-500">
          El mensaje excede el límite de {maxLength} caracteres
        </div>
      )}

      {hasUploading && (
        <div className="mt-2 text-sm text-blue-600">
          ⏳ Subiendo archivos... No puedes enviar el mensaje aún.
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
