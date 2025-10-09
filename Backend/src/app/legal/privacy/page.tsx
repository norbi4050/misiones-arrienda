import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Mail, Phone, MapPin, Lock, Eye, Database, Cookie } from 'lucide-react'
import { LEGAL_INFO, formatLegalDate, getFullAddress } from '@/lib/legal-constants'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Misiones Arrienda',
  description: 'Política de privacidad y protección de datos personales conforme a la Ley 25.326. Conoce cómo protegemos tu información.',
  robots: 'index, follow',
  openGraph: {
    title: 'Política de Privacidad | Misiones Arrienda',
    description: 'Política de privacidad y protección de datos personales de Misiones Arrienda',
    type: 'website'
  }
}

export default function PrivacyPage() {
  const { responsable, contacto, marcoLegal, derechosARCO } = LEGAL_INFO

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><Link href="/" className="hover:text-blue-600">Inicio</Link></li>
            <li>/</li>
            <li><Link href="/legal/privacy" className="hover:text-blue-600">Legal</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Política de Privacidad</li>
          </ol>
        </nav>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Política de Privacidad</h1>
            </div>
            <p className="text-green-100 text-lg">
              Protección de datos personales conforme a la Ley 25.326
            </p>
            <p className="mt-4 text-sm text-green-200">
              <strong>Última actualización:</strong> {formatLegalDate(new Date(LEGAL_INFO.fechas.ultimaActualizacionPoliticas))}
            </p>
          </div>

          <div className="px-8 py-10">
            <div className="prose prose-lg max-w-none">
              
              <section className="mb-10">
                <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg mb-6">
                  <p className="text-gray-800 leading-relaxed">
                    En <strong>Misiones Arrienda</strong> respetamos su privacidad y nos comprometemos a proteger 
                    sus datos personales conforme a la <strong>{marcoLegal.leyProteccionDatos.nombre}</strong> y 
                    demás normativa aplicable en Argentina.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="h-6 w-6 text-green-600" />
                  1. Responsable del Tratamiento de Datos
                </h2>
                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <p className="text-gray-700">
                    <strong>Responsable:</strong> {responsable.nombre}
                  </p>
                  <p className="text-gray-700">
                    <strong>Proyecto:</strong> {responsable.proyecto} ({responsable.tipoProyecto})
                  </p>
                  <p className="text-gray-700">
                    <strong>CUIT:</strong> {responsable.cuit}
                  </p>
                  <p className="text-gray-700 flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Domicilio:</strong> {getFullAddress()}</span>
                  </p>
                  <p className="text-gray-700 flex items-start gap-2">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Email para ejercer derechos:</strong> {contacto.email}</span>
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="h-6 w-6 text-green-600" />
                  2. Información que Recopilamos
                </h2>
                <p className="text-gray-700 mb-4">
                  Recopilamos diferentes tipos de información personal según el uso que haga de nuestros servicios.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="h-6 w-6 text-green-600" />
                  3. Sus Derechos (Derechos ARCO)
                </h2>
                <p className="text-gray-700 mb-4">
                  {derechosARCO.descripcion}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {derechosARCO.derechos.map((derecho, index) => (
                    <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">✓ {derecho.nombre}</h4>
                      <p className="text-sm text-gray-700">{derecho.descripcion}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Contacto para Temas de Privacidad
                </h2>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Email de Privacidad</p>
                      <a href={`mailto:${contacto.email}?subject=Consulta sobre Privacidad`} className="text-green-600 hover:underline">
                        {contacto.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Teléfono</p>
                      <a href={`tel:${contacto.telefono}`} className="text-green-600 hover:underline">
                        {contacto.telefono}
                      </a>
                    </div>
                  </div>
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
                    href="/legal/security"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Lock className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Política de Seguridad</span>
                  </Link>
                  <Link 
                    href="/privacy-settings"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Cookie className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Configurar Privacidad</span>
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
