"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  id: string
  name: string
  occupation?: string
  age?: number
  verified: boolean
  rating: number
  reviewCount: number
  avatar?: string
  bio?: string
}

export default function ProfilesPage() {
  const [users] = useState<UserProfile[]>([])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Perfiles de Usuarios Verificados
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Conoce a nuestra comunidad de inquilinos verificados. Cada perfil incluye calificaciones 
          y comentarios de propietarios anteriores para ayudarte a tomar la mejor decisión.
        </p>
      </div>

      {/* Explicación del sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">
          🌟 Sistema de Calificaciones para Inquilinos
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-blue-800">
          <div>
            <h3 className="font-semibold mb-2">✅ Beneficios para Propietarios:</h3>
            <ul className="space-y-1 text-sm">
              <li>• Ver historial de alquileres anteriores</li>
              <li>• Leer comentarios de otros propietarios</li>
              <li>• Verificar calificaciones de 1 a 5 estrellas</li>
              <li>• Conocer ocupación y datos del inquilino</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🏆 Beneficios para Inquilinos:</h3>
            <ul className="space-y-1 text-sm">
              <li>• Construir reputación como buen inquilino</li>
              <li>• Acceso preferencial a mejores propiedades</li>
              <li>• Mayor confianza de los propietarios</li>
              <li>• Perfil público profesional</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grid de perfiles o estado vacío */}
      {users.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-20 h-20 rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-xl font-bold text-gray-600">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  {user.verified && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      ✓ Verificado
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {renderStars(Math.floor(user.rating))}
                  <span className="ml-1 text-sm font-semibold text-gray-900">
                    {user.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({user.reviewCount} reseñas)
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {user.occupation && (
                  <p><strong>Ocupación:</strong> {user.occupation}</p>
                )}
                {user.age && (
                  <p><strong>Edad:</strong> {user.age} años</p>
                )}
              </div>
              
              {user.bio && (
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {user.bio}
                </p>
              )}
              
              <Link href={`/profile/${user.id}`}>
                <Button className="w-full" variant="outline">
                  Ver Perfil Completo
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        /* Estado vacío */
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            ¡Sé el primer usuario verificado!
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Aún no hay perfiles de usuarios registrados. Únete a nuestra comunidad y construye tu reputación como inquilino confiable.
          </p>
          <div className="space-x-4">
            <Link href="/register">
              <Button>
                Crear mi Perfil
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Es gratis y te ayudará a conseguir mejores propiedades
          </p>
        </div>
      )}

      {/* Call to action */}
      <div className="text-center mt-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ¿Eres propietario?
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Con nuestro sistema de perfiles verificados, puedes conocer mejor a tus futuros inquilinos 
          antes de tomar una decisión. Esto reduce riesgos y aumenta la confianza en el proceso de alquiler.
        </p>
        <div className="space-x-4">
          <Link href="/publicar">
            <Button>
              Publicar Propiedad
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">
              Registrarse como Propietario
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
