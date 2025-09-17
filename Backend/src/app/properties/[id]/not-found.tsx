import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function PropertyNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Propiedad no encontrada
          </h1>
          <p className="text-gray-600">
            La propiedad que buscas no existe o ha sido removida de nuestro catálogo.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/properties">
              <Search className="h-4 w-4 mr-2" />
              Ver todas las propiedades
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>¿Necesitas ayuda? <Link href="/contact" className="text-blue-600 hover:underline">Contáctanos</Link></p>
        </div>
      </div>
    </div>
  );
}
