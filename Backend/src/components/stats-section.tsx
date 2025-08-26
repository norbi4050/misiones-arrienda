"use client"

import { TrendingUp, Users, Star, Clock, Home, CheckCircle } from "lucide-react"

export function StatsSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Estadísticas de la Plataforma
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conoce los números que respaldan nuestra plataforma inmobiliaria
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">150+</div>
            <div className="text-gray-600 font-medium">Propiedades Activas</div>
            <div className="text-sm text-blue-600 mt-2">En crecimiento</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
            <div className="text-gray-600 font-medium">Usuarios Registrados</div>
            <div className="text-sm text-green-600 mt-2">Comunidad activa</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">4.8★</div>
            <div className="text-gray-600 font-medium">Calificación Promedio</div>
            <div className="text-sm text-yellow-600 mt-2">Excelente servicio</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">24h</div>
            <div className="text-gray-600 font-medium">Tiempo de Respuesta</div>
            <div className="text-sm text-purple-600 mt-2">Soporte rápido</div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-6">
              ¿Por qué elegir Misiones Arrienda?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-300 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white text-lg">Tecnología Avanzada</h4>
                  <p className="text-blue-100">Plataforma moderna con las últimas herramientas</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-300 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white text-lg">Atención Personalizada</h4>
                  <p className="text-blue-100">Cada cliente recibe atención especializada</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-300 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white text-lg">Crecimiento Constante</h4>
                  <p className="text-blue-100">Expandiendo nuestros servicios continuamente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
