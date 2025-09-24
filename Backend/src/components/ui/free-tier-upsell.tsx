"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Building2,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FreeTierUpsellProps {
  userPropertyCount: number;
  hasActiveSubscription: boolean;
  showInline?: boolean;
  propertyId?: string; // Para destacar una propiedad específica
  className?: string;
}

export function FreeTierUpsell({
  userPropertyCount,
  hasActiveSubscription,
  showInline = false,
  propertyId,
  className = ""
}: FreeTierUpsellProps) {
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);
  const [isProcessingFeature, setIsProcessingFeature] = useState(false);

  // Si tiene suscripción activa, no mostrar upsell
  if (hasActiveSubscription) {
    return null;
  }

  // Si tiene 0 propiedades, no mostrar upsell aún
  if (userPropertyCount === 0) {
    return null;
  }

  const handleSubscribe = async () => {
    setIsProcessingSubscription(true);

    try {
      console.log('🔧 Iniciando suscripción desde upsell');

      const response = await fetch('/api/payments/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: 'AGENCY_BASIC' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando suscripción');
      }

      if (data.success && data.initPoint) {
        console.log('✅ Preferencia de suscripción creada, redirigiendo a MercadoPago');
        toast.success('Redirigiendo a MercadoPago...');
        
        // Redirigir a MercadoPago
        window.location.href = data.initPoint;
      } else {
        throw new Error('No se recibió URL de pago');
      }

    } catch (error) {
      console.error('❌ Error en suscripción:', error);
      toast.error(error instanceof Error ? error.message : 'Error procesando suscripción');
    } finally {
      setIsProcessingSubscription(false);
    }
  };

  const handleFeatureProperty = async () => {
    if (!propertyId) {
      toast.error('No se especificó la propiedad a destacar');
      return;
    }

    setIsProcessingFeature(true);

    try {
      console.log('🔧 Iniciando pago para destacar propiedad desde upsell:', propertyId);

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
      setIsProcessingFeature(false);
    }
  };

  // Versión inline para "Mis propiedades"
  if (showInline) {
    return (
      <div className={`p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Destacá tu propiedad
              </h4>
              <p className="text-sm text-gray-600">
                Mayor visibilidad por solo $999 ARS/mes
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {propertyId && (
              <Button
                onClick={handleFeatureProperty}
                disabled={isProcessingFeature}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isProcessingFeature ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Star className="h-3 w-3 mr-1" />
                )}
                Destacar
              </Button>
            )}
            
            <Button
              onClick={handleSubscribe}
              disabled={isProcessingSubscription}
              size="sm"
              variant="outline"
            >
              {isProcessingSubscription ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Package className="h-3 w-3 mr-1" />
              )}
              Suscribirme
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Versión completa para flujo de publicar
  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Límite de Plan Gratuito Alcanzado
            </h3>
            
            <p className="text-orange-800 mb-4">
              Tenés <Badge variant="secondary">{userPropertyCount} propiedad{userPropertyCount !== 1 ? 'es' : ''}</Badge> publicada{userPropertyCount !== 1 ? 's' : ''}. 
              Para publicar más propiedades o destacar tus anuncios, elegí una de estas opciones:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Opción 1: Suscripción */}
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center mb-3">
                  <Package className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-900">Plan Agencia</h4>
                </div>
                
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  $2.999 ARS
                  <span className="text-sm text-gray-600 font-normal">/mes</span>
                </div>
                
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Propiedades ilimitadas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Destacados incluidos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Badge "Agencia"
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Soporte prioritario
                  </li>
                </ul>

                <Button
                  onClick={handleSubscribe}
                  disabled={isProcessingSubscription}
                  className="w-full"
                >
                  {isProcessingSubscription ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Suscribirme
                    </>
                  )}
                </Button>
              </div>

              {/* Opción 2: Destacar (solo si hay propertyId) */}
              {propertyId && (
                <div className="p-4 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center mb-3">
                    <Star className="h-5 w-5 text-yellow-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Destacar Anuncio</h4>
                  </div>
                  
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    $999 ARS
                    <span className="text-sm text-gray-600 font-normal">/30 días</span>
                  </div>
                  
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      Aparece primero en búsquedas
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      Badge "⭐ Destacado"
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      Mayor visibilidad
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      Pago único
                    </li>
                  </ul>

                  <Button
                    onClick={handleFeatureProperty}
                    disabled={isProcessingFeature}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    {isProcessingFeature ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Destacar Esta Propiedad
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="p-3 bg-white rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>💡 Recomendación:</strong> Si planeas publicar más propiedades regularmente, 
                el Plan Agencia es más económico y incluye destacados ilimitados.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
