import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { EmailService } from '@/lib/email-service'

// Cliente admin con Service Role Key para operaciones administrativas
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Umbral de reportes para auto-suspensión
const AUTO_SUSPEND_THRESHOLD = 2

// Marcar esta ruta como dinámica
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteParams {
  params: {
    id: string
  }
}

// Schema de validación para reportes de propiedades
const propertyReportSchema = z.object({
  reason: z.enum([
    'scam',           // Estafa/Fraude
    'fake_images',    // Fotos falsas/engañosas
    'unrealistic_price', // Precio irreal
    'wrong_location', // Dirección incorrecta
    'not_available',  // Propiedad no disponible
    'false_info',     // Información falsa
    'duplicate',      // Duplicado
    'other'          // Otro
  ], {
    errorMap: () => ({ message: 'Categoría de reporte inválida' })
  }),
  details: z.string()
    .min(10, 'Los detalles deben tener al menos 10 caracteres')
    .max(500, 'Los detalles no pueden exceder 500 caracteres')
})

// Mapeo de razones a mensajes en español
const REASON_LABELS: Record<string, string> = {
  scam: 'Estafa/Fraude',
  fake_images: 'Fotos falsas o engañosas',
  unrealistic_price: 'Precio irreal o sospechoso',
  wrong_location: 'Dirección incorrecta',
  not_available: 'Propiedad no disponible',
  false_info: 'Información falsa o engañosa',
  duplicate: 'Publicación duplicada',
  other: 'Otro motivo'
}

/**
 * POST /api/properties/[id]/report
 * Reportar una propiedad por contenido inapropiado, fraude, etc.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()

    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para reportar una propiedad' },
        { status: 401 }
      )
    }

    const propertyId = params.id

    // 2. Validar body del request
    const body = await request.json()
    const validationResult = propertyReportSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { reason, details } = validationResult.data

    // 3. Verificar que la propiedad existe
    const { data: property, error: propertyError } = await supabase
      .from('Property')
      .select('id, title, userId')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // 4. Verificar que no esté reportando su propia propiedad
    if (user.id === property.userId) {
      return NextResponse.json(
        { error: 'No puedes reportar tu propia propiedad' },
        { status: 400 }
      )
    }

    // 5. Verificar si ya reportó esta propiedad
    const { data: existingReport } = await supabase
      .from('property_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('property_id', propertyId)
      .maybeSingle()

    if (existingReport) {
      return NextResponse.json(
        { error: 'Ya has reportado esta propiedad anteriormente' },
        { status: 400 }
      )
    }

    // 6. Generar ID para el reporte
    const reportId = `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 7. Crear el reporte
    const { data: newReport, error: reportError } = await supabase
      .from('property_reports')
      .insert({
        id: reportId,
        property_id: propertyId,
        reporter_id: user.id,
        reason,
        details,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (reportError) {
      console.error('[PropertyReport] Error creating report:', reportError)
      return NextResponse.json(
        { error: 'Error al crear el reporte. Intenta nuevamente.' },
        { status: 500 }
      )
    }

    // 8. Verificar conteo total de reportes y auto-suspender si es necesario
    const { count: totalReports } = await supabaseAdmin
      .from('property_reports')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)

    let autoSuspended = false
    if (totalReports && totalReports >= AUTO_SUSPEND_THRESHOLD) {
      // Auto-suspender la propiedad
      const { error: suspendError } = await supabaseAdmin
        .from('Property')
        .update({
          status: 'suspended',
          updatedAt: new Date().toISOString()
        })
        .eq('id', propertyId)

      if (!suspendError) {
        autoSuspended = true
        console.log(`[PropertyReport] Auto-suspended property ${propertyId} (${totalReports} reports)`)

        // Obtener información del dueño de la propiedad
        const { data: ownerData } = await supabaseAdmin
          .from('User')
          .select('name, email')
          .eq('id', property.userId)
          .maybeSingle()

        // Enviar notificación al dueño
        if (ownerData?.email) {
          await EmailService.sendPropertySuspensionEmail({
            ownerEmail: ownerData.email,
            ownerName: ownerData.name || 'Usuario',
            propertyTitle: property.title,
            propertyId: propertyId,
            reportCount: totalReports,
            suspensionReason: `Múltiples reportes recibidos (${totalReports})`
          })
        }

        // Enviar notificación a administradores
        await EmailService.sendAdminSuspensionNotification({
          propertyTitle: property.title,
          propertyId: propertyId,
          reportCount: totalReports,
          ownerEmail: ownerData?.email || 'Email no disponible'
        })
      } else {
        console.error('[PropertyReport] Error auto-suspending property:', suspendError)
      }
    }

    // 9. Obtener información del usuario para el log
    const { data: reporterProfile } = await supabase
      .from('User')
      .select('name, email')
      .eq('id', user.id)
      .single()

    console.log('[PropertyReport] New report created:', {
      reportId,
      propertyId,
      propertyTitle: property.title,
      reporterId: user.id,
      reporterName: reporterProfile?.name,
      reason: REASON_LABELS[reason],
      totalReports,
      autoSuspended,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      report: {
        id: newReport.id,
        propertyId,
        reason,
        reasonLabel: REASON_LABELS[reason],
        status: 'PENDING',
        createdAt: newReport.created_at
      },
      autoSuspended,
      totalReports,
      message: autoSuspended
        ? 'Reporte enviado. La propiedad ha sido suspendida automáticamente por múltiples reportes.'
        : 'Reporte enviado correctamente. Nuestro equipo lo revisará en breve.'
    }, { status: 201 })

  } catch (error) {
    console.error('[PropertyReport] Unexpected error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/properties/[id]/report
 * Obtener reportes de una propiedad (solo para owner o admin)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const propertyId = params.id

    // Verificar que la propiedad existe y el usuario es el dueño
    const { data: property } = await supabase
      .from('Property')
      .select('id, userId')
      .eq('id', propertyId)
      .single()

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // Solo el dueño puede ver los reportes de su propiedad
    if (property.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver estos reportes' },
        { status: 403 }
      )
    }

    // Obtener reportes de la propiedad
    const { data: reports, error: reportsError } = await supabase
      .from('property_reports')
      .select(`
        id,
        reason,
        details,
        status,
        created_at,
        updated_at,
        reporter:User!reporter_id(name)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.error('[PropertyReport] Error fetching reports:', reportsError)
      return NextResponse.json(
        { error: 'Error al obtener reportes' },
        { status: 500 }
      )
    }

    // Mapear reportes con etiquetas en español
    const reportsWithLabels = reports?.map(report => ({
      ...report,
      reasonLabel: REASON_LABELS[report.reason] || report.reason
    }))

    return NextResponse.json({
      success: true,
      reports: reportsWithLabels || [],
      count: reports?.length || 0
    })

  } catch (error) {
    console.error('[PropertyReport] Error in GET:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
