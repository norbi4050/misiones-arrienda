"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConsentCheckbox } from '@/components/ui/ConsentCheckbox';
import { Send, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ContactPanelProps {
  propertyId: string;
  ownerId: string;
  propertyCity: string;
  className?: string;
}

export default function ContactPanel({ 
  propertyId, 
  ownerId, 
  propertyCity,
  className = "" 
}: ContactPanelProps) {
  const [msg, setMsg] = useState(
    `Hola, me interesa esta propiedad en ${propertyCity}. ¿Podríamos coordinar una visita?`
  );
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = !terms || !privacy || msg.trim().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;

    setIsSubmitting(true);
    
    try {
      // Crear/abrir hilo usando el nuevo contrato
      const threadRes = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          propertyId, 
          toUserId: ownerId
        })
      });

      if (threadRes.status === 401) {
        toast.error('Iniciá sesión para enviar mensajes');
        return;
      }

      if (!threadRes.ok) {
        toast.error('Error al crear conversación');
        return;
      }

      const threadData = await threadRes.json();
      const threadId = threadData.threadId;

      // Enviar mensaje al hilo
      const msgRes = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          content: msg.trim()
        })
      });

      if (msgRes.ok) {
        toast.success('Mensaje enviado correctamente');
        setMsg(`Hola, me interesa esta propiedad en ${propertyCity}. ¿Podríamos coordinar una visita?`);
        
        // Navegar al hilo de mensajes
        window.location.href = `/messages?thread=${threadId}`;
      } else if (msgRes.status === 401) {
        toast.error('Iniciá sesión para enviar mensajes');
      } else {
        toast.error('Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {/* Botones de contacto rápido */}
      <div className="space-y-3 mb-6">
        <Button className="w-full" size="lg">
          <Phone className="h-4 w-4 mr-2" />
          Contactar
        </Button>
        <Button variant="outline" className="w-full" size="lg">
          <Mail className="h-4 w-4 mr-2" />
          Enviar consulta
        </Button>
      </div>

      {/* Formulario de mensaje */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje personalizado
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Hola, me interesa esta propiedad en ${propertyCity}. ¿Podríamos coordinar una visita?`}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
        </div>

        {/* Consent Checkboxes */}
        <ConsentCheckbox
          checkedTerms={terms}
          checkedPrivacy={privacy}
          onChangeTerms={setTerms}
          onChangePrivacy={setPrivacy}
          className="my-4"
        />

        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={disabled || isSubmitting}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Enviando...' : 'Enviar consulta'}
        </Button>
      </form>
    </div>
  );
}
