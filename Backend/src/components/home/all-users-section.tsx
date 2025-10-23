"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Home, Building2, Check, Crown } from 'lucide-react'

export function AllUsersSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">¿Quién puede usar Misiones Arrienda?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ya seas inquilino, propietario o inmobiliaria, tenemos el espacio perfecto para vos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* INQUILINOS */}
          <Card className="hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-400">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">🏠 Inquilinos</h3>
              <p className="text-gray-600 mb-6">
                Buscás tu próximo hogar en Misiones
              </p>
              <ul className="text-left text-sm space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Buscá por ciudad, barrio y precio</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Contactá directamente con dueños</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Encontrá roommates compatibles</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Guardá favoritos y recibí alertas</span>
                </li>
              </ul>
              <Link href="/register?type=inquilino" prefetch={false}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Registrarme como Inquilino
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* DUEÑOS DIRECTOS */}
          <Card className="hover:shadow-2xl transition-all border-2 border-transparent hover:border-green-400">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">🔑 Dueños Directos</h3>
              <p className="text-gray-600 mb-6">
                Tenés propiedades para alquilar o vender
              </p>
              <ul className="text-left text-sm space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Publicá gratis, sin comisiones</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Alquilá sin intermediarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Chat directo con interesados</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Hasta 10 fotos por propiedad</span>
                </li>
              </ul>
              <Link href="/dueno-directo/register" prefetch={false}>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Registrarme como Dueño
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* INMOBILIARIAS */}
          <Card className="hover:shadow-2xl transition-all border-2 border-purple-400 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
              <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                PLANES ESPECIALES
              </span>
            </div>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">🏢 Inmobiliarias</h3>
              <p className="text-gray-600 mb-6">
                Hacé crecer tu negocio inmobiliario
              </p>
              <ul className="text-left text-sm space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Crown className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                  <span><strong>Tu sitio web incluido</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Hasta 20 propiedades activas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Destacá propiedades ilimitado</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Analytics y tracking en tiempo real</span>
                </li>
              </ul>
              <Link href="/inmobiliaria/register" prefetch={false}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Registrar mi Inmobiliaria
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
