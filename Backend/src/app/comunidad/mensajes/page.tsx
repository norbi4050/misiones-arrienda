import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ConversationCard from '@/components/comunidad/ConversationCard'

export const metadata = {
  title: 'Mis Conversaciones | Arrienda',
  description: 'Gestiona tus conversaciones con otros usuarios de la comunidad'
}

export default async function MensajesPage() {
  const supabase = createClient()
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login?redirect=/comunidad/mensajes')
  }

  // Fetch conversations desde la API enriquecida
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  let conversations: any[] = []
  let error: string | null = null

  try {
    const response = await fetch(`${baseUrl}/api/comunidad/messages`, {
      headers: {
        'Cookie': cookies().toString()
      },
      cache: 'no-store'
    })
    
    if (response.ok) {
      const data = await response.json()
      conversations = data.conversations || []
    } else {
      error = 'Error al cargar conversaciones'
    }
  } catch (e) {
    console.error('Error fetching conversations:', e)
    error = 'Error de conexión'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mis Conversaciones</h1>
        <p className="text-gray-600 mt-2">
          Chatea con otros usuarios de la comunidad
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes conversaciones activas
          </h3>
          <p className="text-gray-500 mb-6">
            Cuando hagas match con otros usuarios, tus conversaciones aparecerán aquí
          </p>
          <a 
            href="/comunidad" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explorar comunidad
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv: any) => {
            // Usar los nuevos datos enriquecidos de otherParticipant
            const cacheBuster = conv.otherParticipant?.profileUpdatedAt 
              ? `?v=${new Date(conv.otherParticipant.profileUpdatedAt).getTime()}`
              : ''
            
            // Adaptar al formato que espera ConversationCard
            const adaptedConversation = {
              id: conv.id,
              match: {
                id: conv.match?.id || '',
                otherUser: {
                  id: conv.otherParticipant?.userId || '',
                  name: conv.otherParticipant?.displayName || 'Usuario',
                  displayName: conv.otherParticipant?.displayName,
                  profile: {
                    role: 'BUSCO' as const, // Placeholder - se puede mejorar
                    city: '',
                    neighborhood: ''
                  }
                }
              },
              last_message: conv.last_message_content ? {
                id: '',
                content: conv.last_message_content,
                created_at: conv.last_message_at || conv.updated_at,
                sender_id: '' // No sabemos quién envió sin más datos
              } : undefined,
              unread_count: conv.unread_count || 0,
              updated_at: conv.updated_at
            }

            return (
              <ConversationCard
                key={conv.id}
                conversation={adaptedConversation}
                currentUserId={user.id}
                lastMessage={conv.last_message_content || ''}
                onClick={(conversationId) => {
                  // Navegación se maneja en el componente
                  window.location.href = `/comunidad/mensajes/${conversationId}`
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
