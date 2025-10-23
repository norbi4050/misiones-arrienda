'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export function SupportListClient() {
  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">0</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resueltos</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mensaje de próximamente */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Soporte</CardTitle>
          <CardDescription>
            Centro de gestión de tickets y solicitudes de ayuda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sistema de Soporte en Desarrollo
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              El sistema de tickets de soporte estará disponible próximamente.
              Incluirá:
            </p>
            <ul className="text-left text-gray-600 max-w-md mx-auto mt-4 space-y-2">
              <li>✓ Gestión de tickets por usuario</li>
              <li>✓ Chat en tiempo real con usuarios</li>
              <li>✓ Categorización y priorización</li>
              <li>✓ Historial de conversaciones</li>
              <li>✓ Notificaciones y alertas</li>
            </ul>
            <div className="mt-8">
              <p className="text-sm text-gray-500">
                Por ahora, los usuarios pueden contactar mediante los reportes de propiedades
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
