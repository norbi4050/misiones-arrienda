import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, AlertTriangle, Mail, Phone, Clock, CheckCircle2, Lock } from 'lucide-react'
import { LEGAL_INFO, formatLegalDate, getFullAddress } from '@/lib/legal-constants'

export const metadata: Metadata = {
  title: 'Política de Seguridad | Misiones Arrienda',
  description: 'Política de seguridad de la información y proceso de reporte de vulnerabilidades de Misiones Arrienda.',
  robots: 'index, follow',
  openGraph: {
    title: 'Política de Seguridad | Misiones Arrienda',
    description: 'Política de seguridad y reporte de vulnerabilidades',
    type: 'website'
  }
}

// FIX 304: Deshabilitar caché para páginas legales
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function SecurityPage() {
  const { responsable, contacto } = LEGAL_INFO

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><Link href="/" prefetch={false} className="hover:text-blue-600">Inicio</Link></li>
            <li>/</li>
            <li><Link href="/legal/security" className="hover:text-blue-600">Legal</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Política de Seguridad</li>
          </ol>
        </nav>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Política de Seguridad</h1>
            </div>
            <p className="text-red-100 text-lg">
              Prácticas de seguridad y proceso de divulgación responsable de vulnerabilidades
            </p>
            <p className="mt-4 text-sm text-red-200">
              <strong>Última actualización:</strong> {formatLegalDate(new Date(LEGAL_INFO.fechas.ultimaActualizacionPoliticas))}
            </p>
          </div>

          <div className="px-8 py-10">
            <div className="prose prose-lg max-w-none">
              
              <section className="mb-10">
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg mb-6">
                  <p className="text-gray-800 leading-relaxed">
                    La seguridad de nuestros usuarios es nuestra prioridad. Esta política describe nuestras 
                    prácticas de seguridad y el proceso para reportar vulnerabilidades de forma responsable.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="h-6 w-6 text-red-600" />
                  1. Medidas de Seguridad Implementadas
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">🔐 Seguridad de Datos</h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                      <li>Encriptación SSL/TLS para todas las comunicaciones</li>
                      <li>Hashing seguro de contraseñas (bcrypt)</li>
                      <li>Tokens de sesión con expiración automática</li>
                      <li>Protección contra inyección SQL</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">🛡️ Seguridad de Aplicación</h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                      <li>Validación de entrada en cliente y servidor</li>
                      <li>Protección CSRF (Cross-Site Request Forgery)</li>
                      <li>Headers de seguridad (CSP, HSTS, X-Frame-Options)</li>
                      <li>Rate limiting en endpoints críticos</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">👥 Seguridad de Acceso</h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                      <li>Autenticación de dos factores (2FA) disponible</li>
                      <li>Control de acceso basado en roles (RBAC)</li>
                      <li>Auditoría de accesos a datos sensibles</li>
                      <li>Sesiones únicas por dispositivo</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">🔍 Monitoreo y Respuesta</h3>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                      <li>Monitoreo 24/7 de actividades sospechosas</li>
                      <li>Logs de seguridad y auditoría</li>
                      <li>Plan de respuesta a incidentes</li>
                      <li>Respaldos automáticos diarios</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  2. Programa de Divulgación Responsable
                </h2>
                <p className="text-gray-700 mb-4">
                  Agradecemos a investigadores de seguridad que nos ayudan a mantener la plataforma segura. 
                  Si descubre una vulnerabilidad, le pedimos que la reporte de forma responsable.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Ámbito de Cobertura</h3>
                <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r mb-4">
                  <p className="text-sm text-gray-800 mb-2"><strong>✅ Dentro del alcance:</strong></p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                    <li>Vulnerabilidades en misionesarrienda.com.ar</li>
                    <li>Inyección SQL, XSS, CSRF</li>
                    <li>Escalación de privilegios</li>
                    <li>Exposición de datos sensibles</li>
                    <li>Bypass de autenticación</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r">
                  <p className="text-sm text-gray-800 mb-2"><strong>❌ Fuera del alcance:</strong></p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                    <li>Ataques de denegación de servicio (DoS/DDoS)</li>
                    <li>Ingeniería social o phishing</li>
                    <li>Vulnerabilidades en servicios de terceros</li>
                    <li>Reportes sin evidencia técnica</li>
                  </ul>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. Cómo Reportar una Vulnerabilidad
                </h2>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">📧 Proceso de Reporte</h3>
                  <ol className="list-decimal pl-6 text-gray-700 space-y-3">
                    <li>
                      <strong>Envíe un email a:</strong>{' '}
                      <a href={`mailto:${contacto.email}?subject=Reporte de Vulnerabilidad de Seguridad`} className="text-red-600 hover:underline">
                        {contacto.email}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">Asunto: "Reporte de Vulnerabilidad de Seguridad"</p>
                    </li>
                    <li>
                      <strong>Incluya la siguiente información:</strong>
                      <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                        <li>Descripción detallada de la vulnerabilidad</li>
                        <li>Pasos para reproducir el problema</li>
                        <li>Impacto potencial</li>
                        <li>Capturas de pantalla o videos (si aplica)</li>
                        <li>Su información de contacto</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Espere nuestra respuesta:</strong> Confirmaremos recepción en 48 horas
                    </li>
                    <li>
                      <strong>Colabore con nosotros:</strong> Podemos solicitar información adicional
                    </li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Importante:</strong> Por favor, NO divulgue públicamente la vulnerabilidad 
                    hasta que hayamos tenido oportunidad de solucionarla. Respetamos la divulgación coordinada.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-red-600" />
                  4. Tiempos de Respuesta
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600">
                    <h4 className="font-semibold text-gray-900 mb-2">🔴 Crítica</h4>
                    <p className="text-sm text-gray-700 mb-2">Exposición de datos, bypass de autenticación</p>
                    <p className="text-xs text-gray-600"><strong>Respuesta:</strong> 24 horas</p>
                    <p className="text-xs text-gray-600"><strong>Solución:</strong> 7 días</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-600">
                    <h4 className="font-semibold text-gray-900 mb-2">🟠 Alta</h4>
                    <p className="text-sm text-gray-700 mb-2">XSS, CSRF, escalación de privilegios</p>
                    <p className="text-xs text-gray-600"><strong>Respuesta:</strong> 48 horas</p>
                    <p className="text-xs text-gray-600"><strong>Solución:</strong> 14 días</p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-600">
                    <h4 className="font-semibold text-gray-900 mb-2">🟡 Media</h4>
                    <p className="text-sm text-gray-700 mb-2">Problemas de configuración, información sensible</p>
                    <p className="text-xs text-gray-600"><strong>Respuesta:</strong> 5 días</p>
                    <p className="text-xs text-gray-600"><strong>Solución:</strong> 30 días</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <h4 className="font-semibold text-gray-900 mb-2">🔵 Baja</h4>
                    <p className="text-sm text-gray-700 mb-2">Mejoras de seguridad, hardening</p>
                    <p className="text-xs text-gray-600"><strong>Respuesta:</strong> 7 días</p>
                    <p className="text-xs text-gray-600"><strong>Solución:</strong> 60 días</p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  5. Buenas Prácticas para Investigadores
                </h2>
                <p className="text-gray-700 mb-4">
                  Para mantener un programa de seguridad efectivo y ético, solicitamos:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>NO acceder, modificar o eliminar datos de otros usuarios</li>
                  <li>NO realizar ataques de denegación de servicio</li>
                  <li>NO utilizar técnicas de ingeniería social contra empleados o usuarios</li>
                  <li>Limitar las pruebas a cuentas de prueba propias</li>
                  <li>Reportar vulnerabilidades de forma privada antes de divulgarlas</li>
                  <li>Dar tiempo razonable para solucionar el problema antes de divulgación pública</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. Reconocimiento
                </h2>
                <p className="text-gray-700 mb-4">
                  Agradecemos públicamente a investigadores que reporten vulnerabilidades de forma responsable:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Reconocimiento en nuestra página de agradecimientos (con su permiso)</li>
                  <li>Comunicación directa sobre el progreso de la solución</li>
                  <li>Crédito en notas de versión cuando se publique el fix</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Actualmente no ofrecemos recompensas monetarias (bug bounty), 
                    pero valoramos enormemente las contribuciones a la seguridad de nuestra plataforma.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Contacto de Seguridad
                </h2>
                <p className="text-gray-700 mb-6">
                  Para reportes de seguridad o consultas relacionadas:
                </p>
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Email de Seguridad</p>
                      <a href={`mailto:${contacto.email}?subject=Reporte de Vulnerabilidad`} className="text-red-600 hover:underline">
                        {contacto.email}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">Asunto: "Reporte de Vulnerabilidad de Seguridad"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Teléfono (Solo emergencias)</p>
                      <a href={`tel:${contacto.telefono}`} className="text-red-600 hover:underline">
                        {contacto.telefono}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">{contacto.horarioAtencion}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Responsable de Seguridad
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 mb-2">
                    <strong>Responsable:</strong> {responsable.nombre}
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>CUIT:</strong> {responsable.cuit}
                  </p>
                  <p className="text-gray-700">
                    <strong>Domicilio:</strong> {getFullAddress()}
                  </p>
                </div>
              </section>

              <section className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Relacionados</h3>
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
                    <Lock className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Política de Privacidad</span>
                  </Link>
                  <Link 
                    href="/legal/quality"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Política de Calidad</span>
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
