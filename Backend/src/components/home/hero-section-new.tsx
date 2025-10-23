"use client"

import { DualSearchBar } from './dual-search-bar'

export function HeroSectionNew() {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
      {/* Decoraciones de fondo */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        {/* Headline */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            La nueva forma de alquilar en Misiones
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-6">
            Propiedades, Roommates y tu Sitio Web - Todo en uno
          </p>

          {/* USP Pills - Above the fold */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-all">
              <span>🤝</span>
              <span>Comunidad de Roommates</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-all">
              <span>🏢</span>
              <span>Sitio Web Gratis para Inmobiliarias</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-all">
              <span>💰</span>
              <span>0% Comisión</span>
            </span>
          </div>
        </div>

        {/* Buscador Dual */}
        <DualSearchBar />
      </div>
    </section>
  )
}
