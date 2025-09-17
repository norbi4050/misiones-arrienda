"use client";

import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Message } from '@/contexts/MessagesContext';

interface UseMessagesProps {
  conversationId: string;
}

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
}

export function useMessages({ conversationId }: UseMessagesProps): UseMessagesReturn {
  const { user, isAuthenticated } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Cargar mensajes de la conversación
  const loadMessages = useCallback(async (page: number = 1) => {
    if (!isAuthenticated || !user || !conversationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/messages/${conversationId}?page=${page}&limit=50`
      );

      if (!response.ok) {
        throw new Error('Error al cargar mensajes');
      }

      const data = await response.json();
      
      if (page === 1) {
        // Primera carga - reemplazar mensajes
        setMessages(data.messages || []);
      } else {
        // Cargar más - agregar al inicio (mensajes más antiguos)
        setMessages(prev => [...(data.messages || []), ...prev]);
      }

      setCurrentPage(page);
      setHasNextPage(data.pagination?.hasNextPage || false);

    } catch (error) {
      console.error('Error loading messages:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, conversationId]);

  // Cargar mensajes iniciales
  const loadInitialMessages = useCallback(() => {
    return loadMessages(1);
  }, [loadMessages]);

  // Cargar más mensajes (paginación hacia arriba)
  const loadMoreMessages = useCallback(() => {
    if (!hasNextPage || isLoading) return Promise.resolve();
    return loadMessages(currentPage + 1);
  }, [hasNextPage, isLoading, currentPage, loadMessages]);

  // Enviar mensaje
  const sendMessage = useCallback(async (content: string) => {
    if (!isAuthenticated || !user || !conversationId) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Optimistic update - agregar mensaje temporalmente
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        type: 'text',
        created_at: new Date().toISOString(),
        read_at: null,
        sender: {
          id: user.id,
          name: user.email || 'Usuario',
          avatar: undefined
        }
      };

      setMessages(prev => [...prev, tempMessage]);

      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type: 'text'
        }),
      });

      if (!response.ok) {
        // Remover mensaje temporal en caso de error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje');
      }

      const data = await response.json();
      
      // Reemplazar mensaje temporal con el real
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? data.message : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [isAuthenticated, user, conversationId]);

  // Marcar mensajes como leídos
  const markAsRead = useCallback(async () => {
    if (!isAuthenticated || !user || !conversationId) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) {
        throw new Error('Error al marcar como leído');
      }

      // Actualizar mensajes localmente
      setMessages(prev => 
        prev.map(msg => 
          msg.sender.id !== user.id && !msg.is_read
            ? { ...msg, is_read: true }
            : msg
        )
      );

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [isAuthenticated, user, conversationId]);

  return {
    messages,
    isLoading,
    error,
    hasNextPage,
    loadMessages: loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead
  };
}

export default useMessages;
