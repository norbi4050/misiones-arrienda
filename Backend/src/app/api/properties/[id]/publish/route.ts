import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== PATCH /api/properties/[id]/publish - PUBLICAR DRAFT ===')
  
  try {
    const { id } = params
    const body = await request.json()
    
    // Importar autenticación
    const { getAuthenticatedUser } = await import('@/lib/auth-middleware')
    
    // Verificar autenticación del usuario
    const authenticatedUser = await getAuthenticatedUser(request)
    if (!authenticatedUser) {
      console.log('❌ Usuario no autenticado')
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log('✅ Usuario autenticado:', authenticatedUser.id)
    console.log('📝 Publicando DRAFT:', id)

    // Crear cliente admin con Service Role Key
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que la propiedad existe y pertenece al usuario
    const { data: existingProperty, error: fetchError } = await supabaseAdmin
      .from('properties')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('user_id', authenticatedUser.id)
      .single()

    if (fetchError || !existingProperty) {
      console.log('❌ Propiedad no encontrada o no pertenece al usuario')
      return NextResponse.json(
        { error: 'Propiedad no encontrada o sin permisos' },
        { status: 404 }
      )
    }

    if (existingProperty.status !== 'DRAFT') {
      console.log('❌ La propiedad no está en estado DRAFT')
      return NextResponse.json(
        { error: 'Solo se pueden publicar propiedades en estado DRAFT' },
        { status: 400 }
      )
    }

    // Preparar datos de actualización (campos opcionales del PASO B)
    const updateData: any = {
      status: 'AVAILABLE',
      is_active: true
    }

    // Actualizar campos opcionales si se proporcionan
    if (body.description && String(body.description).trim()) {
      updateData.description = String(body.description).trim()
    }

    if (body.address && String(body.address).trim()) {
      updateData.address = String(body.address).trim()
    }

    if (body.contact_phone && String(body.contact_phone).trim()) {
      updateData.contact_phone = String(body.contact_phone).trim()
    }

    if (body.postal_code && String(body.postal_code).trim()) {
      updateData.postal_code = String(body.postal_code).trim()
    }

    if (body.garages && !isNaN(Number(body.garages))) {
      updateData.garages = Number(body.garages)
    }

    // Actualizar arrays si se proporcionan
    if (body.images && Array.isArray(body.images)) {
      updateData.images = JSON.stringify(body.images)
    }

    if (body.amenities && Array.isArray(body.amenities)) {
      updateData.amenities = JSON.stringify(body.amenities)
    }

    if (body.features && Array.isArray(body.features)) {
      updateData.features = JSON.stringify(body.features)
    }

    console.log('🔧 Actualizando DRAFT a PUBLISHED...')

    // Actualizar propiedad
    const { data: updatedProperty, error: updateError } = await supabaseAdmin
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', authenticatedUser.id)
      .select('id, title, price, city, status')
      .single()

    if (updateError) {
      console.error('❌ Error actualizando propiedad:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details
      })

      return NextResponse.json(
        { error: `Error al publicar: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Propiedad publicada exitosamente:', updatedProperty.id)

    return NextResponse.json({
      id: updatedProperty.id,
      title: updatedProperty.title,
      price: updatedProperty.price,
      city: updatedProperty.city,
      status: updatedProperty.status,
      message: 'Propiedad publicada exitosamente'
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in PATCH /api/properties/[id]/publish:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Error interno del servidor al publicar la propiedad' },
      { status: 500 }
    )
  }
}
