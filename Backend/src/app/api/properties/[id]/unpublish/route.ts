import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== PATCH /api/properties/[id]/unpublish [${requestId}] ===`)

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de propiedad requerido' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Despublicando propiedad:`, id)

    // Crear cliente Supabase con cookies (autenticación)
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log(`[${requestId}] Usuario no autenticado`)
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] Usuario autenticado:`, user.id)

    // Buscar propiedad y verificar ownership
    const { data: property, error: findError } = await supabase
      .from('properties')
      .select('id, user_id, status, is_active, title')
      .eq('id', id)
      .single()

    if (findError) {
      console.error(`[${requestId}] Error buscando propiedad:`, findError)
      
      if (findError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Propiedad no encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Error al buscar la propiedad' },
        { status: 500 }
      )
    }

    // Verificar ownership
    if (property.user_id !== user.id) {
      console.log(`[${requestId}] Usuario ${user.id} no es propietario de ${id}`)
      return NextResponse.json(
        { error: 'No tienes permisos para despublicar esta propiedad' },
        { status: 403 }
      )
    }

    console.log(`[${requestId}] Ownership verificado para:`, property.title)

    // Verificar que la propiedad esté publicada
    if (property.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Solo se pueden despublicar propiedades que estén publicadas' },
        { status: 400 }
      )
    }

    // Actualizar propiedad: PUBLISHED → DRAFT
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({
        status: 'DRAFT',
        is_active: false,
        published_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Doble verificación de ownership
      .select('id, status, is_active, title')
      .single()

    if (updateError) {
      console.error(`[${requestId}] Error despublicando:`, updateError)
      return NextResponse.json(
        { error: 'Error al despublicar la propiedad' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Propiedad despublicada exitosamente:`, updatedProperty.title)

    return NextResponse.json({
      id: updatedProperty.id,
      status: updatedProperty.status,
      is_active: updatedProperty.is_active,
      message: 'Propiedad despublicada exitosamente'
    })

  } catch (error) {
    console.error(`[${requestId}] Error general:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
