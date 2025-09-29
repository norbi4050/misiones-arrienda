import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// Schema de validación para reportes
const reportSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'fake', 'harassment', 'other']),
  details: z.string().min(10, 'Detalles deben tener al menos 10 caracteres').max(500, 'Detalles no pueden exceder 500 caracteres')
})

// POST /api/comunidad/profiles/[id]/report - Reportar perfil
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const profileId = params.id
    const body = await request.json()
    const { reason, details } = reportSchema.parse(body)

    // Verificar que el perfil existe
    const { data: profile, error: profileError } = await supabase
      .from('community_profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no se esté reportando a sí mismo
    if (user.id === profile.user_id) {
      return NextResponse.json(
        { error: 'No puedes reportar tu propio perfil' },
        { status: 400 }
      )
    }

    // Verificar si ya reportó este perfil
    const { data: existingReport } = await supabase
      .from('community_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('reported_user_id', profile.user_id)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: 'Ya has reportado este perfil' },
        { status: 400 }
      )
    }

    // Crear el reporte
    const { data: newReport, error: reportError } = await supabase
      .from('community_reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: profile.user_id,
        reason,
        details,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (reportError) {
      console.error('Error creating report:', reportError)
      return NextResponse.json(
        { error: 'Error al crear reporte' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report: newReport,
      message: 'Reporte enviado correctamente. Nuestro equipo lo revisará.'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in profile report:', error)
    
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
