import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MyCommunityPostsClient } from './my-community-posts-client'

export const metadata = {
  title: 'Mis Publicaciones - Comunidad',
  description: 'Gestiona tus publicaciones de comunidad'
}

export default async function MisPublicacionesPage() {
  const supabase = createClient()
  
  // Verificar autenticación
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login?redirect=/comunidad/mis-publicaciones')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Cargando...</div>}>
        <MyCommunityPostsClient />
      </Suspense>
    </div>
  )
}
