import { Suspense } from 'react'
import { SupportListClient } from '@/components/admin/SupportListClient'

export const metadata = {
  title: 'Soporte - Admin',
  description: 'Gestionar tickets y solicitudes de soporte'
}

export default function AdminSupportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Soporte</h1>
          <p className="mt-2 text-gray-600">
            Gestionar tickets y solicitudes de ayuda de los usuarios
          </p>
        </div>
      </div>

      {/* Support Tickets List */}
      <Suspense fallback={<div className="text-center py-12">Cargando tickets...</div>}>
        <SupportListClient />
      </Suspense>
    </div>
  )
}
