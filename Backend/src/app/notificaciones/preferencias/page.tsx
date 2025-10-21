'use client'

/**
 * Página: /notificaciones/preferencias
 *
 * Configuración de preferencias de notificaciones
 * - Canales: Email, In-App, Push
 * - Tipos de notificaciones
 * - Guardar cambios
 */

import { useState, useEffect } from 'react'
import { useNotificationPreferences } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Settings, Bell, Mail, Smartphone, Save, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function NotificationPreferencesPage() {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences()
  const [localPrefs, setLocalPrefs] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences)
    }
  }, [preferences])

  const handleToggle = (key: string) => {
    if (!localPrefs) return
    setLocalPrefs({
      ...localPrefs,
      [key]: !localPrefs[key]
    })
    setSaved(false)
  }

  const handleSave = async () => {
    if (!localPrefs) return

    setSaving(true)
    const result = await updatePreferences(localPrefs)
    setSaving(false)

    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (isLoading || !localPrefs) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Preferencias de Notificaciones
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Personaliza cómo y cuándo quieres recibir notificaciones
              </p>
            </div>

            <Link href="/notificaciones">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Ver notificaciones
              </Button>
            </Link>
          </div>
        </div>

        {/* Canales de notificación */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Canales de Notificación
          </h2>

          <div className="space-y-4">
            <PreferenceToggle
              icon={<Mail className="h-5 w-5" />}
              title="Notificaciones por Email"
              description="Recibe notificaciones en tu correo electrónico"
              checked={localPrefs.emailEnabled}
              onChange={() => handleToggle('emailEnabled')}
            />

            <PreferenceToggle
              icon={<Bell className="h-5 w-5" />}
              title="Notificaciones In-App"
              description="Ve notificaciones dentro de la aplicación"
              checked={localPrefs.inAppEnabled}
              onChange={() => handleToggle('inAppEnabled')}
            />

            <PreferenceToggle
              icon={<Smartphone className="h-5 w-5" />}
              title="Notificaciones Push"
              description="Recibe notificaciones en tu dispositivo"
              checked={localPrefs.pushEnabled}
              onChange={() => handleToggle('pushEnabled')}
              badge="Próximamente"
            />
          </div>
        </div>

        {/* Mensajes */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Mensajes y Comunicación
          </h2>

          <div className="space-y-4">
            <PreferenceToggle
              title="Nuevos mensajes"
              description="Cuando alguien te envía un mensaje"
              checked={localPrefs.newMessages}
              onChange={() => handleToggle('newMessages')}
            />

            <PreferenceToggle
              title="Respuestas a mensajes"
              description="Cuando alguien responde a tu mensaje"
              checked={localPrefs.messageReplies}
              onChange={() => handleToggle('messageReplies')}
            />
          </div>
        </div>

        {/* Propiedades */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Propiedades e Inmuebles
          </h2>

          <div className="space-y-4">
            <PreferenceToggle
              title="Consultas sobre propiedades"
              description="Cuando alguien consulta sobre tus propiedades"
              checked={localPrefs.propertyInquiries}
              onChange={() => handleToggle('propertyInquiries')}
            />

            <PreferenceToggle
              title="Respuestas a consultas"
              description="Cuando te responden una consulta"
              checked={localPrefs.inquiryReplies}
              onChange={() => handleToggle('inquiryReplies')}
            />

            <PreferenceToggle
              title="Cambios de estado"
              description="Cuando una propiedad cambia de estado"
              checked={localPrefs.propertyStatusChanges}
              onChange={() => handleToggle('propertyStatusChanges')}
            />

            <PreferenceToggle
              title="Propiedades por expirar"
              description="Recordatorio cuando tus publicaciones están por expirar"
              checked={localPrefs.propertyExpiring}
              onChange={() => handleToggle('propertyExpiring')}
            />

            <PreferenceToggle
              title="Actualizaciones de favoritos"
              description="Cuando una propiedad en tus favoritos se actualiza"
              checked={localPrefs.favoritePropertyUpdates}
              onChange={() => handleToggle('favoritePropertyUpdates')}
            />

            <PreferenceToggle
              title="Nuevas propiedades en tu área"
              description="Cuando se publican propiedades en zonas de tu interés"
              checked={localPrefs.newPropertiesInArea}
              onChange={() => handleToggle('newPropertiesInArea')}
            />
          </div>
        </div>

        {/* Actividad Social */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad Social
          </h2>

          <div className="space-y-4">
            <PreferenceToggle
              title="Likes recibidos"
              description="Cuando alguien le da like a tu contenido"
              checked={localPrefs.likesReceived}
              onChange={() => handleToggle('likesReceived')}
            />

            <PreferenceToggle
              title="Nuevos seguidores"
              description="Cuando alguien comienza a seguirte"
              checked={localPrefs.newFollowers}
              onChange={() => handleToggle('newFollowers')}
            />
          </div>
        </div>

        {/* Pagos y Planes */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pagos y Suscripciones
          </h2>

          <div className="space-y-4">
            <PreferenceToggle
              title="Pagos completados"
              description="Confirmación de pagos realizados"
              checked={localPrefs.paymentsCompleted}
              onChange={() => handleToggle('paymentsCompleted')}
            />

            <PreferenceToggle
              title="Plan por expirar"
              description="Recordatorio cuando tu plan está por vencer"
              checked={localPrefs.planExpiring}
              onChange={() => handleToggle('planExpiring')}
            />

            <PreferenceToggle
              title="Plan expirado"
              description="Aviso cuando tu plan ha expirado"
              checked={localPrefs.planExpired}
              onChange={() => handleToggle('planExpired')}
            />

            <PreferenceToggle
              title="Facturas disponibles"
              description="Cuando tienes nuevas facturas listas"
              checked={localPrefs.invoicesReady}
              onChange={() => handleToggle('invoicesReady')}
            />
          </div>
        </div>

        {/* Sistema */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sistema y Seguridad
          </h2>

          <div className="space-y-4">
            <PreferenceToggle
              title="Anuncios del sistema"
              description="Actualizaciones importantes de la plataforma"
              checked={localPrefs.systemAnnouncements}
              onChange={() => handleToggle('systemAnnouncements')}
            />

            <PreferenceToggle
              title="Alertas de seguridad"
              description="Notificaciones sobre la seguridad de tu cuenta"
              checked={localPrefs.securityAlerts}
              onChange={() => handleToggle('securityAlerts')}
            />
          </div>
        </div>

        {/* Marketing */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Marketing y Promociones
          </h2>

          <div className="space-y-4">
            <PreferenceToggle
              title="Emails promocionales"
              description="Ofertas especiales y promociones"
              checked={localPrefs.promotionalEmails}
              onChange={() => handleToggle('promotionalEmails')}
            />

            <PreferenceToggle
              title="Newsletter"
              description="Novedades y contenido destacado"
              checked={localPrefs.newsletter}
              onChange={() => handleToggle('newsletter')}
            />
          </div>
        </div>

        {/* Botón guardar */}
        <div className="sticky bottom-4 bg-white rounded-lg shadow-lg p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {saved ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Cambios guardados
              </span>
            ) : (
              'Realiza cambios en tus preferencias'
            )}
          </p>

          <Button
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para cada preferencia
function PreferenceToggle({
  icon,
  title,
  description,
  checked,
  onChange,
  badge
}: {
  icon?: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: () => void
  badge?: string
}) {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex items-start gap-3 flex-1">
        {icon && (
          <div className="text-gray-400 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
          checked ? 'bg-blue-600' : 'bg-gray-200'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}
