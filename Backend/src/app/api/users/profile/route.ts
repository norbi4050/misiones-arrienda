import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Campos válidos del modelo users según el esquema real de Supabase (snake_case)
const validUserFields = [
  'name',
  'email', 
  'phone',
  'avatar',
  'bio',
  'occupation',
  'age',
  'user_type',
  'company_name',
  'license_number',
  'property_count',
  'full_name',
  'location',
  'search_type',
  'budget_range',
  'profile_image',
  'preferred_areas',
  'family_size',
  'pet_friendly',
  'move_in_date',
  'employment_status',
  'monthly_income'
]

// Campos que deben ser INTEGER en la base de datos
const integerFields = ['age', 'family_size', 'review_count']

// Campos que deben ser NUMERIC en la base de datos
const numericFields = ['monthly_income', 'rating']

// Campos que deben ser BOOLEAN en la base de datos
const booleanFields = ['pet_friendly', 'verified', 'email_verified']

// Campos que deben ser DATE en la base de datos
const dateFields = ['move_in_date']

// Función para validar y convertir tipos de datos
function validateAndConvertData(data: any): any {
  const convertedData: any = {}
  
  Object.keys(data).forEach(key => {
    // Solo procesar campos válidos
    if (!validUserFields.includes(key)) {
      console.warn(`Campo no válido ignorado: ${key}`)
      return
    }
    
    const value = data[key]
    
    // Campos INTEGER
    if (integerFields.includes(key)) {
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else if (typeof value === 'string') {
        const numValue = parseInt(value, 10)
        convertedData[key] = isNaN(numValue) ? null : numValue
      } else if (typeof value === 'number') {
        convertedData[key] = value
      } else {
        convertedData[key] = null
      }
    }
    // Campos NUMERIC
    else if (numericFields.includes(key)) {
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else if (typeof value === 'string') {
        const numValue = parseFloat(value)
        convertedData[key] = isNaN(numValue) ? null : numValue
      } else if (typeof value === 'number') {
        convertedData[key] = value
      } else {
        convertedData[key] = null
      }
    }
    // Campos BOOLEAN
    else if (booleanFields.includes(key)) {
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else if (typeof value === 'boolean') {
        convertedData[key] = value
      } else if (typeof value === 'string') {
        convertedData[key] = value.toLowerCase() === 'true'
      } else {
        convertedData[key] = Boolean(value)
      }
    }
    // Campos DATE
    else if (dateFields.includes(key)) {
      if (value === '' || value === null || value === undefined) {
        convertedData[key] = null
      } else if (typeof value === 'string') {
        // Validar formato de fecha
        const dateValue = new Date(value)
        convertedData[key] = isNaN(dateValue.getTime()) ? null : value
      } else {
        convertedData[key] = value
      }
    }
    // Campos TEXT (string)
    else {
      // Para campos de texto, mantener el valor original (pero no vacío)
      if (value !== '' && value !== null && value !== undefined) {
        convertedData[key] = String(value)
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
    console.log('Profile update request:', {
      method: request.method,
      path: request.url,
      userId: user.id,
      bodyKeys: Object.keys(body),
      bodyData: body
    })

    // Validar y convertir tipos de datos usando los campos reales del modelo User
    const validatedData = validateAndConvertData(body)

    // Solo proceder si hay datos válidos para actualizar
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json({ 
        error: 'No se proporcionaron campos válidos para actualizar',
        validFields: validUserFields
      }, { status: 400 })
    }

    // Agregar timestamp de actualización
    validatedData.updated_at = new Date().toISOString()

    console.log('Validated data for database:', {
      keys: Object.keys(validatedData),
      data: validatedData
    })

    // Actualizar el perfil del usuario en la tabla users (minúscula)
    // CORRECCIÓN: Especificar campos en select() para evitar error 406
    const { data, error } = await supabase
      .from('users')
      .update(validatedData)
      .eq('id', user.id)
      .select('id,name,email,phone,avatar,bio,occupation,age,user_type,company_name,license_number,property_count,full_name,location,search_type,budget_range,profile_image,preferred_areas,family_size,pet_friendly,move_in_date,employment_status,monthly_income,verified,email_verified,rating,review_count,created_at,updated_at')
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ 
        error: 'Error al actualizar el perfil: ' + error.message,
        details: error.details || 'No additional details',
        hint: error.hint || 'No hint available',
        code: error.code || 'No error code'
      }, { status: 500 })
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

    // Obtener el perfil del usuario de la tabla users (minúscula)
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

    // Retornar los datos tal como están (ya están en el formato correcto)
    return NextResponse.json({ user: data })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
