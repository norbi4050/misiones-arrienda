import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Encuentra tu hogar ideal en Misiones
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              La plataforma líder en alquiler de propiedades en la provincia de Misiones
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/properties">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Buscar Propiedades
                </Button>
              </Link>
              <Link href="/publicar">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Publicar Propiedad
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Misiones Arrienda?
            </h2>
            <p className="text-lg text-gray-600">
              Conectamos propietarios e inquilinos de manera segura y eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    🏠
                  </div>
                  Amplio Catálogo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Miles de propiedades disponibles en toda la provincia de Misiones. 
                  Casas, departamentos, locales comerciales y más.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    🔒
                  </div>
                  Seguridad Garantizada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Verificamos la identidad de todos nuestros usuarios y propiedades 
                  para garantizar transacciones seguras.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    📱
                  </div>
                  Fácil de Usar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Plataforma intuitiva y moderna que te permite encontrar o publicar 
                  propiedades en pocos minutos.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Principales Ciudades
            </h2>
            <p className="text-lg text-gray-600">
              Encuentra propiedades en las principales ciudades de Misiones
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Posadas', count: '500+' },
              { name: 'Oberá', count: '200+' },
              { name: 'Eldorado', count: '150+' },
              { name: 'Puerto Iguazú', count: '180+' },
              { name: 'Apóstoles', count: '80+' },
              { name: 'Leandro N. Alem', count: '60+' },
              { name: 'San Vicente', count: '45+' },
              { name: 'Montecarlo', count: '35+' }
            ].map((city) => (
              <Card key={city.name} className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{city.name}</CardTitle>
                  <CardDescription>{city.count} propiedades</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para encontrar tu próximo hogar?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Únete a miles de usuarios que ya confían en Misiones Arrienda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Crear Cuenta Gratis
              </Button>
            </Link>
            <Link href="/properties">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Ver Propiedades
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Misiones Arrienda</h3>
              <p className="text-gray-400">
                La plataforma líder en alquiler de propiedades en Misiones.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/properties" className="hover:text-white">Propiedades</Link></li>
                <li><Link href="/publicar" className="hover:text-white">Publicar</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white">Términos y Condiciones</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Política de Privacidad</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <p className="text-gray-400">
                Email: info@misionesarrienda.com<br />
                Teléfono: (0376) 123-4567
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Misiones Arrienda. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
