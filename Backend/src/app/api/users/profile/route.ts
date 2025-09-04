import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function handleProfileUpdate(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    
    // Log de la solicitud para debugging
    console.log('Profile update request:', {
      method: request.method,
      path: request.url,
      userId: user.id,
      body
    })

    // Actualizar el perfil del usuario en la tabla users
    const { data, error } = await supabase
      .from('users')
      .update({
        name: body.name,
        phone: body.phone,
        location: body.location,
        search_type: body.searchType,
        budget_range: body.budgetRange,
        bio: body.bio,
        profile_image: body.profileImage,
        preferred_areas: body.preferredAreas,
        family_size: body.familySize,
        pet_friendly: body.petFriendly,
        move_in_date: body.moveInDate,
        employment_status: body.employmentStatus,
        monthly_income: body.monthlyIncome,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Error al actualizar el perfil: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Perfil actualizado exitosamente',
      user: data 
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  return handleProfileUpdate(request)
}

export async function PATCH(request: NextRequest) {
  return handleProfileUpdate(request)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el perfil del usuario
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 })
    }

    return NextResponse.json({ user: data })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
