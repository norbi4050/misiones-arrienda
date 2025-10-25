import { Metadata } from 'next'
import Link from 'next/link'
import { Award, Target, TrendingUp, FileText, Shield, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react'
import { LEGAL_INFO, formatLegalDate } from '@/lib/legal-constants'

// FIX 304: Deshabilitar caché para páginas legales
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Política de Gestión de Calidad | Misiones Arrienda',
  description: 'Política de gestión de calidad y mejora continua de Misiones Arrienda.',
  robots: 'index, follow'
}

export default function QualityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><Link href="/" prefetch={false}>Inicio</Link></li>
            <li>/</li>
            <li><Link href="/legal/quality">Legal</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Política de Calidad</li>
          </ol>
        </nav>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Política de Gestión de Calidad</h1>
            </div>
            <p className="text-purple-100 text-lg">
              Compromiso con la excelencia y mejora continua
            </p>
            <p className="mt-4 text-sm text-purple-200">
              <strong>Última actualización:</strong> {formatLegalDate(new Date(LEGAL_INFO.fechas.ultimaActualizacionPoliticas))}
            </p>
          </div>

          <div className="px-8 py-10">

            {/* Introducción */}
            <section className="mb-10">
              <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-r-lg">
                <p className="text-gray-800 leading-relaxed">
                  En <strong>Misiones Arrienda</strong> estamos comprometidos con la excelencia en todos los
                  aspectos de nuestro servicio. Esta política establece nuestros estándares de calidad, procesos
                  de mejora continua y el compromiso con nuestros usuarios.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                1. Objetivos de Calidad
              </h2>
              <p className="text-gray-700 mb-4">
                Nuestros objetivos de calidad se centran en brindar el mejor servicio posible:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-5 border-l-4 border-purple-600">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Confiabilidad y Seguridad
                  </h3>
                  <p className="text-sm text-gray-700">
                    Proporcionar una plataforma estable, segura y protegida contra vulnerabilidades,
                    garantizando la integridad de los datos de nuestros usuarios.
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-600">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Precisión de Información
                  </h3>
                  <p className="text-sm text-gray-700">
                    Garantizar que la información de propiedades sea precisa y actualizada mediante
                    procesos de verificación y moderación.
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-5 border-l-4 border-green-600">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Tiempos de Respuesta
                  </h3>
                  <p className="text-sm text-gray-700">
                    Mantener tiempos de carga óptimos (menos de 2 segundos) y responder consultas
                    de soporte en un plazo máximo de 48 horas hábiles.
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-5 border-l-4 border-orange-600">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Mejora Continua
                  </h3>
                  <p className="text-sm text-gray-700">
                    Evolucionar constantemente basándonos en feedback de usuarios, análisis de datos
                    y mejores prácticas de la industria.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                2. Alcance del Sistema de Gestión de Calidad
              </h2>
              <p className="text-gray-700 mb-4">
                Nuestro sistema de gestión de calidad abarca todos los aspectos de la plataforma:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Desarrollo y Mantenimiento Técnico</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Code reviews, testing automatizado, monitoreo de errores y actualizaciones de seguridad.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Atención al Usuario y Soporte</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Respuestas rápidas, resolución efectiva de problemas y seguimiento de consultas.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Moderación de Contenido</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Revisión de publicaciones reportadas, detección de fraudes y eliminación de contenido inapropiado.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Seguridad de la Información</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Protección de datos personales, encriptación, backups regulares y auditorías de seguridad.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-semibold text-sm">5</span>
                  </div>
                  <div>
                    <strong className="text-gray-900">Procesamiento de Pagos</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      Transacciones seguras vía MercadoPago, facturación precisa y gestión de reembolsos.
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
                3. Indicadores de Calidad
              </h2>
              <p className="text-gray-700 mb-4">
                Medimos nuestro desempeño mediante indicadores clave (KPIs):
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📊 Métricas Técnicas</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Uptime: ≥ 99.5%</li>
                      <li>• Tiempo de carga: &lt; 2 segundos</li>
                      <li>• Tasa de errores: &lt; 0.1%</li>
                      <li>• Disponibilidad de API: ≥ 99%</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">👥 Métricas de Usuario</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Tiempo de respuesta soporte: &lt; 48h</li>
                      <li>• Resolución reportes: &lt; 7 días</li>
                      <li>• Satisfacción del usuario: ≥ 4/5</li>
                      <li>• Tasa de retención: ≥ 70%</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🔒 Métricas de Seguridad</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Incidentes de seguridad: 0</li>
                      <li>• Tiempo de parche vulnerabilidades: &lt; 72h</li>
                      <li>• Backups exitosos: 100%</li>
                      <li>• Auditorías de seguridad: trimestrales</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📝 Métricas de Contenido</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Anuncios fraudulentos: &lt; 0.5%</li>
                      <li>• Tiempo revisión reportes: &lt; 24h</li>
                      <li>• Precisión de moderación: ≥ 95%</li>
                      <li>• Respuesta a denuncias: 100%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                4. Proceso de Mejora Continua
              </h2>
              <p className="text-gray-700 mb-4">
                Implementamos un ciclo de mejora continua basado en el modelo PDCA (Planificar, Hacer, Verificar, Actuar):
              </p>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-5 rounded-r-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Planificar</h4>
                  <p className="text-sm text-gray-700">
                    Análisis trimestral de métricas, feedback de usuarios y tendencias del mercado para identificar
                    oportunidades de mejora y establecer objetivos.
                  </p>
                </div>
                <div className="bg-green-50 border-l-4 border-green-600 p-5 rounded-r-lg">
                  <h4 className="font-semibold text-green-900 mb-2">🔧 Hacer</h4>
                  <p className="text-sm text-gray-700">
                    Implementación de mejoras, nuevas funcionalidades y corrección de problemas identificados
                    siguiendo metodologías ágiles.
                  </p>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-600 p-5 rounded-r-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">✅ Verificar</h4>
                  <p className="text-sm text-gray-700">
                    Monitoreo continuo de KPIs, testing de nuevas funcionalidades y evaluación del impacto
                    de los cambios implementados.
                  </p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-5 rounded-r-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">🚀 Actuar</h4>
                  <p className="text-sm text-gray-700">
                    Estandarización de mejoras exitosas, ajuste de procesos y documentación de lecciones
                    aprendidas para el siguiente ciclo.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Revisiones y Auditorías
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Revisiones trimestrales:</strong> Evaluación completa de procesos, métricas y objetivos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Auditorías de seguridad:</strong> Análisis de vulnerabilidades y pentesting trimestral</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Encuestas de satisfacción:</strong> Feedback directo de usuarios cada 6 meses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Revisión de compliance:</strong> Verificación anual de cumplimiento legal y normativo</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Compromiso con el Usuario
              </h2>
              <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-r-lg">
                <p className="text-gray-800 leading-relaxed">
                  Nos comprometemos a escuchar activamente a nuestros usuarios, responder sus inquietudes
                  y trabajar constantemente para mejorar su experiencia. Tu feedback es fundamental para
                  nuestro crecimiento y calidad del servicio.
                </p>
                <p className="text-gray-800 mt-3">
                  <strong>Contacto para sugerencias de mejora:</strong>{' '}
                  <a href={`mailto:${LEGAL_INFO.contacto.email}?subject=Sugerencia de Mejora`} className="text-purple-600 hover:underline">
                    {LEGAL_INFO.contacto.email}
                  </a>
                </p>
              </div>
            </section>

            <section className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Relacionados</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/legal/terms" className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Términos</span>
                </Link>
                <Link href="/legal/privacy" className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Privacidad</span>
                </Link>
                <Link href="/legal/security" className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <FileText className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Seguridad</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
