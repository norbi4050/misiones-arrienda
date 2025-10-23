"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Building2, DollarSign, Check } from 'lucide-react'

export function ValuePropositionSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">
          ¿Qué hace diferente a Misiones Arrienda?
        </h2>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
          No somos un portal inmobiliario más. Somos una plataforma completa para la comunidad de Misiones.
        </p>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Card 1: Comunidad */}
          <Card className="text-center hover:shadow-2xl transition-all border-2 border-transparent hover:border-purple-300">
            <CardContent className="pt-10 pb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">🤝 Comunidad de Roommates</h3>
              <p className="text-gray-600 mb-6">
                La <strong>única plataforma</strong> en Misiones donde podés buscar compañeros de casa,
                compartir departamento y encontrar gente compatible.
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Perfiles verificados</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Filtros por estilo de vida</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Chat directo y seguro</span>
                </li>
              </ul>
              <Link href="/comunidad" prefetch={false}>
                <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                  Explorar Comunidad →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 2: Sitio Web para Inmobiliarias */}
          <Card className="text-center border-2 border-blue-500 hover:shadow-2xl transition-all relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                EXCLUSIVO
              </span>
            </div>
            <CardContent className="pt-10 pb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">🏢 Tu Sitio Web Incluido</h3>
              <p className="text-gray-600 mb-6">
                ¿Sos inmobiliaria? Obtenés <strong>tu propia página web profesional</strong> dentro
                de la plataforma. Sin costos extra.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                <code className="text-blue-800 break-all">
                  misionesarrienda.com.ar/<strong>tu-empresa</strong>
                </code>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                + Tracking, destacados, analytics y más
              </p>
              <Link href="/mi-empresa/planes" prefetch={false}>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                  Ver Planes Fundadores →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 3: Gratis */}
          <Card className="text-center hover:shadow-2xl transition-all border-2 border-transparent hover:border-green-300">
            <CardContent className="pt-10 pb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">💰 Publicá Gratis Hoy</h3>
              <p className="text-gray-600 mb-6">
                <strong>Sin comisiones ocultas.</strong> Publicá tu propiedad o perfil de roommate
                completamente gratis.
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>0% comisión</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Hasta 10 fotos por propiedad (plan free)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Mensajería directa incluida</span>
                </li>
              </ul>
              <Link href="/publicar" prefetch={false}>
                <Button className="bg-green-600 hover:bg-green-700 w-full">
                  Publicar Ahora →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
