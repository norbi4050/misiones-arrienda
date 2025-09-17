import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad - Misiones Arrienda',
  description: 'Política de privacidad y protección de datos personales de Misiones Arrienda',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-AR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información que Recopilamos</h2>
              <p className="text-gray-700 mb-4">
                En Misiones Arrienda recopilamos la siguiente información personal:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Datos de contacto:</strong> nombre, apellido, email, teléfono</li>
                <li><strong>Datos de propiedades:</strong> dirección, características, imágenes</li>
                <li><strong>Datos de navegación:</strong> cookies, IP, comportamiento en el sitio</li>
                <li><strong>Datos de comunicación:</strong> mensajes, consultas, historial de contacto</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cómo Utilizamos su Información</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos sus datos personales para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Facilitar la publicación y búsqueda de propiedades</li>
                <li>Conectar propietarios con inquilinos potenciales</li>
                <li>Enviar notificaciones sobre propiedades de interés</li>
                <li>Procesar pagos y transacciones</li>
                <li>Mejorar nuestros servicios y experiencia del usuario</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Compartir Información</h2>
              <p className="text-gray-700 mb-4">
                Compartimos su información únicamente en los siguientes casos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Con otros usuarios para facilitar contacto sobre propiedades</li>
                <li>Con proveedores de servicios (pagos, hosting, analytics)</li>
                <li>Cuando sea requerido por ley o autoridades competentes</li>
                <li>Con su consentimiento explícito</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Protección de Datos</h2>
              <p className="text-gray-700 mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Encriptación SSL/TLS para transmisión de datos</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo regular de seguridad</li>
                <li>Respaldo seguro de datos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Sus Derechos</h2>
              <p className="text-gray-700 mb-4">
                Conforme a la Ley de Protección de Datos Personales de Argentina, usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar datos incorrectos o incompletos</li>
                <li>Suprimir sus datos cuando corresponda</li>
                <li>Oponerse al tratamiento de sus datos</li>
                <li>Portabilidad de sus datos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies para mejorar su experiencia. Puede configurar su navegador para rechazar cookies,
                aunque esto puede afectar la funcionalidad del sitio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para ejercer sus derechos o consultas sobre privacidad, contáctenos:
              </p>
              <ul className="list-none text-gray-700 space-y-2">
                <li><strong>Email:</strong> privacidad@misionesarrienda.com.ar</li>
                <li><strong>Teléfono:</strong> +54 376 4567890</li>
                <li><strong>Dirección:</strong> Posadas, Misiones, Argentina</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cambios a esta Política</h2>
              <p className="text-gray-700">
                Nos reservamos el derecho de actualizar esta política. Los cambios serán notificados
                a través del sitio web y por email cuando sea apropiado.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
