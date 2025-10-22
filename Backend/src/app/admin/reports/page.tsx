import { Suspense } from 'react'
import { ReportsListClient } from '@/components/admin/ReportsListClient'

export const dynamic = 'force-dynamic'

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes</h1>
        <p className="mt-2 text-gray-600">
          Administra los reportes de propiedades enviados por los usuarios
        </p>
      </div>

      <Suspense fallback={<ReportsListSkeleton />}>
        <ReportsListClient />
      </Suspense>
    </div>
  )
}

function ReportsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  )
}
