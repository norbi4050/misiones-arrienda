import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin, ADMIN_ACCESS_DENIED, logAdminAccess } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Mapeo de razones a español
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
 * GET /api/admin/reports
 * Obtener todos los reportes (solo admins)
 * Query params:
 *  - status: PENDING | UNDER_REVIEW | RESOLVED | DISMISSED
 *  - limit: número de resultados (default: 50)
 *  - offset: paginación (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos de admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(ADMIN_ACCESS_DENIED, { status: 403 })
    }

    // Log admin access
    await logAdminAccess('view_reports')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createClient()

    // Query base - usando LEFT JOIN (sin !) para manejar reportes huérfanos
    let query = supabase
      .from('property_reports')
      .select(`
        id,
        property_id,
        reporter_id,
        reason,
        details,
        status,
        reviewed_by_id,
        reviewed_at,
        admin_notes,
        action_taken,
        created_at,
        updated_at,
        property:Property(
          id,
          title,
          price,
          currency,
          city,
          province,
          status,
          user_id
        ),
        reporter:User(
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filtrar por status si se especifica
    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }

    // Paginación
    query = query.range(offset, offset + limit - 1)

    const { data: reports, error, count } = await query

    if (error) {
      console.error('[AdminReports] Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Error al obtener reportes' },
        { status: 500 }
      )
    }

    // Enriquecer reportes con labels
    const enrichedReports = reports?.map(report => ({
      ...report,
      reasonLabel: REASON_LABELS[report.reason] || report.reason,
      // Calcular días desde el reporte
      daysOld: Math.floor(
        (new Date().getTime() - new Date(report.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
      )
    }))

    // Obtener estadísticas
    const { data: stats } = await supabase
      .from('property_reports')
      .select('status', { count: 'exact', head: false })

    const statusCounts = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      RESOLVED: 0,
      DISMISSED: 0,
      TOTAL: stats?.length || 0
    }

    stats?.forEach((s: any) => {
      statusCounts[s.status as keyof typeof statusCounts] =
        (statusCounts[s.status as keyof typeof statusCounts] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      reports: enrichedReports || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      },
      stats: statusCounts
    })
  } catch (error) {
    console.error('[AdminReports] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/reports
 * Actualizar estado de un reporte (solo admins)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verificar permisos de admin
    const adminUser = await isCurrentUserAdmin()
    if (!adminUser) {
      return NextResponse.json(ADMIN_ACCESS_DENIED, { status: 403 })
    }

    const body = await request.json()
    const { reportId, status, adminNotes, actionTaken } = body

    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId es requerido' },
        { status: 400 }
      )
    }

    // Log admin action
    await logAdminAccess('update_report', {
      report_id: reportId,
      new_status: status,
      action_taken: actionTaken
    })

    const supabase = createClient()

    // Obtener info del admin actual para reviewed_by_id
    const { data: { user } } = await supabase.auth.getUser()

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (adminNotes !== undefined) updateData.admin_notes = adminNotes
    if (actionTaken !== undefined) updateData.action_taken = actionTaken

    // Si se está resolviendo, marcar reviewed_by y reviewed_at
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      updateData.reviewed_by_id = user?.id
      updateData.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('property_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()

    if (error) {
      console.error('[AdminReports] Error updating report:', error)
      return NextResponse.json(
        { error: 'Error al actualizar reporte' },
        { status: 500 }
      )
    }

    // Si la acción fue eliminar la propiedad, hacerlo
    if (actionTaken === 'property_removed') {
      const report = await supabase
        .from('property_reports')
        .select('property_id')
        .eq('id', reportId)
        .single()

      if (report.data) {
        await supabase
          .from('Property')
          .update({ status: 'REMOVED' }) // O delete si prefieres
          .eq('id', report.data.property_id)
      }
    }

    return NextResponse.json({
      success: true,
      report: data,
      message: 'Reporte actualizado correctamente'
    })
  } catch (error) {
    console.error('[AdminReports] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
