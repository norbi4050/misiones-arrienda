import { Suspense } from 'react'
import { PropertiesListClient } from '@/components/admin/PropertiesListClient'

export const metadata = {
  title: 'Gestión de Propiedades - Admin',
  description: 'Administrar propiedades de la plataforma'
}

export default function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Propiedades</h1>
          <p className="mt-2 text-gray-600">
            Ver, buscar y administrar todas las propiedades de la plataforma
          </p>
        </div>
      </div>

      {/* Properties List */}
      <Suspense fallback={<div className="text-center py-12">Cargando propiedades...</div>}>
        <PropertiesListClient />
      </Suspense>
    </div>
  )
}
