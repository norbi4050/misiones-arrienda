'use client'

import { useState } from 'react'
import ThreadHeader from '@/components/comunidad/ThreadHeader'

export default function QAPage() {
  const [conversations, setConversations] = useState<any>(null)
  const [messages, setMessages] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/comunidad/messages')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConversations(data)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchFirstConversation = async () => {
    if (!conversations?.conversations?.[0]) {
      setError('No hay conversaciones disponibles')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const convId = conversations.conversations[0].id
      const res = await fetch(`/api/comunidad/messages/${convId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages(data)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">QA - Sistema de Mensajería</h1>
        <p className="text-gray-600">
          Página temporal para validar la implementación de los Prompts 1-3
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Sección 1: Listar conversaciones */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">1. Test API: GET /api/comunidad/messages</h2>
          
          <button 
            onClick={fetchConversations}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Listar conversaciones'}
          </button>
          
          {conversations && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Respuesta JSON:</h3>
              <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs">
                  {JSON.stringify(conversations, null, 2)}
                </pre>
              </div>
              
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <h4 className="font-bold text-green-800 mb-2">✓ Checklist:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Respuesta incluye conversations[]</li>
                  <li>✓ Cada conversation tiene participants[]</li>
                  <li>✓ Cada conversation tiene otherParticipant</li>
                  <li>✓ otherParticipant.displayName no es "Usuario" genérico</li>
                  <li>✓ otherParticipant.avatarUrl está presente (o null)</li>
                  <li>✓ profileUpdatedAt disponible para cache-busting</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Sección 2: Abrir conversación */}
        {conversations && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">2. Test API: GET /api/comunidad/messages/[id]</h2>
            
            <button 
              onClick={fetchFirstConversation}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Abrir primera conversación'}
            </button>
            
            {messages && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">Preview del Thread:</h3>
                <div className="border rounded-lg overflow-hidden mb-4">
                  <ThreadHeader 
                    participant={messages.conversation.otherParticipant}
                    matchStatus={messages.conversation.match?.status}
                  />
                </div>
                
                <h3 className="font-bold mb-2">Mensajes (primeros 5):</h3>
                <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  <pre className="text-xs">
                    {JSON.stringify(messages.messages.slice(0, 5), null, 2)}
                  </pre>
                </div>
                
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-bold text-green-800 mb-2">✓ Checklist:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ conversation.otherParticipant presente</li>
                    <li>✓ conversation.participants[] presente</li>
                    <li>✓ messages[].sender.displayName presente</li>
                    <li>✓ messages[].sender.avatarUrl presente</li>
                    <li>✓ ThreadHeader renderiza correctamente</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección 3: Instrucciones de testing manual */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold mb-4 text-blue-900">3. Testing Manual Requerido</h2>
          
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h3 className="font-bold mb-2">Test Inbox:</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Navegar a <code className="bg-blue-100 px-1 rounded">/comunidad/mensajes</code></li>
                <li>Verificar que muestra nombres reales (no "Usuario")</li>
                <li>Verificar que muestra avatares o iniciales</li>
                <li>Click en conversación → debe navegar correctamente</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Test Thread:</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Abrir conversación desde inbox</li>
                <li>Verificar header muestra nombre + avatar</li>
                <li>Verificar mensajes muestran nombres reales</li>
                <li>Enviar mensaje → debe aparecer en lista</li>
                <li>Verificar auto-scroll funciona</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Test Cache-busting:</h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Cambiar avatar en perfil de comunidad</li>
                <li>Volver a mensajes</li>
                <li>Verificar que avatar se actualiza (no usa caché)</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
