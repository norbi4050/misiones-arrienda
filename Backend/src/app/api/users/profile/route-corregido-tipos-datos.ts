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

// Función para validar y convertir tipos de datos
function validateAndConvertData(data: any): any {
  const convertedData: any = {}

  Object.keys(data).forEach(key => {
    const value = data[key]

    // Campos que deben ser INTEGER
    const integerFields = ['phone', 'family_size', 'monthly_income']

    // Campos que deben ser BOOLEAN
    const booleanFields = ['pet_friendly']

    // Campos que deben ser DATE
    const dateFields = ['move_in_date']

    if (integerFields.includes(key)) {
      // Convertir a INTEGER o null si está vacío
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else {
        const intValue = parseInt(value, 10)
        convertedData[key] = isNaN(intValue) ? null : intValue
      }
    } else if (booleanFields.includes(key)) {
      // Convertir a BOOLEAN
      convertedData[key] = Boolean(value)
    } else if (dateFields.includes(key)) {
      // Convertir a DATE o null si está vacío
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else {
        // Validar formato de fecha
        const dateValue = new Date(value)
        convertedData[key] = isNaN(dateValue.getTime()) ? null : dateValue.toISOString()
      }
    } else {
      // Campos STRING - mantener como están pero convertir null/undefined a null
      if (value === undefined) {
        convertedData[key] = null
      } else {
        convertedData[key] = value
      }
    }
  })

  return convertedData
}

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
    ,
      bodyData: body
    })

    // Mapear campos del frontend al formato de la base de datos
    const mappedData: any = {}

    Object.keys(body).forEach(key => {
      if (fieldMapping[key as keyof typeof fieldMapping]) {
        const dbField = fieldMapping[key as keyof typeof fieldMapping]
        mappedData[dbField] = body[key]
      } else {
        }
    })

    // VALIDAR Y CONVERTIR TIPOS DE DATOS - ESTA ES LA CORRECCIÓN CLAVE
    const validatedData = validateAndConvertData(mappedData)

    // Agregar timestamp de actualización
    validatedData.updated_at = new Date().toISOString()

    ,
      data: validatedData
    })

    // Actualizar el perfil del usuario en la tabla users
    const { data, error } = await supabase
      .from('users')
      .update(validatedData)
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({
        error: 'Error al actualizar el perfil: ' + error.message,
        details: error.details || 'No additional details',
        hint: error.hint || 'No hint available',
        code: error.code || 'Unknown code'
      }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: data
    })

  } catch (error) {
    console.error('Profile update error:', error)
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
      return NextResponse.json({
        error: 'Error al obtener el perfil',
        details: error.message
      }, { status: 500 })
    }

    // Mapear campos de la base de datos al formato del frontend
    const mappedUser: any = {}

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

    return NextResponse.json({ user: mappedUser })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
