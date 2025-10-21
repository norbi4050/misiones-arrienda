'use client'

import { useState, useEffect } from 'react'
import { useNotificationPreferences } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Bell, Mail, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotificationPreferencesPage() {
  const router = useRouter()
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences()
  const [localPreferences, setLocalPreferences] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences)
    }
  }, [preferences])

  const handleToggle = (key: string) => {
    if (!localPreferences) return
    setLocalPreferences({
      ...localPreferences,
      [key]: !localPreferences[key]
    })
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    if (!localPreferences) return

    setIsSaving(true)
    try {
      await updatePreferences(localPreferences)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !localPreferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const PreferenceToggle = ({ label, description, value, onChange }: any) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200">
      <div className="flex-1 mr-4">
        <p className="font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${value ? 'bg-blue-600' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${value ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Volver
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Preferencias de Notificaciones
        </h1>
        <p className="text-gray-600">
          Personaliza cómo y cuándo deseas recibir notificaciones
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Global Channel Settings */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Canales de Notificación
            </h2>
          </div>
          <div className="space-y-1">
            <PreferenceToggle
              label="Notificaciones en la app"
              description="Recibe notificaciones dentro de la plataforma"
              value={localPreferences.inAppEnabled}
              onChange={() => handleToggle('inAppEnabled')}
            />
            <PreferenceToggle
              label="Notificaciones por email"
              description="Recibe notificaciones en tu correo electrónico"
              value={localPreferences.emailEnabled}
              onChange={() => handleToggle('emailEnabled')}
            />
            <PreferenceToggle
              label="Notificaciones push (próximamente)"
              description="Recibe notificaciones push en tu dispositivo"
              value={localPreferences.pushEnabled}
              onChange={() => handleToggle('pushEnabled')}
            />
          </div>
        </div>

        {/* Messaging Notifications */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            💬 Mensajes
          </h2>
          <div className="space-y-1">
            <PreferenceToggle
              label="Mensajes nuevos"
              description="Cuando recibes un nuevo mensaje"
              value={localPreferences.newMessages}
              onChange={() => handleToggle('newMessages')}
            />
            <PreferenceToggle
              label="Respuestas a mensajes"
              description="Cuando alguien responde a tu mensaje"
              value={localPreferences.messageReplies}
              onChange={() => handleToggle('messageReplies')}
            />
          </div>
        </div>

        {/* Property Notifications */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🏠 Propiedades
          </h2>
          <div className="space-y-1">
            <PreferenceToggle
              label="Consultas sobre propiedades"
              description="Cuando recibes una consulta sobre una propiedad"
              value={localPreferences.propertyInquiries}
              onChange={() => handleToggle('propertyInquiries')}
            />
            <PreferenceToggle
              label="Respuestas a consultas"
              description="Cuando responden a tu consulta"
              value={localPreferences.inquiryReplies}
              onChange={() => handleToggle('inquiryReplies')}
            />
            <PreferenceToggle
              label="Cambios de estado"
              description="Cuando una propiedad cambia de estado"
              value={localPreferences.propertyStatusChanges}
              onChange={() => handleToggle('propertyStatusChanges')}
            />
            <PreferenceToggle
              label="Propiedades próximas a expirar"
              description="Recordatorios de propiedades que van a expirar"
              value={localPreferences.propertyExpiring}
              onChange={() => handleToggle('propertyExpiring')}
            />
            <PreferenceToggle
              label="Actualizaciones de favoritos"
              description="Cuando una propiedad favorita se actualiza"
              value={localPreferences.favoritePropertyUpdates}
              onChange={() => handleToggle('favoritePropertyUpdates')}
            />
            <PreferenceToggle
              label="Nuevas propiedades en tu área"
              description="Cuando se publica una propiedad en tu zona de interés"
              value={localPreferences.newPropertiesInArea}
              onChange={() => handleToggle('newPropertiesInArea')}
            />
          </div>
        </div>

        {/* Social Notifications */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ❤️ Comunidad
          </h2>
          <div className="space-y-1">
            <PreferenceToggle
              label="Likes en tus posts"
              description="Cuando alguien da like a tu publicación"
              value={localPreferences.likesReceived}
              onChange={() => handleToggle('likesReceived')}
            />
            <PreferenceToggle
              label="Nuevos seguidores"
              description="Cuando alguien te empieza a seguir"
              value={localPreferences.newFollowers}
              onChange={() => handleToggle('newFollowers')}
            />
          </div>
        </div>

        {/* Payment Notifications (Inmobiliarias only) */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            💳 Pagos y Planes
          </h2>
          <div className="space-y-1">
            <PreferenceToggle
              label="Pagos completados"
              description="Confirmación cuando se procesa un pago"
              value={localPreferences.paymentsCompleted}
              onChange={() => handleToggle('paymentsCompleted')}
            />
            <PreferenceToggle
              label="Plan próximo a expirar"
              description="Recordatorios cuando tu plan está por vencer"
              value={localPreferences.planExpiring}
              onChange={() => handleToggle('planExpiring')}
            />
            <PreferenceToggle
              label="Plan expirado"
              description="Notificación cuando tu plan ha expirado"
              value={localPreferences.planExpired}
              onChange={() => handleToggle('planExpired')}
            />
            <PreferenceToggle
              label="Facturas disponibles"
              description="Cuando tienes una nueva factura disponible"
              value={localPreferences.invoicesReady}
              onChange={() => handleToggle('invoicesReady')}
            />
          </div>
        </div>

        {/* System Notifications */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📢 Sistema
          </h2>
          <div className="space-y-1">
            <PreferenceToggle
              label="Anuncios del sistema"
              description="Actualizaciones importantes de la plataforma"
              value={localPreferences.systemAnnouncements}
              onChange={() => handleToggle('systemAnnouncements')}
            />
            <PreferenceToggle
              label="Alertas de seguridad"
              description="Notificaciones sobre la seguridad de tu cuenta"
              value={localPreferences.securityAlerts}
              onChange={() => handleToggle('securityAlerts')}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {saveSuccess && (
            <p className="text-sm text-green-600 font-medium">
              ✓ Preferencias guardadas correctamente
            </p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Preferencias
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
