"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getBrowserClient } from '@/lib/supabase/browser';

// Tipos para mensajería (esquema real: public.conversations y public.messages)
export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image';
  created_at: string;
  is_read: boolean; // Campo boolean, no timestamp
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_content: string;
  last_message_at: string;
  unread_count: number;
  other_user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface MessagesState {
  conversations: Conversation[];
  activeConversationId: string | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface MessagesActions {
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  createOrOpenConversation: (recipientId: string, propertyId?: string) => Promise<string>;
  refreshInbox: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
}

export interface MessagesContextType extends MessagesState, MessagesActions {}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const supabase = getBrowserClient();

  // Estado principal
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar conversaciones desde API (esquema real)
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error('Error al cargar conversaciones');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
      
      // Calcular total de no leídos
      const totalUnread = (data.conversations || []).reduce(
        (sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 
        0
      );
      setUnreadCount(totalUnread);

    } catch (error) {
      console.error('Error loading conversations:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Enviar mensaje
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content,
          type: 'text'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje');
      }

      // Actualizar conversaciones localmente
      await refreshInbox();

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [isAuthenticated, user]);

  // Marcar como leído (is_read = true)
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!isAuthenticated || !user) return;

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

      // Actualizar estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );

      // Actualizar contador total
      setUnreadCount(prev => {
        const conversation = conversations.find(c => c.id === conversationId);
        return Math.max(0, prev - (conversation?.unread_count || 0));
      });

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [isAuthenticated, user, conversations]);

  // Crear o abrir conversación existente
  const createOrOpenConversation = useCallback(async (recipientId: string, propertyId?: string): Promise<string> => {
    if (!isAuthenticated || !user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Buscar conversación existente
      const existingConversation = conversations.find(conv => 
        conv.other_user.id === recipientId
      );

      if (existingConversation) {
        return existingConversation.id;
      }

      // Si no existe, crear nueva conversación
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          propertyId
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear conversación');
      }

      const data = await response.json();
      
      // Refrescar conversaciones para obtener la nueva
      await refreshInbox();
      
      return data.conversation?.id || '';

    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, [isAuthenticated, user, conversations]);

  // Refrescar inbox
  const refreshInbox = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // Establecer conversación activa
  const setActiveConversation = useCallback((id: string | null) => {
    setActiveConversationId(id);
  }, []);

  // Cargar conversaciones al inicializar
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    } else {
      // Limpiar estado si no está autenticado
      setConversations([]);
      setUnreadCount(0);
      setActiveConversationId(null);
      setError(null);
    }
  }, [isAuthenticated, user, loadConversations]);

  const value: MessagesContextType = {
    // Estado
    conversations,
    activeConversationId,
    unreadCount,
    isLoading,
    error,

    // Acciones
    sendMessage,
    markAsRead,
    createOrOpenConversation,
    refreshInbox,
    setActiveConversation,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

// Hook para usar el contexto
export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}

export default MessagesContext;
