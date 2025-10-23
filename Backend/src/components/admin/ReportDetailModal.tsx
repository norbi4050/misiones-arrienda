'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Flag, User, Home, Calendar, AlertTriangle, Check, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PropertyReport {
  id: string
  property_id: string
  reporter_id: string
  reason: string
  reasonLabel: string
  details: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
  reviewed_by_id: string | null
  reviewed_at: string | null
  admin_notes: string | null
  action_taken: string | null
  created_at: string
  updated_at: string
  daysOld: number
  property: {
    id: string
    title: string
    price: number
    currency: string
    city: string
    province: string
    status: string
    user_id: string
  } | null
  reporter: {
    id: string
    name: string
    email: string
  } | null
}

interface ReportDetailModalProps {
  report: PropertyReport
  isOpen: boolean
  onClose: () => void
  onReportUpdated: () => void
}

export function ReportDetailModal({ report, isOpen, onClose, onReportUpdated }: ReportDetailModalProps) {
  const router = useRouter()
  const [newStatus, setNewStatus] = useState<string>(report.status)
  const [adminNotes, setAdminNotes] = useState<string>(report.admin_notes || '')
  const [actionTaken, setActionTaken] = useState<string>(report.action_taken || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdateReport = async () => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          status: newStatus,
          adminNotes,
          actionTaken,
        }),
      })

      if (!response.ok) {
        throw new Error('Error updating report')
      }

      onReportUpdated()
    } catch (error) {
      console.error('Error updating report:', error)
      alert('Error al actualizar el reporte')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    const actionConfig = {
      approve: {
        status: 'DISMISSED',
        action: 'approved',
        notes: 'La propiedad fue revisada y no se encontraron problemas',
      },
      remove_property: {
        status: 'RESOLVED',
        action: 'property_removed',
        notes: 'Propiedad eliminada debido a violación de políticas',
      },
      warn_user: {
        status: 'RESOLVED',
        action: 'user_warned',
        notes: 'Usuario advertido sobre la violación',
      },
      dismiss: {
        status: 'DISMISSED',
        action: 'dismissed',
        notes: 'Reporte descartado - sin evidencia suficiente',
      },
    }

    const config = actionConfig[action as keyof typeof actionConfig]
    if (!config) return

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          status: config.status,
          adminNotes: config.notes,
          actionTaken: config.action,
        }),
      })

      if (!response.ok) {
        throw new Error('Error updating report')
      }

      onReportUpdated()
    } catch (error) {
      console.error('Error updating report:', error)
      alert('Error al procesar la acción')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" />
            Detalle del Reporte
          </DialogTitle>
          <DialogDescription>
            ID: {report.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs text-gray-500">Estado</Label>
              <div className="mt-1">
                {report.status === 'PENDING' && <Badge variant="destructive">Pendiente</Badge>}
                {report.status === 'UNDER_REVIEW' && <Badge variant="default" className="bg-yellow-500">En Revisión</Badge>}
                {report.status === 'RESOLVED' && <Badge variant="default" className="bg-green-500">Resuelto</Badge>}
                {report.status === 'DISMISSED' && <Badge variant="secondary">Descartado</Badge>}
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Motivo</Label>
              <div className="mt-1">
                <Badge variant="outline">{report.reasonLabel}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Fecha de Reporte</Label>
              <p className="text-sm font-medium">{formatDate(report.created_at)}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Antigüedad</Label>
              <p className="text-sm font-medium">
                {report.daysOld} {report.daysOld === 1 ? 'día' : 'días'}
              </p>
            </div>
          </div>

          {/* Reporter Info */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              Información del Reportante
            </h3>
            {report.reporter ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Nombre</Label>
                  <p className="text-sm font-medium">{report.reporter.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="text-sm font-medium">{report.reporter.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-500 italic">
                Usuario eliminado
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Home className="h-4 w-4" />
              Información de la Propiedad
            </h3>
            {report.property ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Título</Label>
                  <Link
                    href={`/properties/${report.property.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline block"
                    target="_blank"
                  >
                    {report.property.title}
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Precio</Label>
                    <p className="text-sm font-medium">
                      {formatCurrency(report.property.price, report.property.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Ubicación</Label>
                    <p className="text-sm font-medium">
                      {report.property.city}, {report.property.province}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Estado de la Propiedad</Label>
                  <Badge variant="outline">{report.property.status}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-sm text-red-500 italic">
                Propiedad eliminada
              </div>
            )}
          </div>

          {/* Report Details */}
          <div>
            <Label className="font-semibold">Detalles del Reporte</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{report.details}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <Label className="font-semibold mb-3 block">Acciones Rápidas</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50"
                onClick={() => handleQuickAction('approve')}
                disabled={isSubmitting}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleQuickAction('remove_property')}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Eliminar Propiedad
              </Button>
              <Button
                variant="outline"
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                onClick={() => handleQuickAction('warn_user')}
                disabled={isSubmitting}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Advertir Usuario
              </Button>
              <Button
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                onClick={() => handleQuickAction('dismiss')}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Descartar
              </Button>
            </div>
          </div>

          {/* Manual Update Form */}
          <div className="border-t pt-6">
            <Label className="font-semibold mb-3 block">Actualización Manual</Label>
            <div className="space-y-4">
              <div>
                <Label>Estado</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="UNDER_REVIEW">En Revisión</SelectItem>
                    <SelectItem value="RESOLVED">Resuelto</SelectItem>
                    <SelectItem value="DISMISSED">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Acción Tomada</Label>
                <Select value={actionTaken} onValueChange={setActionTaken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar acción..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Aprobado - No hay problema</SelectItem>
                    <SelectItem value="property_removed">Propiedad eliminada</SelectItem>
                    <SelectItem value="user_warned">Usuario advertido</SelectItem>
                    <SelectItem value="dismissed">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notas del Administrador</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agregar notas sobre la resolución del reporte..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateReport} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </div>

          {/* Review History */}
          {report.reviewed_by_id && (
            <div className="border-t pt-6">
              <Label className="font-semibold mb-3 block">Historial de Revisión</Label>
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div>
                  <Label className="text-xs text-gray-500">Revisado el</Label>
                  <p className="text-sm">{report.reviewed_at ? formatDate(report.reviewed_at) : 'N/A'}</p>
                </div>
                {report.admin_notes && (
                  <div>
                    <Label className="text-xs text-gray-500">Notas</Label>
                    <p className="text-sm whitespace-pre-wrap">{report.admin_notes}</p>
                  </div>
                )}
                {report.action_taken && (
                  <div>
                    <Label className="text-xs text-gray-500">Acción tomada</Label>
                    <Badge variant="outline">{report.action_taken}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
