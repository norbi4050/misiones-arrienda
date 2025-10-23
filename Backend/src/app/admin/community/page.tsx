import { Suspense } from 'react'
import { CommunityPostsListClient } from '@/components/admin/CommunityPostsListClient'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Gestión de Comunidad | Admin',
  description: 'Panel de administración de publicaciones de comunidad'
}

export default function AdminCommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Comunidad</h1>
        <p className="text-gray-600 mt-2">
          Administra las publicaciones de la comunidad, suspende o elimina contenido inapropiado
        </p>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando publicaciones...</p>
          </CardContent>
        </Card>
      }>
        <CommunityPostsListClient />
      </Suspense>
    </div>
  )
}
