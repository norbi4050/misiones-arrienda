"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, RefreshCw, Archive, Star, Settings } from 'lucide-react';
import Link from 'next/link';

interface OwnerActionsProps {
  propertyId: string;
  highlightPrice?: string;
  className?: string;
}

export default function OwnerActions({ 
  propertyId, 
  highlightPrice = "999 ARS",
  className = "" 
}: OwnerActionsProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Gestionar propiedad
        </h3>
        
        <div className="space-y-3">
          <Link href={`/mi-cuenta/publicaciones/${propertyId}/editar`}>
            <Button className="w-full" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar propiedad
            </Button>
          </Link>
          
          <Button className="w-full" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Renovar publicación
          </Button>
          
          <Button className="w-full" variant="outline">
            <Archive className="h-4 w-4 mr-2" />
            Archivar
          </Button>
          
          <div className="pt-4 border-t">
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
              <Star className="h-4 w-4 mr-2" />
              Destacar anuncio - {highlightPrice}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Aparece primero en búsquedas por 30 días
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
