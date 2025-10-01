import { Metadata } from 'next';
import { PrivacyControls } from '@/components/analytics/privacy-controls';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Configuración de Privacidad - Misiones Arrienda',
  description: 'Gestiona tus preferencias de privacidad y analytics en Misiones Arrienda',
  robots: 'noindex, nofollow'
};

export default function PrivacySettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración de Privacidad</h1>
                <p className="text-gray-600">Gestiona cómo compartís datos con nosotros</p>
              </div>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Introducción */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Tu privacidad es importante
            </h2>
            <p className="text-gray-600 mb-4">
              En Misiones Arrienda respetamos tu privacidad. Usamos analytics propios 
              (sin Google Analytics ni terceros) para mejorar la plataforma. 
              Vos decidís qué datos compartir.
            </p>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ <strong>Sin vendors externos:</strong> Todos los datos se procesan en nuestros servidores
              </p>
            </div>
          </div>

          {/* Controles de privacidad */}
          <PrivacyControls showTitle={false} />

          {/* Información adicional */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Más información sobre privacidad
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">¿Cómo protegemos tus datos?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Todos los datos se almacenan en servidores seguros</li>
                  <li>• No vendemos ni compartimos datos con terceros</li>
                  <li>• Los datos son anónimos y agregados</li>
                  <li>• Cumplimos con las regulaciones de privacidad</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">¿Para qué usamos los datos?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Mejorar la experiencia de usuario</li>
                  <li>• Detectar y corregir errores técnicos</li>
                  <li>• Optimizar el rendimiento de la plataforma</li>
                  <li>• Entender qué funcionalidades son más útiles</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tus derechos</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Podés cambiar estas preferencias en cualquier momento</li>
                  <li>• Podés solicitar la eliminación de tus datos</li>
                  <li>• Podés acceder a un reporte de tus datos</li>
                  <li>• Podés contactarnos para cualquier consulta</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    ¿Tenés preguntas sobre privacidad?
                  </p>
                </div>
                <div className="space-x-2">
                  <Link href="/legal/privacy">
                    <Button variant="outline" size="sm">
                      Política de Privacidad
                    </Button>
                  </Link>
                  <Link href="/legal/terms">
                    <Button variant="outline" size="sm">
                      Términos y Condiciones
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
