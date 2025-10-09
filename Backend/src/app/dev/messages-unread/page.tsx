'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, MessageCircle, CheckCircle, XCircle } from 'lucide-react'

export default function MessagesUnreadDevPage() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchUnreadCount = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/comunidad/messages/unread-count', {
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCount(data.count)
        setLastUpdate(new Date().toLocaleTimeString())
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error desconocido')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Dev: Mensajes No Leídos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado actual */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Conteo Actual</h3>
              <Button
                onClick={fetchUnreadCount}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refrescar
              </Button>
            </div>

            {error ? (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            ) : count !== null ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-3xl font-bold text-gray-900">{count}</span>
                  <span className="text-gray-600">mensajes no leídos</span>
                </div>
                {lastUpdate && (
                  <p className="text-sm text-gray-500">
                    Última actualización: {lastUpdate}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Cargando...</p>
            )}
          </div>

          {/* Instrucciones */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">📋 Instrucciones de Testing</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Abre una sesión en modo incógnito con otro usuario</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Envía un mensaje desde ese usuario a tu cuenta actual</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Haz clic en "Refrescar" aquí - el conteo debe subir</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>Verifica que el badge aparece en el Navbar (ícono de mensajes)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">5.</span>
                <span>Abre la conversación en <code className="bg-gray-100 px-1 rounded">/comunidad/mensajes</code></span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">6.</span>
                <span>Refrescar nuevamente - el conteo debe bajar a 0</span>
              </li>
            </ol>
          </div>

          {/* Enlaces rápidos */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">🔗 Enlaces Rápidos</h3>
            <div className="flex flex-wrap gap-2">
              <a href="/comunidad/mensajes" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Ir a Mensajes
                </Button>
              </a>
              <a href="/comunidad" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Ir a Comunidad
                </Button>
              </a>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Ver Navbar
                </Button>
              </a>
            </div>
          </div>

          {/* Info técnica */}
          <div className="border-t pt-6 text-xs text-gray-500">
            <p><strong>Endpoint:</strong> GET /api/comunidad/messages/unread-count</p>
            <p><strong>Hook:</strong> useMessagesUnread() con polling cada 30s</p>
            <p><strong>Lógica:</strong> Suma unread_count_user1 o unread_count_user2 según el usuario</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
