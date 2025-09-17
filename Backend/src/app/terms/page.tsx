import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones - Misiones Arrienda',
  description: 'Términos y condiciones de uso de la plataforma Misiones Arrienda',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-AR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 mb-4">
                Al acceder y utilizar Misiones Arrienda, usted acepta estar sujeto a estos términos y condiciones.
                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descripción del Servicio</h2>
              <p className="text-gray-700 mb-4">
                Misiones Arrienda es una plataforma digital que conecta propietarios de inmuebles con inquilinos
                potenciales en la provincia de Misiones, Argentina. Facilitamos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Publicación de propiedades en alquiler y venta</li>
                <li>Búsqueda y filtrado de propiedades</li>
                <li>Comunicación entre propietarios e inquilinos</li>
                <li>Procesamiento de pagos por servicios premium</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Registro y Cuenta de Usuario</h2>
              <p className="text-gray-700 mb-4">
                Para utilizar ciertos servicios, debe crear una cuenta proporcionando información veraz y actualizada.
                Usted es responsable de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Mantener la confidencialidad de su contraseña</li>
                <li>Todas las actividades realizadas bajo su cuenta</li>
                <li>Notificar inmediatamente cualquier uso no autorizado</li>
                <li>Proporcionar información veraz y actualizada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Uso Aceptable</h2>
              <p className="text-gray-700 mb-4">
                Al utilizar nuestro servicio, usted se compromete a NO:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Publicar información falsa o engañosa sobre propiedades</li>
                <li>Utilizar el servicio para actividades ilegales</li>
                <li>Acosar, amenazar o molestar a otros usuarios</li>
                <li>Intentar acceder a cuentas de otros usuarios</li>
                <li>Enviar spam o contenido no solicitado</li>
                <li>Violar derechos de propiedad intelectual</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Publicación de Propiedades</h2>
              <p className="text-gray-700 mb-4">
                Los propietarios que publican propiedades garantizan que:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Tienen derecho legal para alquilar/vender la propiedad</li>
                <li>La información proporcionada es veraz y actualizada</li>
                <li>Las imágenes corresponden a la propiedad anunciada</li>
                <li>Cumplirán con todas las leyes locales aplicables</li>
                <li>No discriminarán por motivos ilegales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Pagos y Facturación</h2>
              <p className="text-gray-700 mb-4">
                Para servicios premium:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Los pagos se procesan a través de MercadoPago</li>
                <li>Los precios están expresados en pesos argentinos</li>
                <li>Los pagos son no reembolsables salvo casos excepcionales</li>
                <li>Nos reservamos el derecho de cambiar precios con aviso previo</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 mb-4">
                Misiones Arrienda actúa como intermediario. No somos responsables por:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>La veracidad de la información publicada por usuarios</li>
                <li>Transacciones realizadas entre propietarios e inquilinos</li>
                <li>Daños o pérdidas derivadas del uso del servicio</li>
                <li>Interrupciones temporales del servicio</li>
                <li>Contenido generado por terceros</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Propiedad Intelectual</h2>
              <p className="text-gray-700 mb-4">
                Todo el contenido de la plataforma (diseño, código, textos, logos) es propiedad de Misiones Arrienda
                o sus licenciantes. Los usuarios conservan derechos sobre el contenido que publican pero otorgan
                licencia para su uso en la plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Terminación</h2>
              <p className="text-gray-700 mb-4">
                Podemos suspender o terminar su cuenta si:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Viola estos términos y condiciones</li>
                <li>Proporciona información falsa</li>
                <li>Realiza actividades fraudulentas</li>
                <li>No paga por servicios contratados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Ley Aplicable</h2>
              <p className="text-gray-700 mb-4">
                Estos términos se rigen por las leyes de la República Argentina.
                Cualquier disputa será resuelta en los tribunales competentes de Posadas, Misiones.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para consultas sobre estos términos:
              </p>
              <ul className="list-none text-gray-700 space-y-2">
                <li><strong>Email:</strong> legal@misionesarrienda.com.ar</li>
                <li><strong>Teléfono:</strong> +54 376 4567890</li>
                <li><strong>Dirección:</strong> Posadas, Misiones, Argentina</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Modificaciones</h2>
              <p className="text-gray-700">
                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                Los cambios serán notificados a través del sitio web y entrarán en vigor inmediatamente.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
