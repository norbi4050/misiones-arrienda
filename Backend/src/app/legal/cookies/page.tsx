import { Metadata } from 'next'
import Link from 'next/link'
import { Cookie, Shield, Settings, Info, ExternalLink, Mail } from 'lucide-react'
import { LEGAL_INFO, formatLegalDate, getFullAddress } from '@/lib/legal-constants'

export const metadata: Metadata = {
  title: 'Política de Cookies | Misiones Arrienda',
  description: 'Información sobre el uso de cookies en Misiones Arrienda. Conoce qué cookies utilizamos y cómo gestionarlas.',
  robots: 'index, follow',
  openGraph: {
    title: 'Política de Cookies | Misiones Arrienda',
    description: 'Información sobre el uso de cookies en Misiones Arrienda',
    type: 'website'
  }
}

// FIX 304: Deshabilitar caché para páginas legales
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CookiesPage() {
  const { responsable, contacto } = LEGAL_INFO

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><Link href="/" className="hover:text-blue-600">Inicio</Link></li>
            <li>/</li>
            <li><Link href="/legal/cookies" className="hover:text-blue-600">Legal</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Política de Cookies</li>
          </ol>
        </nav>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Política de Cookies</h1>
            </div>
            <p className="text-orange-100 text-lg">
              Información sobre el uso de cookies y tecnologías similares en nuestra plataforma
            </p>
            <p className="mt-4 text-sm text-orange-200">
              <strong>Última actualización:</strong> {formatLegalDate(new Date(LEGAL_INFO.fechas.ultimaActualizacionPoliticas))}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <div className="prose prose-lg max-w-none">

              {/* Introducción */}
              <section className="mb-10">
                <div className="bg-orange-50 border-l-4 border-orange-600 p-6 rounded-r-lg mb-6">
                  <p className="text-gray-800 leading-relaxed">
                    En <strong>Misiones Arrienda</strong> utilizamos cookies y tecnologías similares para mejorar
                    tu experiencia de navegación, analizar el tráfico del sitio y ofrecer funcionalidades personalizadas.
                    Esta política explica qué son las cookies, cómo las usamos y cómo puedes gestionarlas.
                  </p>
                </div>
              </section>

              {/* ¿Qué son las cookies? */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="h-6 w-6 text-orange-600" />
                  1. ¿Qué son las Cookies?
                </h2>
                <p className="text-gray-700 mb-4">
                  Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (ordenador, tablet,
                  smartphone) cuando visitas un sitio web. Permiten que el sitio reconozca tu dispositivo y recuerde
                  información sobre tu visita, como tus preferencias, idioma y datos de sesión.
                </p>
                <div className="bg-gray-50 rounded-lg p-5">
                  <p className="text-sm text-gray-700">
                    <strong>Nota:</strong> Las cookies no dañan tu dispositivo ni contienen virus. Son ampliamente
                    utilizadas para hacer que los sitios web funcionen de manera más eficiente y proporcionen
                    información a los propietarios del sitio.
                  </p>
                </div>
              </section>

              {/* Tipos de cookies que usamos */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Cookie className="h-6 w-6 text-orange-600" />
                  2. Tipos de Cookies que Utilizamos
                </h2>

                <div className="space-y-6">
                  {/* Cookies Técnicas */}
                  <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      a) Cookies Técnicas y de Sesión (Estrictamente Necesarias)
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Estas cookies son esenciales para el funcionamiento básico del sitio web. Sin ellas,
                      no podrías iniciar sesión, navegar entre páginas o utilizar funciones básicas.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li><strong>Autenticación</strong> - Mantienen tu sesión activa después de iniciar sesión</li>
                      <li><strong>Seguridad</strong> - Protegen contra ataques CSRF y otras vulnerabilidades</li>
                      <li><strong>Preferencias de usuario</strong> - Recuerdan configuraciones básicas</li>
                      <li><strong>Carrito de servicios</strong> - Mantienen tus selecciones de planes premium</li>
                    </ul>
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>Estas cookies NO pueden ser desactivadas</strong> ya que son necesarias para el funcionamiento del sitio.
                    </div>
                  </div>

                  {/* Cookies Analíticas */}
                  <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      b) Cookies Analíticas y de Rendimiento (Opcionales)
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Estas cookies nos ayudan a entender cómo los usuarios interactúan con nuestro sitio,
                      permitiéndonos mejorar la experiencia.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li><strong>Análisis de tráfico</strong> - Páginas más visitadas, tiempo de permanencia</li>
                      <li><strong>Comportamiento de usuario</strong> - Búsquedas, filtros utilizados, clics</li>
                      <li><strong>Detección de errores</strong> - Identificación de problemas técnicos</li>
                      <li><strong>Optimización</strong> - Pruebas A/B para mejorar funcionalidades</li>
                    </ul>
                    <div className="mt-3 p-3 bg-green-100 rounded">
                      <p className="text-sm text-green-800">
                        ✓ <strong>Transparencia:</strong> NO utilizamos Google Analytics ni servicios de terceros
                        para analytics. Todo el análisis se realiza con herramientas propias y nunca compartimos
                        tus datos con empresas externas.
                      </p>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>Estas cookies PUEDEN ser desactivadas</strong> desde tu{' '}
                      <Link href="/privacy-settings" className="text-green-600 hover:underline font-medium">
                        configuración de privacidad
                      </Link>.
                    </div>
                  </div>

                  {/* Cookies de Funcionalidad */}
                  <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-600">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      c) Cookies de Funcionalidad (Opcionales)
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Estas cookies permiten que el sitio recuerde tus elecciones y proporcione características mejoradas.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li><strong>Favoritos</strong> - Propiedades guardadas en tu lista de favoritos</li>
                      <li><strong>Búsquedas guardadas</strong> - Filtros y criterios de búsqueda recientes</li>
                      <li><strong>Preferencias de visualización</strong> - Vista de lista/cuadrícula, orden de resultados</li>
                      <li><strong>Ubicación preferida</strong> - Ciudad o zona de interés</li>
                    </ul>
                  </div>

                  {/* NO usamos cookies de publicidad */}
                  <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-600">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      ❌ NO Utilizamos Cookies de Publicidad o Marketing
                    </h3>
                    <p className="text-gray-700">
                      <strong>Misiones Arrienda NO utiliza cookies de terceros para publicidad dirigida.</strong> No
                      vendemos tu información a anunciantes ni rastreamos tu navegación fuera de nuestro sitio.
                    </p>
                  </div>
                </div>
              </section>

              {/* Duración de las cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. Duración de las Cookies
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">🕐 Cookies de Sesión</h4>
                      <p className="text-gray-700 text-sm">
                        Se eliminan automáticamente cuando cierras el navegador. Se utilizan para autenticación y navegación básica.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📅 Cookies Persistentes</h4>
                      <p className="text-gray-700 text-sm">
                        Permanecen en tu dispositivo durante un período determinado (hasta 12 meses) o hasta que las elimines manualmente.
                        Se utilizan para recordar tus preferencias entre visitas.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cómo gestionar cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="h-6 w-6 text-orange-600" />
                  4. Cómo Gestionar y Desactivar Cookies
                </h2>

                <div className="space-y-6">
                  {/* Configuración en nuestro sitio */}
                  <div className="bg-orange-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      En Nuestro Sitio Web
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Puedes gestionar tus preferencias de cookies directamente desde nuestra plataforma:
                    </p>
                    <Link
                      href="/privacy-settings"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Ir a Configuración de Privacidad
                    </Link>
                  </div>

                  {/* Configuración en el navegador */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      En tu Navegador
                    </h3>
                    <p className="text-gray-700 mb-4">
                      También puedes bloquear o eliminar cookies desde la configuración de tu navegador:
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Google Chrome:</strong>{' '}
                          <a
                            href="https://support.google.com/chrome/answer/95647"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline"
                          >
                            Configuración de cookies en Chrome
                          </a>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Mozilla Firefox:</strong>{' '}
                          <a
                            href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline"
                          >
                            Configuración de cookies en Firefox
                          </a>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Safari:</strong>{' '}
                          <a
                            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline"
                          >
                            Configuración de cookies en Safari
                          </a>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Microsoft Edge:</strong>{' '}
                          <a
                            href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline"
                          >
                            Configuración de cookies en Edge
                          </a>
                        </div>
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-yellow-100 rounded">
                      <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Importante:</strong> Si desactivas las cookies técnicas, algunas funcionalidades
                        del sitio pueden no funcionar correctamente (por ejemplo, no podrás iniciar sesión).
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contacto */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Contacto para Consultas sobre Cookies
                </h2>
                <p className="text-gray-700 mb-6">
                  Si tienes preguntas sobre nuestra política de cookies o deseas más información:
                </p>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <a href={`mailto:${contacto.email}?subject=Consulta sobre Cookies`} className="text-orange-600 hover:underline">
                        {contacto.email}
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* Enlaces relacionados */}
              <section className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Relacionados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/legal/privacy"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Política de Privacidad</span>
                  </Link>
                  <Link
                    href="/privacy-settings"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Configurar Privacidad</span>
                  </Link>
                  <Link
                    href="/legal/terms"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Términos y Condiciones</span>
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
