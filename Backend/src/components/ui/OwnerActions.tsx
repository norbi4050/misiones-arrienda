"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, RefreshCw, Archive, Star, Crown } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface OwnerActionsProps {
  propertyId: string;
  featured?: boolean;
  userPlanTier?: string;
  allowFeatured?: boolean;
  className?: string;
}

export default function OwnerActions({
  propertyId,
  featured = false,
  userPlanTier = 'free',
  allowFeatured = false,
  className = ""
}: OwnerActionsProps) {
  const [isFeatured, setIsFeatured] = useState(featured);
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const handleToggleFeatured = async () => {
    setBusy(true);
    try {
      const resp = await fetch(`/api/properties/${propertyId}/featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !isFeatured }),
        credentials: 'include',
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || data?.success === false) {
        throw new Error(data?.error || 'No se pudo cambiar el estado destacado');
      }

      // Actualizar estado local
      startTransition(() => {
        setIsFeatured(!isFeatured);
      });

      toast.success(isFeatured ? 'Propiedad desmarcada como destacada' : '⭐ ¡Propiedad destacada!');
    } catch (e: any) {
      toast.error(e?.message || 'Error al destacar');
    } finally {
      setBusy(false);
    }
  };

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

          {/* Destacar - Mostrar según plan */}
          <div className="pt-4 border-t">
            {allowFeatured ? (
              // Usuario con plan Professional/Premium - Toggle gratis
              <Button
                className={`w-full ${isFeatured ? 'bg-amber-600 hover:bg-amber-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
                onClick={handleToggleFeatured}
                disabled={busy || isPending}
              >
                <Star className={`h-4 w-4 mr-2 ${isFeatured ? 'fill-white' : ''}`} />
                {isFeatured ? 'Quitar destacado' : 'Destacar anuncio'}
              </Button>
            ) : (
              // Usuario Free - Mostrar upgrade
              <div className="space-y-2">
                <Link href="/mi-empresa/planes" prefetch={false}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Crown className="h-4 w-4 mr-2" />
                    Mejorar a Professional
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Destacá propiedades con el plan Professional
                </p>
              </div>
            )}

            {isFeatured && (
              <p className="text-xs text-amber-600 mt-2 text-center font-medium">
                ⭐ Propiedad destacada
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
