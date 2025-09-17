"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useMessages as useMessagesContext } from '@/contexts/MessagesContext';
import { useMessages } from '@/hooks/useMessages';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import ChatMessage from '@/components/comunidad/ChatMessage';
import ChatInput from '@/components/comunidad/ChatInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import Link from 'next/link';

export default function ThreadPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;
  
  const { user, isAuthenticated } = useUser();
  const { conversations, setActiveConversation } = useMessagesContext();
  const {
    messages,
    isLoading,
    error,
    hasNextPage,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    markAsRead
  } = useMessages({ conversationId });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Inicializar Realtime
  useRealtimeMessages();

  // Encontrar información de la conversación
  const conversation = conversations.find(c => c.id === conversationId);
  const otherUser = conversation?.other_user;

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Cargar mensajes al montar
  useEffect(() => {
    if (conversationId && isAuthenticated) {
      setActiveConversation(conversationId);
      loadMessages();
    }

    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, isAuthenticated, setActiveConversation, loadMessages]);

  // Marcar como leído al abrir
  useEffect(() => {
    if (conversationId && conversation && conversation.unread_count > 0) {
      markAsRead();
    }
  }, [conversationId, conversation, markAsRead]);

  // Scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Manejar envío de mensaje
  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Cargar más mensajes
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;
    
    setIsLoadingMore(true);
    try {
      await loadMoreMessages();
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Conversación no encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Esta conversación no existe o no tienes permisos para verla.
              </p>
              <Link href="/messages">
                <Button>Volver a mensajes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/messages">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                <div>
                  <h1 className="font-semibold text-gray-900">
                    {otherUser?.name || 'Usuario'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {conversation.match ? 'Conversación de comunidad' : 'Conversación'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Error state */}
            {error && (
              <Card className="mb-4 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-red-700">{error}</p>
                    <Button 
                      onClick={loadMessages}
                      variant="outline" 
                      size="sm"
                      className="ml-auto"
                    >
                      Reintentar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Load more button */}
            {hasNextPage && (
              <div className="text-center mb-4">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar mensajes anteriores'}
                </Button>
              </div>
            )}

            {/* Loading state */}
            {isLoading && messages.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando mensajes...</span>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && messages.length === 0 && !error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Inicia la conversación
                </h3>
                <p className="text-gray-600 mb-4">
                  Envía el primer mensaje a {otherUser?.name || 'este usuario'}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={{
                    id: message.id,
                    content: message.content,
                    created_at: message.created_at,
                    sender_id: message.sender.id,
                    type: message.type
                  }}
                  isFromCurrentUser={message.sender.id === user?.id}
                  senderName={message.sender.name}
                  showAvatar={true}
                  isOwn={message.sender.id === user?.id}
                />
              ))}
            </div>

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 bg-white border-t">
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
