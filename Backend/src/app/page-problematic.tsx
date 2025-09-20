import { Metadata } from 'next'

// Configuración para páginas dinámicas con searchParams
export const dynamic = 'force-dynamic'

// Cache configurado para producción - temporalmente 0 para testing
export const revalidate = 0

// Metadatos dinámicos para SEO
export const metadata: Metadata = {
  title: 'Misiones Arrienda - Propiedades en Alquiler y Venta en Misiones',
  description: 'Encuentra las mejores propiedades en alquiler y venta en Misiones. Casas, departamentos, habitaciones compartidas en Posadas, Oberá, Eldorado y más ciudades.',
}

// Función para obtener el conteo real de propiedades
async function getPropertiesCount() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/properties-count`, {
      cache: 'no-store'
    })
    if (!response.ok) return 0
    const data = await response.json()
    return data.count || 0
  } catch (error) {
    console.error('Error obteniendo conteo de propiedades:', error)
    return 0
  }
}

// Definir tipos para searchParams
type SearchParams = { [key: string]: string | string[] | undefined }

interface HomePageProps {
  searchParams: SearchParams
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Obtener conteo real de propiedades
  const propertiesCount = await getPropertiesCount()
  return (
    <main className="min-h-screen">
      {/* Hero Section con Logo */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            {/* Título sin logo */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-5xl font-bold">
                Encuentra tu propiedad ideal
              </h1>
            </div>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              Casas, departamentos y habitaciones compartidas en alquiler y venta
            </p>
          </div>
        </div>
      </div>

      <section id="propiedades" className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Propiedades Disponibles
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explora las mejores propiedades en alquiler y venta en Misiones
          </p>
        </div>

        {/* Sección mejorada de Propiedades Disponibles */}
        <div className="flex justify-center py-16">
          <div className="max-w-lg mx-auto">
            {/* Tarjeta elegante sin logo arriba */}
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              
              {/* Ícono de edificio mejorado */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
                  <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>

              {/* Título principal */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                ¡Propiedades Disponibles!
              </h3>

              {/* Descripción */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                {propertiesCount > 0 
                  ? `Descubre ${propertiesCount} ${propertiesCount === 1 ? 'propiedad disponible' : 'propiedades disponibles'} en toda la provincia. Casas, departamentos y habitaciones compartidas te esperan.`
                  : 'Próximamente tendremos las mejores propiedades de la provincia. Casas, departamentos y habitaciones compartidas en las mejores ubicaciones.'
                }
              </p>

              {/* Botones mejorados */}
              <div className="space-y-4">
                <a
                  href="/properties"
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver Propiedades
                </a>

                {/* Separador elegante */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-px bg-gray-300 flex-1"></div>
                  <span className="text-sm text-gray-500 px-3">o</span>
                  <div className="h-px bg-gray-300 flex-1"></div>
                </div>

                {/* Botón secundario */}
                <a
                  href="/publicar"
                  className="inline-flex items-center px-6 py-2 border-2 border-primary text-primary font-medium rounded-full hover:bg-primary hover:text-white transition-all duration-200"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Publicar Propiedad
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
