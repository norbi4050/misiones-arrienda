import Link from 'next/link'
import { Mail, Phone, Shield, FileText, Lock, HelpCircle, Cookie } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1: Contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:cgonzalezarchilla@gmail.com"
                  className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">cgonzalezarchilla@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+5491130875304"
                  className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="text-sm">+54 9 11 3087 5304</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 2: Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/legal/terms"
                  prefetch={false}
                  className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Términos y Condiciones</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  prefetch={false}
                  className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  <span className="text-sm">Política de Privacidad</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  prefetch={false}
                  className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  <Cookie className="w-4 h-4 mr-2" />
                  <span className="text-sm">Política de Cookies</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Seguridad y Calidad */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Seguridad y Calidad</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/legal/security"
                  prefetch={false}
                  className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="text-sm">Política de Seguridad</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/quality"
                  prefetch={false}
                  className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Política de Calidad</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Sobre Nosotros */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Misiones Arrienda</h3>
            <p className="text-sm text-gray-300 mb-4">
              La plataforma líder en alquiler de propiedades en Misiones, Argentina.
            </p>
            <p className="text-xs text-gray-400">
              Conectando inquilinos y propietarios desde 2025
            </p>
          </div>
        </div>

        {/* Disclaimer y Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <p className="text-xs text-gray-400 text-center mb-3">
            Misiones Arrienda es una plataforma de clasificados inmobiliarios. No somos una inmobiliaria ni intermediamos en transacciones.
          </p>
          <p className="text-sm text-gray-400 text-center">
            © {currentYear} Misiones Arrienda. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
