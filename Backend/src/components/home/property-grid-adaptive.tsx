"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Building2, MapPin } from 'lucide-react'

interface Property {
  id: string
  title: string
  city: string
  price: number
  images?: string[]
}

interface PropertyGridAdaptiveProps {
  properties: Property[]
}

export function PropertyGridAdaptive({ properties }: PropertyGridAdaptiveProps) {
  const propertyCount = properties.length

  return (
    <section id="propiedades" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">
          {propertyCount >= 3 ? 'Propiedades Destacadas' : 'Sé de los primeros en publicar'}
        </h2>

        {propertyCount >= 3 ? (
          // Suficientes propiedades: mostrar grid normal
          <div className="grid md:grid-cols-3 gap-6">
            {properties.slice(0, 6).map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {property.images?.[0] && (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.city}
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    ${property.price?.toLocaleString('es-AR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Pocas propiedades: mostrar mix de reales + CTAs
          <div className="grid md:grid-cols-3 gap-6">
            {/* Mostrar propiedades reales primero (hasta 2) */}
            {properties.slice(0, 2).map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {property.images?.[0] && (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.city}
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    ${property.price?.toLocaleString('es-AR')}
                  </p>
                </CardContent>
              </Card>
            ))}

            {/* Card CTA 1: Publicar propiedad */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-400 flex items-center justify-center min-h-[400px] hover:border-green-500 hover:shadow-lg transition-all">
              <CardContent className="text-center p-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Publicá tu propiedad</h3>
                <p className="text-gray-600 mb-6">
                  Sé de los primeros en nuestra plataforma y obtené máxima visibilidad
                </p>
                <Link href="/publicar" prefetch={false}>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Publicar Gratis →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Card CTA 2: Inmobiliarias (si hay menos de 2 propiedades) */}
            {propertyCount < 2 && (
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-dashed border-blue-400 flex items-center justify-center min-h-[400px] hover:border-blue-500 hover:shadow-lg transition-all">
                <CardContent className="text-center p-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">¿Sos inmobiliaria?</h3>
                  <p className="text-gray-600 mb-6">
                    Registrate gratis y obtené tu sitio web + 12 meses gratis
                  </p>
                  <Link href="/mi-empresa/planes" prefetch={false}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Ver Beneficios →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Botón ver más si hay muchas propiedades */}
        {propertyCount > 6 && (
          <div className="text-center mt-8">
            <Link href="/properties" prefetch={false}>
              <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                Ver todas las propiedades ({propertyCount}) →
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
