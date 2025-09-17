"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useMessages } from '@/contexts/MessagesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import Link from 'next/link';

export default function NewMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useUser();
  const { createOrOpenConversation } = useMessages();

  const [recipientId, setRecipientId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener parámetros de URL
  useEffect(() => {
    const toParam = searchParams.get('to');
    const propertyParam = searchParams.get('propertyId');

    if (toParam) {
      setRecipientId(toParam);
    }
    if (propertyParam) {
      setPropertyId(propertyParam);
    }
  }, [searchParams]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Manejar envío del mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientId || !message.trim()) {
      setError('Destinatario y mensaje son requeridos');
      return;
    }

    if (!isAuthenticated || !user) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Crear o abrir conversación existente
      const conversationId = await createOrOpenConversation(recipientId, propertyId || undefined);
      
      if (!conversationId) {
        throw new Error('No se pudo crear la conversación');
      }

      // Navegar al thread con el mensaje inicial
      router.push(`/messages/${conversationId}?initialMessage=${encodeURIComponent(message)}`);

    } catch (error) {
      console.error('Error creating conversation:', error);
      setError(error instanceof Error ? error.message : 'Error al crear conversación');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/messages">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nuevo Mensaje</h1>
                <p className="text-gray-600">Inicia una nueva conversación</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensaje</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Error state */}
              {error && (
                <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-6">
                {/* Recipient ID */}
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                    ID del Destinatario
                  </label>
                  <Input
                    id="recipient"
                    type="text"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    placeholder="ID del usuario destinatario"
                    required
                    disabled={!!searchParams.get('to')} // Deshabilitar si viene de URL
                  />
                  {searchParams.get('to') && (
                    <p className="text-xs text-gray-500 mt-1">
                      Destinatario seleccionado automáticamente
                    </p>
                  )}
                </div>

                {/* Property ID (opcional) */}
                {propertyId && (
                  <div>
                    <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-2">
                      Propiedad Relacionada
                    </label>
                    <Input
                      id="property"
                      type="text"
                      value={propertyId}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este mensaje está relacionado con una propiedad específica
                    </p>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={6}
                    required
                    maxLength={1000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {propertyId ? 'Mensaje sobre una propiedad' : 'Mensaje general'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {message.length}/1000 caracteres
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading || !recipientId || !message.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>
                  
                  <Link href="/messages">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>

              {/* Help text */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  💡 Consejos para un buen mensaje
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Sé claro y específico sobre tu interés</li>
                  <li>• Menciona detalles relevantes si es sobre una propiedad</li>
                  <li>• Mantén un tono respetuoso y profesional</li>
                  <li>• Incluye tus datos de contacto si es necesario</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">¿No encuentras a quien buscas?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/comunidad">
                <Button variant="outline" className="w-full sm:w-auto">
                  Explorar Comunidad
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="outline" className="w-full sm:w-auto">
                  Buscar Propiedades
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
