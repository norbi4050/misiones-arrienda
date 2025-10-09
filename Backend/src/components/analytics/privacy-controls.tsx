"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, EyeOff, Settings, Info, Check, X } from 'lucide-react';

interface PrivacyControlsProps {
  className?: string;
  showTitle?: boolean;
}

export function PrivacyControls({ className = "", showTitle = true }: PrivacyControlsProps) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Leer preferencia guardada
    const saved = localStorage.getItem('analytics-consent');
    if (saved !== null) {
      setAnalyticsEnabled(saved === 'true');
    }
    setIsLoading(false);
  }, []);

  const handleToggleAnalytics = (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    localStorage.setItem('analytics-consent', enabled.toString());
    
    // Disparar evento personalizado para que el tracking se entere
    window.dispatchEvent(new CustomEvent('analytics-consent-changed', { 
      detail: { enabled } 
    }));
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center mb-3">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Privacidad y Analytics</h3>
        </div>
      )}

      <div className="space-y-4">
        {/* Estado actual */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {analyticsEnabled ? (
              <Eye className="h-4 w-4 text-green-600 mr-2" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-600 mr-2" />
            )}
            <div>
              <div className="font-medium text-gray-900">
                Analytics {analyticsEnabled ? 'Habilitado' : 'Deshabilitado'}
              </div>
              <div className="text-sm text-gray-600">
                {analyticsEnabled 
                  ? 'Ayudás a mejorar la plataforma compartiendo datos anónimos'
                  : 'No se recopilan datos de uso'
                }
              </div>
            </div>
          </div>
          <Badge variant={analyticsEnabled ? "default" : "secondary"}>
            {analyticsEnabled ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              onClick={() => handleToggleAnalytics(true)}
              variant={analyticsEnabled ? "default" : "outline"}
              size="sm"
              className={analyticsEnabled ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Check className="h-4 w-4 mr-1" />
              Permitir
            </Button>
            <Button
              onClick={() => handleToggleAnalytics(false)}
              variant={analyticsEnabled === false ? "default" : "outline"}
              size="sm"
              className={analyticsEnabled === false ? "bg-red-600 hover:bg-red-700" : ""}
            >
              <X className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </div>
          
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
          >
            <Info className="h-4 w-4 mr-1" />
            {showDetails ? 'Ocultar' : 'Detalles'}
          </Button>
        </div>

        {/* Detalles expandibles */}
        {showDetails && (
          <div className="border-t pt-4 space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Qué datos recopilamos?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Páginas visitadas (sin datos personales)</li>
                <li>• Clics en botones y enlaces</li>
                <li>• Tiempo de permanencia en páginas</li>
                <li>• Errores técnicos para mejorar la plataforma</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Qué NO recopilamos?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Información personal identificable</li>
                <li>• Contenido de mensajes privados</li>
                <li>• Datos financieros o de pago</li>
                <li>• Ubicación precisa</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Shield className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Compromiso de privacidad</p>
                  <p>
                    Usamos analytics propios (sin Google Analytics ni terceros). 
                    Los datos son anónimos y se usan solo para mejorar la experiencia.
                    Podés cambiar esta configuración en cualquier momento.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p>
                Esta configuración se guarda en tu navegador. 
                Al limpiar cookies, volverás a ver esta opción.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook para verificar consentimiento desde otros componentes
export function useAnalyticsConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Leer estado inicial
    const checkConsent = () => {
      const saved = localStorage.getItem('analytics-consent');
      setHasConsent(saved === 'true');
    };

    checkConsent();

    // Escuchar cambios
    const handleConsentChange = (event: CustomEvent) => {
      setHasConsent(event.detail.enabled);
    };

    window.addEventListener('analytics-consent-changed', handleConsentChange as EventListener);

    return () => {
      window.removeEventListener('analytics-consent-changed', handleConsentChange as EventListener);
    };
  }, []);

  return hasConsent;
}
