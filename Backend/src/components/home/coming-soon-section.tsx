"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Rocket } from 'lucide-react'

export function ComingSoonSection() {
  const upcomingFeatures = [
    {
      emoji: '🏗️',
      title: 'Unidades en Pozo',
      description: 'Perfil especial para empresas constructoras. Publicá desarrollos inmobiliarios en construcción con planos, avances de obra y financiación.',
      quarter: 'Q2 2025',
      badgeColor: 'bg-yellow-500/20 text-yellow-300'
    },
    {
      emoji: '🗺️',
      title: 'Mapa Interactivo',
      description: 'Explorá propiedades en un mapa interactivo. Filtrá por zona, dibujá tu área de búsqueda ideal y encontrá la ubicación perfecta.',
      quarter: 'Q1 2025',
      badgeColor: 'bg-green-500/20 text-green-300'
    },
    {
      emoji: '🤖',
      title: 'Asistente IA',
      description: 'Nuestro chatbot inteligente te ayudará a encontrar la propiedad perfecta según tus necesidades, presupuesto y preferencias.',
      quarter: 'Q3 2025',
      badgeColor: 'bg-purple-500/20 text-purple-300'
    },
    {
      emoji: '🎥',
      title: 'Tours Virtuales 360°',
      description: 'Recorridos virtuales inmersivos de propiedades. Visitá departamentos y casas desde tu celular como si estuvieras ahí.',
      quarter: 'Q2 2025',
      badgeColor: 'bg-blue-500/20 text-blue-300'
    },
    {
      emoji: '💰',
      title: 'Calculadora de Créditos',
      description: 'Simulá créditos hipotecarios, calculá cuotas y compará opciones de bancos directamente en la plataforma.',
      quarter: 'Q3 2025',
      badgeColor: 'bg-orange-500/20 text-orange-300'
    },
    {
      emoji: '🏖️',
      title: 'Alquileres Temporarios',
      description: 'Sección especial para cabañas, departamentos turísticos y alquileres por día/semana en toda la provincia.',
      quarter: 'Q2 2025',
      badgeColor: 'bg-pink-500/20 text-pink-300'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
      {/* Estrellas de fondo animadas */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-40 right-10 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Rocket className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Roadmap 2025</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Próximamente en Misiones Arrienda
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Estamos construyendo el futuro del mercado inmobiliario misionero.
            Estas son algunas de las funcionalidades que vienen...
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {upcomingFeatures.map((feature, index) => (
            <Card
              key={index}
              className="bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:border-white/40 transition-all hover:scale-105"
            >
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-6xl mb-4">{feature.emoji}</div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-blue-200 mb-4 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <span className={`inline-block ${feature.badgeColor} text-xs font-bold px-3 py-1 rounded-full`}>
                  {feature.quarter}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-blue-200 mb-6">
            ¿Tenés sugerencias? ¿Qué funcionalidad te gustaría ver?
          </p>
          <Link href="/about#contacto" prefetch={false}>
            <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-8">
              Contanos tu idea →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
