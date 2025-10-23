"use client"

import { Heart, Users, Sparkles } from 'lucide-react'

export function MissionBanner() {
  return (
    <section className="py-12 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-y-2 border-blue-200">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            🌟 Construyendo la plataforma inmobiliaria de Misiones
          </h3>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            Nuestro objetivo es simple: <strong>conectar a toda la provincia</strong> en un solo lugar.
            Ya sea que busques alquilar, comprar, compartir vivienda o hacer crecer tu inmobiliaria,
            esta es <strong>tu plataforma misionera</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-medium">Hecho en Misiones, para Misiones</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Comunidad local primero</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Innovación al servicio de la región</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
