import { Metadata } from 'next'
import Link from 'next/link'
import { Award, Target, TrendingUp, FileText } from 'lucide-react'
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
            <li><Link href="/">Inicio</Link></li>
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
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                1. Objetivos de Calidad
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Proporcionar una plataforma confiable y segura para usuarios</li>
                <li>Garantizar la precisión de la información publicada</li>
                <li>Mantener tiempos de respuesta óptimos</li>
                <li>Mejorar continuamente la experiencia del usuario</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                2. Alcance del Sistema de Gestión
              </h2>
              <p className="text-gray-700 mb-4">
                Nuestro sistema de gestión de calidad abarca:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Desarrollo y mantenimiento de la plataforma</li>
                <li>Atención al usuario y soporte técnico</li>
                <li>Seguridad de la información</li>
                <li>Procesamiento de pagos</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Revisión y Mejora Continua
              </h2>
              <p className="text-gray-700">
                Revisamos nuestros procesos trimestralmente para identificar oportunidades de mejora 
                y garantizar que cumplimos con nuestros estándares de calidad.
              </p>
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
