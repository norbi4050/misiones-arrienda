import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Mail, Phone, MapPin, Scale, Shield } from 'lucide-react'
import { LEGAL_INFO, formatLegalDate, getFullAddress } from '@/lib/legal-constants'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Misiones Arrienda',
  description: 'Términos y condiciones de uso de la plataforma Misiones Arrienda. Conoce tus derechos y obligaciones al utilizar nuestros servicios.',
  robots: 'index, follow',
  openGraph: {
    title: 'Términos y Condiciones | Misiones Arrienda',
    description: 'Términos y condiciones de uso de la plataforma Misiones Arrienda',
    type: 'website'
  }
}

export default function TermsPage() {
  const { responsable, contacto, marcoLegal } = LEGAL_INFO

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><Link href="/" className="hover:text-blue-600">Inicio</Link></li>
            <li>/</li>
            <li><Link href="/legal/terms" className="hover:text-blue-600">Legal</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Términos y Condiciones</li>
          </ol>
        </nav>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Términos y Condiciones</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Condiciones generales de uso de la plataforma Misiones Arrienda
            </p>
            <p className="mt-4 text-sm text-blue-200">
              <strong>Última actualización:</strong> {formatLegalDate(new Date(LEGAL_INFO.fechas.ultimaActualizacionPoliticas))}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <div className="prose prose-lg max-w-none">
              
              {/* Introducción */}
              <section className="mb-10">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mb-6">
                  <p className="text-gray-800 leading-relaxed">
                    Bienvenido a <strong>Misiones Arrienda</strong>. Al acceder y utilizar esta plataforma, 
                    usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna 
                    parte de estos términos, le solicitamos que no utilice nuestros servicios.
                  </p>
                </div>
              </section>

              {/* 1. Identificación del Responsable */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Scale className="h-6 w-6 text-blue-600" />
                  1. Identificación del Responsable
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
                    <span><strong>Domicilio fiscal:</strong> {getFullAddress()}</span>
                  </p>
                </div>
              </section>

              {/* 2. Descripción del Servicio */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Descripción del Servicio
                </h2>
                <p className="text-gray-700 mb-4">
                  Misiones Arrienda es una plataforma digital que conecta propietarios de inmuebles con 
                  inquilinos potenciales en la provincia de Misiones, Argentina. Nuestros servicios incluyen:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Publicación de propiedades en alquiler y venta</li>
                  <li>Búsqueda y filtrado avanzado de propiedades</li>
                  <li>Sistema de mensajería entre usuarios</li>
                  <li>Comunidad de búsqueda de compañeros de vivienda</li>
                  <li>Servicios premium para destacar publicaciones</li>
                  <li>Procesamiento de pagos a través de MercadoPago</li>
                </ul>
                <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                  <p className="text-sm text-yellow-800">
                    <strong>Importante:</strong> Misiones Arrienda actúa como intermediario tecnológico. 
                    No somos parte de las transacciones inmobiliarias ni garantizamos la veracidad de la 
                    información publicada por los usuarios.
                  </p>
                </div>
              </section>

              {/* 3. Registro y Cuenta de Usuario */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. Registro y Cuenta de Usuario
                </h2>
                <p className="text-gray-700 mb-4">
                  Para utilizar ciertos servicios, debe crear una cuenta proporcionando información 
                  veraz, precisa y actualizada. Usted es responsable de:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Mantener la confidencialidad de su contraseña y credenciales de acceso</li>
                  <li>Todas las actividades realizadas bajo su cuenta</li>
                  <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                  <li>Proporcionar información veraz y mantenerla actualizada</li>
                  <li>No compartir su cuenta con terceros</li>
                  <li>Cumplir con las leyes argentinas aplicables</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos 
                  o proporcionen información falsa.
                </p>
              </section>

              {/* 4. Uso Aceptable */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Uso Aceptable de la Plataforma
                </h2>
                <p className="text-gray-700 mb-4">
                  Al utilizar Misiones Arrienda, usted se compromete a NO:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Publicar información falsa, engañosa o fraudulenta sobre propiedades</li>
                  <li>Utilizar el servicio para actividades ilegales o no autorizadas</li>
                  <li>Acosar, amenazar, difamar o molestar a otros usuarios</li>
                  <li>Intentar acceder a cuentas de otros usuarios sin autorización</li>
                  <li>Enviar spam, contenido no solicitado o realizar prácticas comerciales abusivas</li>
                  <li>Violar derechos de propiedad intelectual de terceros</li>
                  <li>Utilizar robots, scrapers o herramientas automatizadas sin autorización</li>
                  <li>Interferir con el funcionamiento normal de la plataforma</li>
                  <li>Discriminar por motivos de raza, religión, género, orientación sexual, nacionalidad o discapacidad</li>
                </ul>
              </section>

              {/* 5. Publicación de Propiedades */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Publicación de Propiedades
                </h2>
                <p className="text-gray-700 mb-4">
                  Los usuarios que publican propiedades garantizan que:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Tienen derecho legal para alquilar, vender o publicar la propiedad</li>
                  <li>La información proporcionada es veraz, precisa y actualizada</li>
                  <li>Las imágenes corresponden a la propiedad anunciada y no infringen derechos de autor</li>
                  <li>El precio indicado es real y no engañoso</li>
                  <li>Cumplirán con todas las leyes locales, provinciales y nacionales aplicables</li>
                  <li>No discriminarán a potenciales inquilinos por motivos ilegales</li>
                  <li>Responderán de buena fe a las consultas recibidas</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Nos reservamos el derecho de remover publicaciones que violen estos términos o 
                  contengan información inapropiada.
                </p>
              </section>

              {/* 6. Pagos y Facturación */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. Pagos y Facturación
                </h2>
                <p className="text-gray-700 mb-4">
                  Para servicios premium y funcionalidades de pago:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Los pagos se procesan de forma segura a través de MercadoPago</li>
                  <li>Los precios están expresados en pesos argentinos (ARS)</li>
                  <li>Los precios incluyen IVA cuando corresponda</li>
                  <li>Los pagos son no reembolsables salvo casos excepcionales previstos por ley</li>
                  <li>Nos reservamos el derecho de modificar precios con aviso previo de 30 días</li>
                  <li>Las suscripciones se renuevan automáticamente salvo cancelación expresa</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Conforme a la <strong>Ley 24.240 de Defensa del Consumidor</strong>, los usuarios 
                  tienen derecho a revocar la aceptación durante el plazo de 10 días corridos contados 
                  a partir de la fecha de contratación del servicio.
                </p>
              </section>

              {/* 7. Limitación de Responsabilidad */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Limitación de Responsabilidad
                </h2>
                <p className="text-gray-700 mb-4">
                  Misiones Arrienda actúa como intermediario tecnológico. En consecuencia, NO somos responsables por:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>La veracidad, exactitud o legalidad de la información publicada por usuarios</li>
                  <li>Transacciones, acuerdos o contratos realizados entre propietarios e inquilinos</li>
                  <li>Daños, pérdidas o perjuicios derivados del uso de la plataforma</li>
                  <li>Interrupciones temporales del servicio por mantenimiento o causas de fuerza mayor</li>
                  <li>Contenido generado por terceros o enlaces externos</li>
                  <li>Pérdida de datos, aunque hayamos sido advertidos de tal posibilidad</li>
                  <li>Acciones u omisiones de otros usuarios</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Nuestra responsabilidad máxima se limita al monto pagado por el usuario en los últimos 
                  12 meses por servicios premium.
                </p>
              </section>

              {/* 8. Propiedad Intelectual */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Propiedad Intelectual
                </h2>
                <p className="text-gray-700 mb-4">
                  Todo el contenido de la plataforma (diseño, código fuente, textos, logos, marcas) 
                  es propiedad de {responsable.nombre} o sus licenciantes y está protegido por las 
                  leyes de propiedad intelectual argentinas.
                </p>
                <p className="text-gray-700 mb-4">
                  Los usuarios conservan todos los derechos sobre el contenido que publican, pero 
                  otorgan a Misiones Arrienda una licencia no exclusiva, mundial, libre de regalías 
                  para usar, reproducir, modificar y distribuir dicho contenido en la plataforma.
                </p>
              </section>

              {/* 9. Protección de Datos Personales */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                  9. Protección de Datos Personales
                </h2>
                <p className="text-gray-700 mb-4">
                  El tratamiento de sus datos personales se rige por nuestra{' '}
                  <Link href="/legal/privacy" className="text-blue-600 hover:underline font-medium">
                    Política de Privacidad
                  </Link>{' '}
                  y la <strong>{marcoLegal.leyProteccionDatos.nombre}</strong>.
                </p>
                <p className="text-gray-700">
                  Para ejercer sus derechos de acceso, rectificación, cancelación u oposición (derechos ARCO), 
                  consulte nuestra Política de Privacidad o contáctenos directamente.
                </p>
              </section>

              {/* 10. Terminación */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  10. Terminación de la Cuenta
                </h2>
                <p className="text-gray-700 mb-4">
                  Podemos suspender o terminar su cuenta inmediatamente si:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Viola estos términos y condiciones</li>
                  <li>Proporciona información falsa o fraudulenta</li>
                  <li>Realiza actividades ilegales o perjudiciales</li>
                  <li>No paga por servicios contratados</li>
                  <li>Recibimos múltiples reportes de otros usuarios</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Usted puede cancelar su cuenta en cualquier momento desde la configuración de su perfil.
                </p>
              </section>

              {/* 11. Ley Aplicable y Jurisdicción */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  11. Ley Aplicable y Jurisdicción
                </h2>
                <p className="text-gray-700 mb-4">
                  Estos términos se rigen por las leyes de la República Argentina, incluyendo:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>{marcoLegal.leyProteccionDatos.nombre}</strong></li>
                  <li><strong>{marcoLegal.leyDefensaConsumidor.nombre}</strong></li>
                  <li><strong>{marcoLegal.leyComercioElectronico.nombre}</strong></li>
                  <li><strong>{marcoLegal.codigoCivilComercial.nombre}</strong></li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Para cualquier controversia o reclamo derivado de estos términos, las partes se 
                  someten a la jurisdicción de los tribunales ordinarios competentes de{' '}
                  <strong>{marcoLegal.jurisdiccion}</strong>.
                </p>
              </section>

              {/* 12. Modificaciones */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  12. Modificaciones a los Términos
                </h2>
                <p className="text-gray-700">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Los cambios serán notificados a través del sitio web y por correo electrónico 
                  con al menos 10 días de anticipación. El uso continuado de la plataforma después 
                  de la notificación constituye aceptación de los nuevos términos.
                </p>
              </section>

              {/* Contacto Legal */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  13. Contacto Legal
                </h2>
                <p className="text-gray-700 mb-6">
                  Para consultas, reclamos o ejercicio de derechos relacionados con estos términos:
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <a href={`mailto:${contacto.email}`} className="text-blue-600 hover:underline">
                        {contacto.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Teléfono</p>
                      <a href={`tel:${contacto.telefono}`} className="text-blue-600 hover:underline">
                        {contacto.telefono}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">{contacto.horarioAtencion}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Domicilio</p>
                      <p className="text-gray-700">{getFullAddress()}</p>
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
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Política de Privacidad</span>
                  </Link>
                  <Link 
                    href="/legal/security"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Política de Seguridad</span>
                  </Link>
                  <Link 
                    href="/legal/quality"
                    className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="h-5 w-5 text-purple-600" />
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
