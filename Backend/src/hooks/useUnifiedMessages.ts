'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UnifiedConversation, UnifiedMessageFilter, UnifiedMessagesResponse } from '@/types/messages'

interface UseUnifiedMessagesReturn {
  conversations: UnifiedConversation[]
  loading: boolean
  error: string | null
  counts: {
    all: number
    properties: number
    community: number
  }
  refetch: () => Promise<void>
}

/**
 * Hook para obtener conversaciones unificadas de propiedades y comunidad
 * 
 * @param filterType - Tipo de filtro: 'all' | 'properties' | 'community'
 * @returns Conversaciones, estado de carga, errores y contadores
 */
export function useUnifiedMessages(filterType: UnifiedMessageFilter = 'all'): UseUnifiedMessagesReturn {
  const [conversations, setConversations] = useState<UnifiedConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState({
    all: 0,
    properties: 0,
    community: 0
  })

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/messages/unified?type=${filterType}`, {
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.status === 401) {
        setError('No autorizado')
        setConversations([])
        return
      }

      if (!response.ok) {
        throw new Error('Error al cargar conversaciones')
      }

      const data: UnifiedMessagesResponse = await response.json()

      if (data.success) {
        setConversations(data.conversations)
        setCounts(data.counts)
        console.log(`[useUnifiedMessages] ✅ Loaded ${data.conversations.length} conversations (filter: ${filterType})`)
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (err: any) {
      console.error('[useUnifiedMessages] ❌ Error:', err)
      setError(err.message || 'Error al cargar conversaciones')
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [filterType])

  // Fetch inicial y cuando cambia el filtro
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    counts,
    refetch: fetchConversations
  }
}
