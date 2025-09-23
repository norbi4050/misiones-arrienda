import { NextRequest, NextResponse } from 'next/server'

// =====================================================
// POST /api/roommates/[id]/report - REPORTAR ROOMMATE
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== POST /api/roommates/[id]/report [${requestId}] ===`)
  
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Verificar que sea un UUID válido
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    if (!isUUID) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar autenticación (requerida para reportes)
    const { getAuthenticatedUser } = await import('@/lib/auth-middleware')
    const authenticatedUser = await getAuthenticatedUser(request)
    
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] Usuario autenticado: ${authenticatedUser.id}`)

    // Leer y validar datos del body
    const bodyText = await request.text()
    const body = JSON.parse(bodyText)

    // Validar datos con Zod
    const { roommateReportSchema } = await import('@/lib/validations/roommate')
    const validationResult = roommateReportSchema.safeParse({
      ...body,
      roommatePostId: id
    })
    
    if (!validationResult.success) {
      console.log(`[${requestId}] Validación de reporte fallida:`, validationResult.error)
      return NextResponse.json(
        { error: 'Datos de reporte inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { reason, description } = validationResult.data

    // Crear cliente Supabase con Service Role
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que el roommate existe y está publicado
    const { data: existingRoommate, error: fetchError } = await supabase
      .from('roommate_posts')
      .select('id, status, is_active, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRoommate) {
      console.log(`[${requestId}] Roommate no encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Roommate no encontrado' },
        { status: 404 }
      )
    }

    // Solo permitir reportes en roommates publicados
    if (existingRoommate.status !== 'PUBLISHED') {
      console.log(`[${requestId}] Roommate no está disponible para reportes`)
      return NextResponse.json(
        { error: 'Roommate no disponible' },
        { status: 404 }
      )
    }

    // No permitir que el dueño reporte su propio post
    if (existingRoommate.user_id === authenticatedUser.id) {
      console.log(`[${requestId}] Usuario no puede reportar su propio roommate`)
      return NextResponse.json(
        { error: 'No puedes reportar tu propio post' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un reporte del usuario para este post
    const { data: existingReport, error: reportCheckError } = await supabase
      .from('roommate_reports')
      .select('id')
      .eq('roommate_post_id', id)
      .eq('user_id', authenticatedUser.id)
      .single()

    if (reportCheckError && reportCheckError.code !== 'PGRST116') {
      console.error(`[${requestId}] Error verificando reporte existente:`, reportCheckError)
      return NextResponse.json(
        { error: 'Error al verificar reporte' },
        { status: 500 }
      )
    }

    if (existingReport) {
      console.log(`[${requestId}] Usuario ya reportó este roommate`)
      return NextResponse.json(
        { error: 'Ya has reportado este post anteriormente' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Creando reporte: ${reason}`)

    // Crear reporte
    const { data: newReport, error: insertError } = await supabase
      .from('roommate_reports')
      .insert({
        roommate_post_id: id,
        user_id: authenticatedUser.id,
        reason: reason,
        description: description || null,
        created_at: new Date().toISOString()
      })
      .select('id, reason, created_at')
      .single()

    if (insertError) {
      console.error(`[${requestId}] Error creando reporte:`, insertError)
      return NextResponse.json(
        { error: 'Error al crear reporte' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Reporte creado exitosamente: ${newReport.id}`)

    return NextResponse.json({
      success: true,
      reportId: newReport.id,
      reason: newReport.reason,
      message: 'Reporte enviado exitosamente. Será revisado por nuestro equipo.',
      meta: {
        requestId,
        action: 'report',
        createdAt: newReport.created_at
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de datos inválido - JSON malformado' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
