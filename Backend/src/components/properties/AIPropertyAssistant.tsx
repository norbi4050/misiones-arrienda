'use client';

/**
 * AIPropertyAssistant - Asistente IA para generación de descripciones
 *
 * Componente que permite a los usuarios generar descripciones automáticas
 * de propiedades usando Google Gemini AI.
 *
 * Features:
 * - Generación automática de título, descripción, amenidades y características
 * - Loading state con animación
 * - Error handling con fallback a formulario manual
 * - Botón de regenerar si el usuario no está conforme
 */

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PropertyAnalysisResponse } from '@/lib/ai/types';

interface AIPropertyAssistantProps {
  propertyData: {
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    garages?: number;
    area?: number;
    price: number;
    currency?: string;
    city?: string;
    operationType?: string;
  };
  onSuccess: (data: PropertyAnalysisResponse) => void;
  disabled?: boolean;
}

export function AIPropertyAssistant({
  propertyData,
  onSuccess,
  disabled = false,
}: AIPropertyAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async (isRegenerate = false) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/ai/analyze-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Error al generar descripción. Por favor, intenta nuevamente.'
        );
      }

      // Éxito: pasar datos al componente padre
      onSuccess(result.data);
      setSuccess(true);
      setHasGenerated(true);

      // Mostrar success por 2 segundos
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al conectar con el servicio de IA. Por favor, completa el formulario manualmente.';

      setError(errorMessage);

      // Auto-hide error después de 10 segundos
      setTimeout(() => setError(null), 10000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 border border-blue-200 rounded-lg p-4 bg-blue-50/30">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Generador Automático con IA</h3>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600">
        {hasGenerated
          ? '¿No te gustó? Podés regenerar para obtener una versión diferente.'
          : 'Generá automáticamente el título, descripción y características en segundos.'}
      </p>

      {/* Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          onClick={() => handleGenerate(false)}
          disabled={loading || disabled}
          className="flex-1"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando con IA...
            </>
          ) : success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              ¡Generado!
            </>
          ) : hasGenerated ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerar
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar con IA
            </>
          )}
        </Button>

        {hasGenerated && !loading && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleGenerate(true)}
            disabled={loading || disabled}
            size="lg"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading indicator con detalles */}
      {loading && (
        <div className="flex items-start space-x-2 p-3 bg-white rounded-md border border-blue-200">
          <Loader2 className="h-4 w-4 mt-0.5 text-blue-600 animate-spin flex-shrink-0" />
          <div className="flex-1 text-xs space-y-1">
            <p className="font-medium text-blue-900">Analizando tu propiedad...</p>
            <p className="text-gray-600">
              Esto puede tomar entre 5-10 segundos. Estamos generando:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-600 ml-2">
              <li>Título atractivo</li>
              <li>Descripción profesional</li>
              <li>Lista de amenidades</li>
              <li>Características destacadas</li>
            </ul>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && !loading && (
        <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            ¡Descripción generada exitosamente! Revisá los campos completados abajo.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Info footer */}
      {!loading && !error && !success && (
        <div className="text-xs text-gray-500 space-y-1">
          <p className="flex items-center space-x-1">
            <span>✨</span>
            <span>Completá los campos básicos arriba para mejores resultados</span>
          </p>
          <p className="flex items-center space-x-1">
            <span>🎯</span>
            <span>
              Podés editar todo lo que genere la IA antes de publicar
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
