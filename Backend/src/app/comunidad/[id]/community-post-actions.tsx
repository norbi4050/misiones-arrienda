'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  MoreVertical, 
  Flag, 
  UserX, 
  Eye,
  Loader2 
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface CommunityPostActionsProps {
  postId: string
  authorId: string
  currentUserId?: string
  viewsCount?: number
  isOwnPost: boolean
}

export default function CommunityPostActions({ 
  postId, 
  authorId, 
  currentUserId, 
  viewsCount = 0,
  isOwnPost 
}: CommunityPostActionsProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'like' | 'report' | 'block' | null>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  // Simple toast replacement
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    alert(message) // Temporary simple implementation
  }

  const handleLike = async () => {
    if (!currentUserId || isOwnPost || loadingAction) return

    setLoadingAction('like')
    try {
      const method = isLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/comunidad/posts/${postId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(!isLiked)
        
        if (data.matched) {
          showToast("¡Hay match! Ahora pueden comenzar a chatear.", 'success')
        } else {
          showToast(data.message, 'success')
        }
      } else {
        const error = await response.json()
        showToast(error.error || 'Error al procesar like', 'error')
      }
    } catch (error) {
      console.error('Error al dar like:', error)
      showToast('Error de conexión', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleReport = async () => {
    if (!reportReason || !reportDetails.trim()) {
      showToast('Completa todos los campos del reporte', 'error')
      return
    }

    setLoadingAction('report')
    try {
      const response = await fetch(`/api/comunidad/profiles/${authorId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails
        })
      })

      if (response.ok) {
        const data = await response.json()
        showToast(data.message, 'success')
        setShowReportDialog(false)
        setReportReason('')
        setReportDetails('')
      } else {
        const error = await response.json()
        showToast(error.error || 'Error al enviar reporte', 'error')
      }
    } catch (error) {
      console.error('Error al reportar:', error)
      showToast('Error de conexión', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleBlock = async () => {
    if (!currentUserId || isOwnPost) return

    const confirmed = confirm('¿Estás seguro de que quieres bloquear a este usuario? No podrán contactarte ni verás sus publicaciones.')
    if (!confirmed) return

    setLoadingAction('block')
    try {
      const response = await fetch('/api/comunidad/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockedUserId: authorId
        })
      })

      if (response.ok) {
        const data = await response.json()
        showToast(data.message, 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'Error al bloquear usuario', 'error')
      }
    } catch (error) {
      console.error('Error al bloquear:', error)
      showToast('Error de conexión', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Eye className="w-4 h-4" />
        <span>{viewsCount} visualizaciones</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Views count */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Eye className="w-4 h-4" />
        <span>{viewsCount} visualizaciones</span>
      </div>

      {!isOwnPost && (
        <div className="flex gap-2">
          {/* Botón Like */}
          <Button
            onClick={handleLike}
            disabled={loadingAction === 'like'}
            variant={isLiked ? "default" : "outline"}
            className="flex-1"
          >
            {loadingAction === 'like' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            )}
            {isLiked ? 'Te gusta' : 'Me gusta'}
          </Button>

          {/* Botones de acción */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportDialog(true)}
          >
            <Flag className="w-4 h-4 mr-2" />
            Reportar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleBlock}
            className="text-red-600 hover:text-red-700"
          >
            <UserX className="w-4 h-4 mr-2" />
            Bloquear
          </Button>
        </div>
      )}

      {/* Modal de reporte simple */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reportar contenido</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ayúdanos a mantener la comunidad segura reportando contenido inapropiado.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Motivo del reporte</Label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="inappropriate">Contenido inapropiado</SelectItem>
                    <SelectItem value="fake">Información falsa</SelectItem>
                    <SelectItem value="harassment">Acoso</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="details">Detalles adicionales</Label>
                <Textarea
                  id="details"
                  placeholder="Describe el problema con más detalle..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowReportDialog(false)}
                disabled={loadingAction === 'report'}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleReport}
                disabled={loadingAction === 'report' || !reportReason || !reportDetails.trim()}
                className="flex-1"
              >
                {loadingAction === 'report' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Enviar reporte
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
