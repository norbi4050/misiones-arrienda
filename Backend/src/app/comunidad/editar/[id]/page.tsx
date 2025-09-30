import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditCommunityPostClient } from './edit-community-post-client'

export const metadata = {
  title: 'Editar Publicación - Comunidad',
  description: 'Edita tu publicación de comunidad'
}

interface PageProps {
  params: { id: string }
}

export default async function EditarPublicacionPage({ params }: PageProps) {
  const { id } = params
  const supabase = createClient()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect(`/login?redirect=/comunidad/editar/${id}`)
  }

  // Fetch post
  const { data: post, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  // Verificar ownership
  if (post.user_id !== user.id) {
    redirect('/comunidad/mis-publicaciones')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Cargando...</div>}>
        <EditCommunityPostClient post={post} />
      </Suspense>
    </div>
  )
}
