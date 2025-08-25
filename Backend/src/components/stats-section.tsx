"use client"

import { TrendingUp, Users, Star, Clock, Home, CheckCircle } from "lucide-react"

export function StatsSection() {
  // 🚨 SOLUCIÓN EXTREMA ANTI-CACHE - CAMBIO TOTAL DEL COMPONENTE 🚨
  // TIMESTAMP: 2024-12-19 15:30 - FORZAR ACTUALIZACIÓN COMPLETA
  return (
    <section className="py-20 bg-gradient-to-br from-red-100 via-green-100 to-blue-200 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-black text-red-700 mb-6 animate-pulse">
            🔥 ESTADÍSTICAS 100% REALES - PLATAFORMA NUEVA 🔥
          </h2>
          <p className="text-2xl text-gray-900 max-w-4xl mx-auto font-bold bg-yellow-200 p-4 rounded-lg border-4 border-yellow-400">
            ⚡ TRANSPARENCIA TOTAL: Somos completamente nuevos. ¡Únete desde el DÍA UNO! ⚡
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="bg-red-100 border-8 border-red-400 rounded-2xl shadow-2xl p-8 text-center transform hover:scale-110 transition-all duration-500 animate-bounce">
            <div className="w-24 h-24 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-500">
              <Home className="h-12 w-12 text-red-700" />
            </div>
            <div className="text-8xl font-black text-red-700 mb-4 animate-pulse">0</div>
            <div className="text-gray-900 font-black text-xl bg-white p-2 rounded-lg">PROPIEDADES REALES</div>
            <div className="text-lg text-red-700 mt-3 font-black bg-red-200 p-2 rounded-lg">🚀 ¡SÉ EL PRIMERO!</div>
          </div>

          <div className="bg-green-100 border-8 border-green-400 rounded-2xl shadow-2xl p-8 text-center transform hover:scale-110 transition-all duration-500 animate-bounce">
            <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-500">
              <Users className="h-12 w-12 text-green-700" />
            </div>
            <div className="text-8xl font-black text-green-700 mb-4 animate-pulse">0</div>
            <div className="text-gray-900 font-black text-xl bg-white p-2 rounded-lg">USUARIOS REALES</div>
            <div className="text-lg text-green-700 mt-3 font-black bg-green-200 p-2 rounded-lg">🎯 ¡ÚNETE AHORA!</div>
          </div>

          <div className="bg-yellow-100 border-8 border-yellow-400 rounded-2xl shadow-2xl p-8 text-center transform hover:scale-110 transition-all duration-500 animate-bounce">
            <div className="w-24 h-24 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-500">
              <Star className="h-12 w-12 text-yellow-700" />
            </div>
            <div className="text-8xl font-black text-yellow-700 mb-4 animate-pulse">5.0★</div>
            <div className="text-gray-900 font-black text-xl bg-white p-2 rounded-lg">OBJETIVO CALIDAD</div>
            <div className="text-lg text-yellow-700 mt-3 font-black bg-yellow-200 p-2 rounded-lg">⭐ EXCELENCIA</div>
          </div>

          <div className="bg-purple-100 border-8 border-purple-400 rounded-2xl shadow-2xl p-8 text-center transform hover:scale-110 transition-all duration-500 animate-bounce">
            <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-purple-500">
              <Clock className="h-12 w-12 text-purple-700" />
            </div>
            <div className="text-8xl font-black text-purple-700 mb-4 animate-pulse">2h</div>
            <div className="text-gray-900 font-black text-xl bg-white p-2 rounded-lg">RESPUESTA RÁPIDA</div>
            <div className="text-lg text-purple-700 mt-3 font-black bg-purple-200 p-2 rounded-lg">⚡ GARANTIZADO</div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 text-white rounded-3xl shadow-2xl p-12 max-w-6xl mx-auto border-8 border-white">
            <h3 className="text-5xl font-black mb-8 animate-pulse">
              🚀 PLATAFORMA NUEVA = OPORTUNIDAD HISTÓRICA 🚀
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="flex items-start bg-white/20 p-6 rounded-xl">
                <CheckCircle className="h-12 w-12 text-green-300 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-white text-2xl">ATENCIÓN VIP 1:1</h4>
                  <p className="text-blue-100 text-lg font-semibold">Cada usuario recibe atención de CEO</p>
                </div>
              </div>
              <div className="flex items-start bg-white/20 p-6 rounded-xl">
                <CheckCircle className="h-12 w-12 text-green-300 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-white text-2xl">TECNOLOGÍA 2024</h4>
                  <p className="text-blue-100 text-lg font-semibold">IA, Machine Learning, última generación</p>
                </div>
              </div>
              <div className="flex items-start bg-white/20 p-6 rounded-xl">
                <CheckCircle className="h-12 w-12 text-green-300 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-white text-2xl">CRECIMIENTO EXPLOSIVO</h4>
                  <p className="text-blue-100 text-lg font-semibold">Crece con nosotros desde el minuto 1</p>
                </div>
              </div>
            </div>
            
            <div className="mt-10 bg-yellow-400 text-black p-6 rounded-2xl border-4 border-yellow-600">
              <h4 className="text-3xl font-black mb-4">⚡ ACTUALIZACIÓN EN VIVO - 19 DIC 2024 ⚡</h4>
              <p className="text-xl font-bold">Este componente fue actualizado hace minutos. Si ves datos falsos, hay un problema de cache.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
