'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Flag, Eye, Check, X, AlertTriangle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ReportDetailModal } from './ReportDetailModal'

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

interface ReportsResponse {
  success: boolean
  reports: PropertyReport[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
  stats: {
    PENDING: number
    UNDER_REVIEW: number
    RESOLVED: number
    DISMISSED: number
    TOTAL: number
  }
}

export function ReportsListClient() {
  const [reports, setReports] = useState<PropertyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING')
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  })
  const [stats, setStats] = useState({
    PENDING: 0,
    UNDER_REVIEW: 0,
    RESOLVED: 0,
    DISMISSED: 0,
    TOTAL: 0,
  })
  const [selectedReport, setSelectedReport] = useState<PropertyReport | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [selectedStatus, pagination.offset])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/reports?status=${selectedStatus}&limit=${pagination.limit}&offset=${pagination.offset}`
      )

      if (!response.ok) {
        throw new Error('Error fetching reports')
      }

      const data: ReportsResponse = await response.json()

      if (data.success) {
        setReports(data.reports)
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="destructive">Pendiente</Badge>
      case 'UNDER_REVIEW':
        return <Badge variant="default" className="bg-yellow-500">En Revisión</Badge>
      case 'RESOLVED':
        return <Badge variant="default" className="bg-green-500">Resuelto</Badge>
      case 'DISMISSED':
        return <Badge variant="secondary">Descartado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  const handleViewReport = (report: PropertyReport) => {
    setSelectedReport(report)
    setIsModalOpen(true)
  }

  const handleReportUpdated = () => {
    fetchReports()
    setIsModalOpen(false)
    setSelectedReport(null)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer transition-all ${selectedStatus === 'ALL' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedStatus('ALL')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Todos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.TOTAL}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${selectedStatus === 'PENDING' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setSelectedStatus('PENDING')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.PENDING}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${selectedStatus === 'UNDER_REVIEW' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setSelectedStatus('UNDER_REVIEW')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">En Revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.UNDER_REVIEW}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${selectedStatus === 'RESOLVED' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setSelectedStatus('RESOLVED')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Resueltos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.RESOLVED}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${selectedStatus === 'DISMISSED' ? 'ring-2 ring-gray-500' : ''}`}
          onClick={() => setSelectedStatus('DISMISSED')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Descartados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.DISMISSED}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reportes de Propiedades</CardTitle>
              <CardDescription>
                {pagination.total} reportes en total
              </CardDescription>
            </div>
            <Button onClick={fetchReports} variant="outline" size="sm">
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay reportes</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron reportes con el estado seleccionado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Antigüedad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {report.property ? (
                            <>
                              <Link
                                href={`/properties/${report.property.id}`}
                                className="font-medium text-blue-600 hover:underline line-clamp-1"
                                target="_blank"
                              >
                                {report.property.title}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(report.property.price, report.property.currency)} •{' '}
                                {report.property.city}, {report.property.province}
                              </p>
                            </>
                          ) : (
                            <div className="text-sm text-red-500 italic">
                              Propiedad eliminada
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.reasonLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          {report.reporter ? (
                            <>
                              <p className="text-sm font-medium">{report.reporter.name}</p>
                              <p className="text-xs text-gray-500">{report.reporter.email}</p>
                            </>
                          ) : (
                            <div className="text-sm text-red-500 italic">
                              Usuario eliminado
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={report.daysOld > 7 ? 'destructive' : 'secondary'}
                        >
                          {report.daysOld} {report.daysOld === 1 ? 'día' : 'días'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && reports.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Mostrando {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
                  disabled={pagination.offset === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}
                  disabled={!pagination.hasMore}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedReport(null)
          }}
          onReportUpdated={handleReportUpdated}
        />
      )}
    </div>
  )
}
