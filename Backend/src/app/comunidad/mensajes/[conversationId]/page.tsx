import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import ThreadView from '@/components/comunidad/ThreadView'

export const metadata = {
  title: 'Conversación | Arrienda',
  description: 'Chat con otro usuario de la comunidad'
}

interface PageProps {
  params: {
    conversationId: string
  }
}

export default async function ConversationPage({ params }: PageProps) {
  const supabase = createClient()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login?redirect=/comunidad/mensajes')
  }

  // Fetch conversation and messages desde la API enriquecida
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  let data: any = null
  let error: string | null = null

  try {
    const response = await fetch(
      `${baseUrl}/api/comunidad/messages/${params.conversationId}`,
      {
        headers: {
          'Cookie': cookies().toString()
        },
        cache: 'no-store'
      }
    )
    
    if (response.ok) {
      data = await response.json()
    } else if (response.status === 404) {
      notFound()
    } else {
      error = 'Error al cargar la conversación'
    }
  } catch (e) {
    console.error('Error fetching conversation:', e)
    error = 'Error de conexión'
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'No se pudo cargar la conversación'}
        </div>
      </div>
    )
  }

  return (
    <ThreadView
      conversation={data.conversation}
      messages={data.messages}
      currentUserId={user.id}
    />
  )
}
