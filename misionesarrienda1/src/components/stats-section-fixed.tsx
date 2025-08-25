"use client"

import { TrendingUp, Users, Star, Clock, Home, CheckCircle } from "lucide-react"

export function StatsSection() {
  // FORZAR ESTADÍSTICAS DE PLATAFORMA NUEVA - SOLUCIÓN DIRECTA
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 ¡Plataforma Nueva, Oportunidades Infinitas!
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Somos una plataforma nueva con grandes ambiciones. Únete a nosotros desde el inicio y sé parte de la revolución inmobiliaria en Misiones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-gray-600 font-medium">Propiedades Actuales</div>
            <div className="text-sm text-gray-500 mt-1">¡Sé el primero en publicar!</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">0</div>
            <div className="text-gray-600 font-medium">Usuarios Registrados</div>
            <div className="text-sm text-gray-500 mt-1">¡Únete a la comunidad!</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">5.0★</div>
            <div className="text-gray-600 font-medium">Objetivo de Calidad</div>
            <div className="text-sm text-gray-500 mt-1">Excelencia desde el día 1</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">2 horas</div>
            <div className="text-gray-600 font-medium">Tiempo de Respuesta</div>
            <div className="text-sm text-gray-500 mt-1">Garantizado</div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🌟 ¿Por qué elegir una plataforma nueva?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Atención Personalizada</h4>
                  <p className="text-gray-600 text-sm">Cada usuario es importante para nosotros</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Tecnología Moderna</h4>
                  <p className="text-gray-600 text-sm">Plataforma construida con las últimas tecnologías</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Crecimiento Conjunto</h4>
                  <p className="text-gray-600 text-sm">Crece con nosotros desde el principio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
