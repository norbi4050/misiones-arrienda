"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

export function CommunityShowcase() {
  // Demos atractivos de roommates
  const demoProfiles = [
    {
      id: 1,
      name: 'María',
      age: 24,
      city: 'Posadas',
      budget: '120.000',
      type: 'BUSCO',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      tags: ['🎓 Estudiante', '🐕 Pet-friendly', '🚭 No fumador']
    },
    {
      id: 2,
      name: 'Juan',
      age: 28,
      city: 'Oberá',
      budget: '150.000',
      type: 'OFREZCO',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      tags: ['💼 Profesional', '🏋️ Gym lover', '🍃 Vegano']
    },
    {
      id: 3,
      name: 'Lucía',
      age: 22,
      city: 'Posadas',
      budget: '100.000',
      type: 'BUSCO',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      tags: ['🎨 Creativa', '🌙 Nocturno', '🎵 Músico']
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white relative overflow-hidden">
      {/* Decoraciones de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            🤝 La única plataforma con roommates en Misiones
          </h2>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            ¿Buscás compartir depto? ¿Necesitás un compañero de casa? Encontrá tu match perfecto.
          </p>
        </div>

        {/* Preview de perfiles */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {demoProfiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden hover:scale-105 transition-transform">
              <CardContent className="p-0">
                {/* Imagen de perfil */}
                <div className="aspect-square relative bg-gray-200">
                  <Image
                    src={profile.image}
                    alt={profile.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  {/* Badge tipo */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      profile.type === 'BUSCO'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {profile.type === 'BUSCO' ? '🔍 Busco' : '🏠 Ofrezco'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 bg-white text-gray-900">
                  <h4 className="font-bold text-lg mb-1">
                    {profile.name}, {profile.age}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.city}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-lg font-bold text-purple-600">
                    ${profile.budget}/mes
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats + CTA */}
        <div className="text-center">
          <p className="text-lg mb-6 font-medium">
            ¿Querés formar parte de la comunidad? Publicá tu perfil gratis
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/comunidad" prefetch={false}>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-8">
                Explorar Comunidad →
              </Button>
            </Link>
            <Link href="/comunidad/publicar" prefetch={false}>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-purple-600 font-bold px-8">
                Publicar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
