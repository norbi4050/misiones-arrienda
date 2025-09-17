"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useMessages } from '@/contexts/MessagesContext';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import ConversationCard from '@/components/comunidad/ConversationCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Users, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const { 
    conversations, 
    unreadCount, 
    isLoading, 
    error, 
    refreshInbox,
    setActiveConversation 
  } = useMessages();
  
  // Inicializar Realtime
  useRealtimeMessages();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Manejar selección de conversación
  const handleSelectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    router.push(`/messages/${conversationId}`);
  };

  // Formatear tiempo relativo
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'ahora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 2592000)}mes`;
  };

  if (!isAuthenticated) {
    return null; // Evitar flash antes de redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 
                    ? `${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer`
                    : 'Todas las conversaciones al día'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {unreadCount} nuevos
                </Badge>
              )}
              
              <Button
                onClick={refreshInbox}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </Button>
              
              <Link href="/comunidad">
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Buscar personas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Error state */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-red-700">{error}</p>
                  <Button 
                    onClick={refreshInbox}
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

          {/* Loading state */}
          {isLoading && conversations.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando conversaciones...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!isLoading && conversations.length === 0 && !error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No tienes conversaciones aún
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Busca propiedades que te interesen y contacta a los propietarios, 
                    o explora la comunidad para conocer personas.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/properties">
                      <Button className="w-full sm:w-auto">
                        <Search className="w-4 h-4 mr-2" />
                        Buscar propiedades
                      </Button>
                    </Link>
                    <Link href="/comunidad">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <Users className="w-4 h-4 mr-2" />
                        Explorar comunidad
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversations list */}
          {conversations.length > 0 && (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {conversation.other_user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.other_user.name || 'Usuario'}
                          </h3>
                          <div className="flex items-center gap-2">
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(conversation.last_message_at)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message_content || 'Sin mensajes'}
                        </p>

                        {/* Property context if available */}
                        {conversation.match && (
                          <div className="mt-2">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Conversación de comunidad
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Unread indicator */}
                      {conversation.unread_count > 0 && (
                        <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick actions */}
          {conversations.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/comunidad">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva conversación
                  </Button>
                </Link>
                <Link href="/properties">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Search className="w-4 h-4 mr-2" />
                    Buscar propiedades
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
