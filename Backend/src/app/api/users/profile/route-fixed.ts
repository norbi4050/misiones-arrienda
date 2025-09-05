import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mapeo de campos entre frontend (camelCase) y database (snake_case)
const fieldMapping = {
  name: 'name',
  phone: 'phone', 
  location: 'location',
  searchType: 'search_type',
  budgetRange: 'budget_range',
  bio: 'bio',
  profileImage: 'profile_image',
  preferredAreas: 'preferred_areas',
  familySize: 'family_size',
  petFriendly: 'pet_friendly',
  moveInDate: 'move_in_date',
  employmentStatus: 'employment_status',
  monthlyIncome: 'monthly_income'
}

// Función para validar y limpiar datos
function validateProfileData(data: any) {
  const validatedData: any = {}
  
  // Validar campos de texto
  if (data.name && typeof data.name === 'string' && data.name.trim().length > 0) {
    validatedData.name = data.name.trim()
  }
  
  if (data.phone && typeof data.phone === 'string' && data.phone.trim().length > 0) {
    validatedData.phone = data.phone.trim()
  }
  
  if (data.location && typeof data.location === 'string' && data.location.trim().length > 0) {
    validatedData.location = data.location.trim()
  }
  
  if (data.bio && typeof data.bio === 'string') {
    validatedData.bio = data.bio.trim()
  }
  
  if (data.profileImage && typeof data.profileImage === 'string') {
    validatedData.profile_image = data.profileImage.trim()
  }
  
  // Validar campos específicos con valores permitidos
  if (data.searchType && ['rent', 'buy', 'both'].includes(data.searchType)) {
    validatedData.search_type = data.searchType
  }
  
  if (data.budgetRange && typeof data.budgetRange === 'string') {
    validatedData.budget_range = data.budgetRange
  }
  
  if (data.preferredAreas && typeof data.preferredAreas === 'string') {
    validatedData.preferred_areas = data.preferredAreas
  }
  
  if (data.employmentStatus && typeof data.employmentStatus === 'string') {
    validatedData.employment_status = data.employmentStatus
  }
  
  // Validar campos numéricos
  if (data.familySize && Number.isInteger(Number(data.familySize)) && Number(data.familySize) > 0) {
    validatedData.family_size = Number(data.familySize)
  }
  
  if (data.monthlyIncome && Number.isFinite(Number(data.monthlyIncome)) && Number(data.monthlyIncome) >= 0) {
    validatedData.monthly_income = Number(data.monthlyIncome)
  }
  
  // Validar campos booleanos
  if (typeof data.petFriendly === 'boolean') {
    validatedData.pet_friendly = data.petFriendly
  }
  
  // Validar fechas
  if (data.moveInDate && typeof data.moveInDate === 'string') {
    const date = new Date(data.moveInDate)
    if (!isNaN(date.getTime())) {
      validatedData.move_in_date = data.moveInDate
    }
  }
  
  return validatedData
}

async function handleProfileUpdate(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    
    // Log de la solicitud para debugging
    console.log('Profile update request:', {
      method: request.method,
      userId: user.id,
      bodyKeys: Object.keys(body),
      timestamp: new Date().toISOString()
    })

    // Validar y limpiar datos
    const validatedData = validateProfileData(body)
    
    // Verificar que hay datos para actualizar
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json({ 
        error: 'No se proporcionaron datos válidos para actualizar' 
      }, { status: 400 })
    }

    console.log('Validated data for database:', Object.keys(validatedData))

    // Actualizar el perfil del usuario en la tabla users
    const { data, error } = await supabase
      .from('users')
      .update(validatedData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        timestamp: new Date().toISOString()
      })
      
      // Respuestas específicas según el tipo de error
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'Datos duplicados detectados',
          field: error.details,
          code: error.code
        }, { status: 400 })
      }
      
      if (error.code === '23502') {
        return NextResponse.json({ 
          error: 'Campo requerido faltante',
          field: error.details,
          code: error.code
        }, { status: 400 })
      }
      
      if (error.code === '42703') {
        return NextResponse.json({ 
          error: 'Campo no existe en la tabla',
          field: error.details,
          code: error.code
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Error al actualizar el perfil: ' + error.message,
        code: error.code,
        details: error.details || 'No additional details'
      }, { status: 500 })
    }

    // Mapear campos de la base de datos al formato del frontend para la respuesta
    const mappedUser: any = {}
    
    if (data) {
      Object.keys(data).forEach(key => {
        // Buscar el campo correspondiente en el mapeo inverso
        const frontendField = Object.keys(fieldMapping).find(
          frontendKey => fieldMapping[frontendKey as keyof typeof fieldMapping] === key
        )
        
        if (frontendField) {
          mappedUser[frontendField] = data[key]
        } else {
          // Mantener campos que no necesitan mapeo
          mappedUser[key] = data[key]
        }
      })
    }

    return NextResponse.json({ 
      message: 'Perfil actualizado exitosamente',
      user: mappedUser 
    })

  } catch (error) {
    console.error('Profile update error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el perfil del usuario
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', {
        message: error.message,
        details: error.details,
        code: error.code,
        timestamp: new Date().toISOString()
      })
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Usuario no encontrado',
          code: error.code
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Error al obtener el perfil',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    // Mapear campos de la base de datos al formato del frontend
    const mappedUser: any = {}
    
    if (data) {
      Object.keys(data).forEach(key => {
        // Buscar el campo correspondiente en el mapeo inverso
        const frontendField = Object.keys(fieldMapping).find(
          frontendKey => fieldMapping[frontendKey as keyof typeof fieldMapping] === key
        )
        
        if (frontendField) {
          mappedUser[frontendField] = data[key]
        } else {
          // Mantener campos que no necesitan mapeo
          mappedUser[key] = data[key]
        }
      })
    }

    return NextResponse.json({ user: mappedUser })

  } catch (error) {
    console.error('Profile fetch error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
