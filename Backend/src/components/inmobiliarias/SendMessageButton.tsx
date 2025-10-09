'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SendMessageButtonProps {
  agencyId: string;
  agencyName: string;
  className?: string;
}

/**
 * Componente: Botón "Enviar un mensaje"
 * 
 * Funcionalidad:
 * 1. Verifica si existe una conversación con la inmobiliaria
 * 2. Si existe, redirige a esa conversación
 * 3. Si no existe, crea una nueva conversación
 * 4. Redirige a /messages/[conversationId]
 * 
 * Uso: Perfil público de inmobiliarias
 */
export default function SendMessageButton({ 
  agencyId, 
  agencyName,
  className = '' 
}: SendMessageButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    // Verificar autenticación
    if (!user) {
      router.push(`/login?redirect=/inmobiliaria/${agencyId}`);
      return;
    }

    // No permitir mensajes a uno mismo
    if (user.id === agencyId) {
      alert('No puedes enviarte mensajes a ti mismo');
      return;
    }

    setLoading(true);

    try {
      // 1. Verificar si existe conversación
      const checkResponse = await fetch(
        `/api/messages/threads?participant=${agencyId}`,
        { method: 'GET' }
      );

      if (checkResponse.ok) {
        const { threads } = await checkResponse.json();
        
        // Si existe conversación, redirigir
        if (threads && threads.length > 0) {
          const existingThread = threads[0];
          router.push(`/messages/${existingThread.id}`);
          return;
        }
      }

      // 2. Si no existe, crear nueva conversación
      const createResponse = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: agencyId,
          initial_message: `Hola, me interesa contactar con ${agencyName}.`,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Error al crear conversación');
      }

      const { thread } = await createResponse.json();

      // 3. Redirigir a la nueva conversación
      router.push(`/messages/${thread.id}`);

    } catch (error) {
      console.error('Error al iniciar conversación:', error);
      alert('Error al iniciar conversación. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSendMessage}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 px-6 py-3 
        bg-blue-600 hover:bg-blue-700 
        text-white font-medium rounded-lg
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Iniciando...</span>
        </>
      ) : (
        <>
          <MessageCircle className="w-5 h-5" />
          <span>Enviar un mensaje</span>
        </>
      )}
    </button>
  );
}
