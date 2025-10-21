/**
 * Endpoint de prueba para el sistema de notificaciones
 *
 * Solo para desarrollo - eliminar en producción
 *
 * USO:
 * POST /api/test/notification
 * Body: {
 *   userId: "uuid-del-usuario",
 *   type: "NEW_MESSAGE" (opcional)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendNotification } from '@/lib/notification-service'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type = 'NEW_MESSAGE' } = body

    // Ejemplos de notificaciones de prueba
    const testNotifications: Record<string, any> = {
      NEW_MESSAGE: {
        userId: user.id,
        type: 'NEW_MESSAGE',
        title: 'Nuevo mensaje de prueba',
        message: 'Este es un mensaje de prueba del sistema de notificaciones.',
        channels: ['in_app', 'email'],
        metadata: {
          messageId: 'test-123',
          senderName: 'Usuario de Prueba',
          messagePreview: 'Hola, esto es una prueba...',
          ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/comunidad/mensajes`,
          ctaText: 'Ver mensaje'
        }
      },
      INQUIRY_RECEIVED: {
        userId: user.id,
        type: 'INQUIRY_RECEIVED',
        title: 'Nueva consulta sobre tu propiedad',
        message: 'Juan Pérez te ha enviado una consulta sobre "Casa en Posadas"',
        channels: ['in_app', 'email'],
        metadata: {
          propertyTitle: 'Casa en Posadas',
          customerName: 'Juan Pérez',
          customerEmail: 'juan@example.com',
          ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/mis-propiedades`,
          ctaText: 'Ver consultas'
        }
      },
      PLAN_EXPIRING: {
        userId: user.id,
        type: 'PLAN_EXPIRING',
        title: 'Tu plan Premium expira en 3 días',
        message: 'Tu plan Premium expirará el 24/10/2025. Renueva ahora para mantener tus beneficios.',
        channels: ['in_app', 'email'],
        metadata: {
          planType: 'premium',
          daysRemaining: 3,
          ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/planes`,
          ctaText: 'Renovar Plan'
        }
      },
      LIKE_RECEIVED: {
        userId: user.id,
        type: 'LIKE_RECEIVED',
        title: 'A María le gustó tu post',
        message: 'María dio like a tu post: "Busco departamento en el centro..."',
        channels: ['in_app'],
        metadata: {
          likerId: 'test-user-id',
          likerName: 'María',
          postContent: 'Busco departamento en el centro de Posadas',
          ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/comunidad`,
          ctaText: 'Ver post'
        }
      },
      FAVORITE_PROPERTY_UPDATED: {
        userId: user.id,
        type: 'FAVORITE_PROPERTY_UPDATED',
        title: 'Propiedad favorita actualizada',
        message: 'La propiedad "Departamento Céntrico" que guardaste en favoritos ha sido publicada y está disponible para alquiler.',
        channels: ['in_app', 'email'],
        metadata: {
          propertyTitle: 'Departamento Céntrico',
          operationType: 'rent',
          price: 150000,
          ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/propiedades/123`,
          ctaText: 'Ver propiedad'
        }
      }
    }

    const notificationData = testNotifications[type] || testNotifications.NEW_MESSAGE

    // Enviar notificación
    const result = await sendNotification(notificationData)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Notificación de prueba "${type}" enviada correctamente`
        : 'Error al enviar notificación',
      type,
      error: result.error
    })

  } catch (error) {
    console.error('[Test Notification] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// GET para mostrar tipos disponibles
export async function GET(request: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Endpoint de prueba de notificaciones',
    availableTypes: [
      'NEW_MESSAGE',
      'INQUIRY_RECEIVED',
      'PLAN_EXPIRING',
      'LIKE_RECEIVED',
      'FAVORITE_PROPERTY_UPDATED'
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/test/notification',
      body: {
        type: 'NEW_MESSAGE (opcional, por defecto NEW_MESSAGE)'
      },
      example: `
        fetch('/api/test/notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'INQUIRY_RECEIVED' })
        })
      `
    }
  })
}
