"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { analytics } from '@/lib/analytics/track';

interface FeaturePaymentButtonProps {
  propertyId: string;
  isOwner: boolean;
  featured: boolean;
  featuredExpires?: string | null;
  className?: string;
}

export function FeaturePaymentButton({
  propertyId,
  isOwner,
  featured,
  featuredExpires,
  className = ""
}: FeaturePaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificar si está destacado y activo
  const isCurrentlyFeatured = featured && featuredExpires && new Date(featuredExpires) > new Date();
  
  // Verificar si expira pronto (menos de 5 días)
  const expiresAt = featuredExpires ? new Date(featuredExpires) : null;
  const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const expiresSoon = isCurrentlyFeatured && daysUntilExpiry <= 5;

  const handleFeaturePayment = async () => {
    if (!isOwner) {
      toast.error('Solo el propietario puede destacar esta propiedad');
      return;
    }

    if (isCurrentlyFeatured) {
      toast.error('Esta propiedad ya está destacada');
      return;
    }

    // Track feature click
    analytics.featureClick(propertyId);

    setIsProcessing(true);

    try {
      console.log('🔧 Iniciando pago para destacar propiedad:', propertyId);

      const response = await fetch('/api/payments/feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: propertyId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando preferencia de pago');
      }

      if (data.success && data.initPoint) {
        console.log('✅ Preferencia creada, redirigiendo a MercadoPago');
        
        // Track feature preference created
        analytics.featurePrefCreated(propertyId, 999);
        
        toast.success('Redirigiendo a MercadoPago...');
        
        // Redirigir a MercadoPago
        window.location.href = data.initPoint;
      } else {
        throw new Error('No se recibió URL de pago');
      }

    } catch (error) {
      console.error('❌ Error en pago destacado:', error);
      toast.error(error instanceof Error ? error.message : 'Error procesando pago');
    } finally {
      setIsProcessing(false);
    }
  };

  // Si no es el dueño, no mostrar nada
  if (!isOwner) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Estado actual */}
      {isCurrentlyFeatured && (
        <div className="space-y-2">
          <Badge variant="default" className="bg-yellow-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            Destacado hasta {expiresAt?.toLocaleDateString('es-AR')}
          </Badge>
          
          {expiresSoon && (
            <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
              <div className="text-sm">
                <p className="text-orange-800 font-medium">
                  Tu destacado vence en {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
                </p>
                <p className="text-orange-600">
                  Renovalo para mantener la visibilidad premium
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botón de acción */}
      {!isCurrentlyFeatured && (
        <div className="space-y-2">
          <Button
            onClick={handleFeaturePayment}
            disabled={isProcessing}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Destacar anuncio
              </>
            )}
          </Button>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              $999 ARS
            </div>
            <div className="text-sm text-gray-600">
              por 30 días de destacado
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Star className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Beneficios del destacado:</p>
                <ul className="text-xs space-y-1">
                  <li>• Aparece primero en búsquedas</li>
                  <li>• Badge "⭐ Destacado" visible</li>
                  <li>• Mayor visibilidad por 30 días</li>
                  <li>• Pago seguro con MercadoPago</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renovar si expira pronto */}
      {expiresSoon && (
        <Button
          onClick={handleFeaturePayment}
          disabled={isProcessing}
          variant="outline"
          className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
        >
          <Clock className="h-4 w-4 mr-2" />
          Renovar destacado
        </Button>
      )}
    </div>
  );
}
