"use client"

import { MapPin, Users, Star, TrendingUp, Home, CheckCircle, Shield, Clock } from "lucide-react"

export function StatsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Título principal mejorado */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            La Plataforma Inmobiliaria
            <span className="block text-blue-600">Líder en Misiones</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Conectamos propietarios e inquilinos en toda la provincia de Misiones con tecnología de vanguardia y el mejor servicio personalizado.
          </p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Home className="h-10 w-10 text-white" />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">100%</div>
            <div className="text-gray-600 font-medium text-lg">Cobertura Provincial</div>
            <div className="text-sm text-blue-600 mt-2">Toda Misiones</div>
          </div>

          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">100%</div>
            <div className="text-gray-600 font-medium text-lg">Seguridad</div>
            <div className="text-sm text-green-600 mt-2">Verificación completa</div>
          </div>

          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Star className="h-10 w-10 text-white" />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">5★</div>
            <div className="text-gray-600 font-medium text-lg">Calidad</div>
            <div className="text-sm text-yellow-600 mt-2">Servicio premium</div>
          </div>

          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
            <div className="text-gray-600 font-medium text-lg">Disponibilidad</div>
            <div className="text-sm text-purple-600 mt-2">Siempre activo</div>
          </div>
        </div>

        {/* Sección de beneficios mejorada */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Misiones Arrienda?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Somos más que una plataforma, somos tu socio estratégico en el mercado inmobiliario misionero
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-3">Tecnología Avanzada</h4>
              <p className="text-gray-600 leading-relaxed">
                Plataforma moderna con búsqueda inteligente, filtros avanzados y mapas interactivos para encontrar la propiedad perfecta.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-3">Comunidad Activa</h4>
              <p className="text-gray-600 leading-relaxed">
                Red creciente de propietarios, inquilinos y profesionales inmobiliarios comprometidos con la excelencia.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-3">Cobertura Total</h4>
              <p className="text-gray-600 leading-relaxed">
                Desde Posadas hasta Puerto Iguazú, cubrimos toda la provincia con el mismo nivel de calidad y servicio.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-3">Máxima Seguridad</h4>
              <p className="text-gray-600 leading-relaxed">
                Verificación de identidad, propiedades auditadas y sistema de calificaciones para transacciones seguras.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-3">Sin Comisiones Ocultas</h4>
              <p className="text-gray-600 leading-relaxed">
                Transparencia total en costos. Publicación gratuita y planes premium con precios claros y justos.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-bold text-xl text-gray-900 mb-3">Soporte Personalizado</h4>
              <p className="text-gray-600 leading-relaxed">
                Equipo local especializado en el mercado misionero, disponible para ayudarte en cada paso del proceso.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action mejorado */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              ¡Únete a la Revolución Inmobiliaria!
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Sé parte de la plataforma que está transformando el mercado inmobiliario en Misiones. 
              Publica tu propiedad gratis y conecta con miles de usuarios.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/publicar"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors duration-300 shadow-lg"
              >
                <Home className="mr-2 h-5 w-5" />
                Publicar Propiedad Gratis
              </a>
              <a
                href="/register"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-2xl hover:bg-white hover:text-blue-600 transition-colors duration-300"
              >
                <Users className="mr-2 h-5 w-5" />
                Crear Cuenta
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
