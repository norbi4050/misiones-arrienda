"use client";

import { useEffect, useRef } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';
import { useUser } from '@/contexts/UserContext';
import { useMessages } from '@/contexts/MessagesContext';

export function useRealtimeMessages() {
  const { user, isAuthenticated } = useUser();
  const { refreshInbox, activeConversationId, markAsRead } = useMessages();
  const supabase = getBrowserClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Crear suscripción única para mensajes (esquema real: public.messages)
    const channel = supabase
      .channel(`messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id.neq.${user.id}` // Solo mensajes de otros usuarios
        },
        async (payload: any) => {
          console.log('Nuevo mensaje recibido:', payload);
          
          // Refrescar inbox para actualizar contadores y orden
          await refreshInbox();
          
          // Si el thread activo es el de este mensaje, marcar como leído
          if (activeConversationId === payload.new.conversation_id) {
            setTimeout(() => {
              markAsRead(payload.new.conversation_id);
            }, 1000); // Delay para que el usuario vea el mensaje
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id.eq.${user.id}` // Solo mensajes propios actualizados
        },
        async (payload: any) => {
          console.log('Mensaje actualizado:', payload);
          
          // Si se actualizó is_read, refrescar inbox
          if (payload.new.is_read !== payload.old.is_read) {
            await refreshInbox();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        async (payload: any) => {
          console.log('Conversación actualizada:', payload);
          
          // Refrescar inbox cuando se actualiza una conversación
          await refreshInbox();
        }
      )
      .subscribe((status: any) => {
        console.log('Realtime status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscrito a mensajes en tiempo real');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal de Realtime');
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Timeout en Realtime, reintentando...');
        }
      });

    subscriptionRef.current = channel;

    // Cleanup al desmontar
    return () => {
      if (subscriptionRef.current) {
        console.log('🔌 Desconectando Realtime...');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [isAuthenticated, user, supabase, refreshInbox, activeConversationId, markAsRead]);

  // Función para verificar estado de conexión
  const getConnectionStatus = () => {
    if (!subscriptionRef.current) return 'disconnected';
    return subscriptionRef.current.state;
  };

  // Función para reconectar manualmente
  const reconnect = async () => {
    if (subscriptionRef.current) {
      await supabase.removeChannel(subscriptionRef.current);
    }
    
    // La suscripción se recreará automáticamente por el useEffect
  };

  return {
    connectionStatus: getConnectionStatus(),
    reconnect,
    isConnected: getConnectionStatus() === 'joined'
  };
}

export default useRealtimeMessages;
