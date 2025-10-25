import { Metadata } from 'next'
import Link from 'next/link'
import { Info, Target, Users, Heart, Shield, TrendingUp, AlertTriangle, Building2, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Acerca de Misiones Arrienda | Quiénes Somos',
  description: 'Conoce Misiones Arrienda, la plataforma de clasificados inmobiliarios de Misiones, Argentina. Conectamos inquilinos y propietarios de forma transparente y segura.',
  robots: 'index, follow',
  openGraph: {
    title: 'Acerca de Misiones Arrienda',
    description: 'La plataforma de clasificados inmobiliarios de Misiones, Argentina',
    type: 'website'
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><Link href="/" prefetch={false} className="hover:text-cyan-600">Inicio</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Acerca de</li>
          </ol>
        </nav>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-8 py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Acerca de Misiones Arrienda</h1>
            </div>
            <p className="text-cyan-100 text-lg">
              La plataforma de clasificados inmobiliarios de Misiones, Argentina
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <div className="prose prose-lg max-w-none">

              {/* Quiénes somos */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-cyan-600" />
                  ¿Quiénes Somos?
                </h2>
                <div className="bg-cyan-50 border-l-4 border-cyan-600 p-6 rounded-r-lg mb-4">
                  <p className="text-gray-800 leading-relaxed">
                    <strong>Misiones Arrienda</strong> es una plataforma digital de clasificados inmobiliarios
                    enfocada en la provincia de Misiones, Argentina. Conectamos inquilinos, compradores y
                    propietarios de forma directa, transparente y segura.
                  </p>
                </div>
                <p className="text-gray-700 mb-4">
                  Nacimos con la misión de simplificar el proceso de búsqueda de propiedades en Misiones,
                  ofreciendo una herramienta moderna, accesible y sin intermediarios innecesarios.
                </p>
              </section>

              {/* Importante: NO somos inmobiliaria */}
              <section className="mb-10">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        Información Importante sobre Nuestra Naturaleza
                      </h3>
                      <div className="text-gray-800 space-y-2">
                        <p>
                          <strong>Misiones Arrienda es una plataforma de clasificados, NO una inmobiliaria.</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>NO intermediamos en transacciones de compra, venta o alquiler</li>
                          <li>NO gestionamos pagos entre propietarios e inquilinos</li>
                          <li>NO verificamos ni garantizamos la veracidad de la información publicada</li>
                          <li>NO representamos legalmente a propietarios ni inquilinos</li>
                          <li>NO somos responsables de acuerdos realizados entre usuarios</li>
                        </ul>
                        <p className="mt-3 text-sm">
                          <strong>Actuamos como intermediarios tecnológicos</strong>, proporcionando una herramienta
                          para que usuarios publiquen y busquen propiedades de forma autónoma.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Qué hacemos */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="h-6 w-6 text-cyan-600" />
                  ¿Qué Hacemos?
                </h2>
                <p className="text-gray-700 mb-4">
                  Nuestra plataforma ofrece:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-5 border-l-4 border-green-600">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Publicación de Propiedades
                    </h3>
                    <p className="text-sm text-gray-700">
                      Propietarios e inmobiliarias pueden publicar anuncios de alquiler y venta de forma gratuita o destacada.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-600">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      Búsqueda Avanzada
                    </h3>
                    <p className="text-sm text-gray-700">
                      Filtros por ubicación, precio, tipo de propiedad, ambientes y más para encontrar el inmueble ideal.
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-5 border-l-4 border-purple-600">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      Contacto Directo
                    </h3>
                    <p className="text-sm text-gray-700">
                      Comunicación directa entre interesados y publicantes, sin intermediarios ni comisiones ocultas.
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-5 border-l-4 border-orange-600">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                      Sistema de Reportes
                    </h3>
                    <p className="text-sm text-gray-700">
                      Herramientas para denunciar anuncios sospechosos y mantener la plataforma segura.
                    </p>
                  </div>
                </div>
              </section>

              {/* Misión y Visión */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="h-6 w-6 text-cyan-600" />
                  Nuestra Misión y Visión
                </h2>
                <div className="space-y-4">
                  <div className="bg-cyan-50 rounded-lg p-6">
                    <h3 className="font-semibold text-cyan-900 mb-2">🎯 Misión</h3>
                    <p className="text-gray-700 text-sm">
                      Facilitar el acceso a vivienda en Misiones mediante una plataforma tecnológica moderna,
                      accesible y transparente que conecte directamente a inquilinos, compradores y propietarios,
                      eliminando barreras y reduciendo costos innecesarios.
                    </p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-6">
                    <h3 className="font-semibold text-teal-900 mb-2">🌟 Visión</h3>
                    <p className="text-gray-700 text-sm">
                      Ser la plataforma de referencia en clasificados inmobiliarios de Misiones, reconocida por
                      su confiabilidad, seguridad y compromiso con la comunidad local.
                    </p>
                  </div>
                </div>
              </section>

              {/* Valores */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-cyan-600" />
                  Nuestros Valores
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">🔒 Transparencia</h3>
                    <p className="text-sm text-gray-700">
                      Comunicamos claramente nuestra función como plataforma de clasificados, sin ocultar información ni crear expectativas falsas.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">🛡️ Seguridad</h3>
                    <p className="text-sm text-gray-700">
                      Protegemos los datos personales de nuestros usuarios y trabajamos constantemente para detectar y prevenir fraudes.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">🤝 Accesibilidad</h3>
                    <p className="text-sm text-gray-700">
                      Ofrecemos opciones gratuitas y de bajo costo para democratizar el acceso a servicios inmobiliarios digitales.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">💡 Innovación</h3>
                    <p className="text-sm text-gray-700">
                      Mejoramos continuamente nuestra plataforma con tecnología moderna y feedback de usuarios.
                    </p>
                  </div>
                </div>
              </section>

              {/* Recomendación profesional */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-cyan-600" />
                  Recomendación: Asesoramiento Profesional
                </h2>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                  <p className="text-gray-800 mb-3">
                    Si bien facilitamos el contacto entre usuarios, <strong>recomendamos encarecidamente</strong> que,
                    al momento de concretar una operación inmobiliaria, cuentes con el asesoramiento de:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>
                      <strong>Corredores inmobiliarios matriculados</strong> del Colegio de Corredores Inmobiliarios
                      de la Provincia de Misiones (CCPIM)
                    </li>
                    <li>
                      <strong>Abogados especializados en derecho inmobiliario</strong> para revisar contratos y documentación
                    </li>
                    <li>
                      <strong>Escribanos públicos</strong> para operaciones de compraventa
                    </li>
                  </ul>
                  <p className="text-gray-700 mt-3 text-sm">
                    Estos profesionales te ayudarán a verificar la legalidad de la operación, proteger tus derechos
                    y evitar posibles fraudes.
                  </p>
                </div>
              </section>

              {/* Compromiso con la comunidad */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-cyan-600" />
                  Compromiso con la Comunidad de Misiones
                </h2>
                <p className="text-gray-700 mb-4">
                  Estamos comprometidos con el desarrollo de Misiones y su comunidad:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Enfoque local:</strong> 100% dedicados a propiedades en Misiones, Argentina</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Apoyo a pequeños propietarios:</strong> Opciones gratuitas para publicar sin costo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Colaboración con inmobiliarias locales:</strong> Planes especiales para profesionales del sector</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Transparencia de costos:</strong> Sin comisiones ocultas ni cargos sorpresa</span>
                  </li>
                </ul>
              </section>

              {/* Contacto */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Contacto
                </h2>
                <p className="text-gray-700 mb-4">
                  ¿Tienes preguntas, sugerencias o comentarios? Nos encantaría escucharte:
                </p>
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-6">
                  <p className="text-gray-700 mb-2">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:cgonzalezarchilla@gmail.com" className="text-cyan-600 hover:underline">
                      cgonzalezarchilla@gmail.com
                    </a>
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Teléfono:</strong>{' '}
                    <a href="tel:+5491130875304" className="text-cyan-600 hover:underline">
                      +54 9 11 3087 5304
                    </a>
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Horario:</strong> Lunes a Viernes, 9:00 a 18:00 hs (GMT-3)
                  </p>
                </div>
              </section>

              {/* Enlaces relacionados */}
              <section className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Más Información</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/legal/terms"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Términos y Condiciones</span>
                  </Link>
                  <Link
                    href="/legal/privacy"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Política de Privacidad</span>
                  </Link>
                  <Link
                    href="/legal/security"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-gray-900">Política de Seguridad</span>
                  </Link>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
