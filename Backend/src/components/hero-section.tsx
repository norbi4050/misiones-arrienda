"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Map, MessageSquare, Star, Home, Users } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative">
      {/* Hero Principal */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Encuentra tu propiedad ideal en Misiones
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Casas, Departamentos y Habitaciones Compartidas
            </p>
            
            {/* Botones principales */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/properties">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 w-full sm:w-auto">
                  Buscar propiedades
                </Button>
              </Link>
              <Link href="/publicar">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6 w-full sm:w-auto">
                  Publica tu propiedad
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 2 - Comunidad */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Habitaciones compartidas y comunidad
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Conectá con personas que buscan compartir vivienda. Encontrá compañeros de cuarto ideales y espacios compartidos.
              </p>
              <Link href="/comunidad">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Explorar comunidad
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bloque 3 - Diferenciales (4 columnas) */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            ¿Por qué elegir Misiones Arrienda?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Propiedades verificadas */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Propiedades verificadas
                </h3>
                <p className="text-sm text-gray-600">
                  Todas las publicaciones son revisadas para garantizar su autenticidad
                </p>
              </CardContent>
            </Card>

            {/* Mapa interactivo */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 pb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Map className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Mapa interactivo
                </h3>
                <p className="text-sm text-gray-600">
                  Visualizá todas las propiedades en un mapa para encontrar la ubicación perfecta
                </p>
              </CardContent>
            </Card>

            {/* Mensajería segura */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 pb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Mensajería interna segura
                </h3>
                <p className="text-sm text-gray-600">
                  Contactá directamente con propietarios de forma segura y privada
                </p>
              </CardContent>
            </Card>

            {/* Publicaciones destacadas */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 pb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Publicaciones destacadas
                </h3>
                <p className="text-sm text-gray-600">
                  Destacá tu propiedad para mayor visibilidad y más consultas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bloque 4 - Publicación con slogan */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Publicar ahora, conectar más rápido
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Miles de personas buscan propiedades en Misiones todos los días. Publicá tu propiedad y encontrá inquilinos o compradores rápidamente.
          </p>
          <Link href="/publicar">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-xl px-12 py-8 font-semibold">
              Publicar mi propiedad
            </Button>
          </Link>
        </div>
      </div>

      {/* Bloque 5 - Próximamente */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Próximamente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mapa Interactivo */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Mapa Interactivo
                </h3>
                <p className="text-gray-700">
                  Explorá propiedades en un mapa interactivo con filtros avanzados y visualización en tiempo real
                </p>
              </CardContent>
            </Card>

            {/* Unidades en pozo */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🏗️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Unidades en pozo
                </h3>
                <p className="text-gray-700">
                  Invertí en propiedades en construcción con planes de financiación y seguimiento de obra
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
