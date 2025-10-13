'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import ChatInterface from '@/components/ui/ChatInterface'

export default function ConversationPage({ 
  params 
}: { 
  params: { conversationId: string } 
}) {
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto h-screen">
        <ChatInterface
          conversationId={params.conversationId}
          onThreadUpdate={() => {}}
        />
      </div>
    </div>
  )
}
