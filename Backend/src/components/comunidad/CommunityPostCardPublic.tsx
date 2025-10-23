"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Home, Lock } from 'lucide-react'

interface CommunityPostCardPublicProps {
  post: {
    id: string
    role: 'BUSCO' | 'OFREZCO'
    title: string
    city: string
    budgetMin?: number
    budgetMax?: number
    price?: number
    images?: string[]
    preferences?: {
      pets_allowed?: boolean
      smoker_friendly?: boolean
      gender_preference?: string
    }
  }
}

/**
 * Card pública de comunidad para usuarios NO logueados
 * Muestra información básica pero requiere login para contactar
 */
export function CommunityPostCardPublic({ post }: CommunityPostCardPublicProps) {
  // Truncar título para privacidad (mostrar solo primeras palabras)
  const truncatedTitle = post.title.split(' ').slice(0, 4).join(' ') + '...'

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Badge de tipo */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-lg ${
          post.role === 'BUSCO'
            ? 'bg-blue-500 text-white'
            : 'bg-green-500 text-white'
        }`}>
          {post.role === 'BUSCO' ? '🔍 Busco' : '🏠 Ofrezco'}
        </span>
      </div>

      {/* Imagen */}
      <div className="aspect-video relative bg-gray-200">
        {post.images?.[0] ? (
          <Image
            src={post.images[0]}
            alt="Vista previa"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            {post.role === 'BUSCO' ? (
              <Users className="w-16 h-16 text-purple-300" />
            ) : (
              <Home className="w-16 h-16 text-green-300" />
            )}
          </div>
        )}

        {/* Overlay para indicar que es preview */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <Lock className="w-4 h-4" />
            <span>Registrate para ver detalles</span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <CardContent className="p-4">
        {/* Título truncado */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
          {truncatedTitle}
        </h3>

        {/* Ciudad */}
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          {post.city}
        </div>

        {/* Badges de preferencias (si existen) */}
        {post.preferences && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.preferences.pets_allowed && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                🐕 Mascotas OK
              </span>
            )}
            {post.preferences.smoker_friendly === false && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                🚭 No fumador
              </span>
            )}
            {post.preferences.gender_preference && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {post.preferences.gender_preference}
              </span>
            )}
          </div>
        )}

        {/* Precio */}
        <div className="mb-4">
          <p className="text-xl font-bold text-purple-600">
            {post.role === 'BUSCO' && post.budgetMin && post.budgetMax
              ? `$${post.budgetMin.toLocaleString('es-AR')} - $${post.budgetMax.toLocaleString('es-AR')}`
              : post.price
              ? `$${post.price.toLocaleString('es-AR')}/mes`
              : 'Precio a convenir'}
          </p>
        </div>

        {/* CTA de registro */}
        <Link href="/register" className="block">
          <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
            <Lock className="w-4 h-4 mr-2" />
            Registrate para contactar
          </Button>
        </Link>

        {/* Texto explicativo */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Creá tu cuenta gratis para ver todos los detalles y contactar
        </p>
      </CardContent>
    </Card>
  )
}
