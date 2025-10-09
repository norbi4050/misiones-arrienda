"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConsentCheckbox } from '@/components/ui/ConsentCheckbox';
import { Send } from 'lucide-react';

interface PropertyContactFormProps {
  propertyCity: string;
  className?: string;
}

export default function PropertyContactForm({ 
  propertyCity, 
  className = "" 
}: PropertyContactFormProps) {
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [message, setMessage] = useState(
    `Hola, me interesa esta propiedad en ${propertyCity}. ¿Podríamos coordinar una visita?`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar envío de mensaje
    console.log('Enviando mensaje:', { message, checkedTerms, checkedPrivacy });
  };

  return (
    <form className={`space-y-4 ${className}`} onSubmit={handleSubmit}>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`Hola, me interesa esta propiedad en ${propertyCity}. ¿Podríamos coordinar una visita?`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Consent Checkboxes */}
      <ConsentCheckbox
        checkedTerms={checkedTerms}
        checkedPrivacy={checkedPrivacy}
        onChangeTerms={setCheckedTerms}
        onChangePrivacy={setCheckedPrivacy}
        className="my-4"
      />

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!checkedTerms || !checkedPrivacy}
      >
        <Send className="h-4 w-4 mr-2" />
        Enviar consulta
      </Button>
    </form>
  );
}
