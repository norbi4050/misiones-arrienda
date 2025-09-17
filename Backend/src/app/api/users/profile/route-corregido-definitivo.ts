import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

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

// Función para validar y sanitizar datos
function validateAndSanitizeData(data: any): { isValid: boolean; sanitizedData: any; errors: string[] } {
  const errors: string[] = []
  const sanitizedData: any = {}

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue // Omitir campos null/undefined
    }

    // Sanitizar strings
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.length === 0) {
        continue // Omitir strings vacíos
      }
      sanitizedData[key] = trimmed
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      sanitizedData[key] = value
    } else {
      errors.push(`Campo ${key} tiene tipo de dato inválido`)
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedData,
    errors
  }
}

async function handleProfileUpdate(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()

    // Log detallado de la solicitud
    )
    .length, 'bytes')

    // Validar y sanitizar datos
    const { isValid, sanitizedData, errors } = validateAndSanitizeData(body)

    if (!isValid) {
      console.error('Validation errors:', errors)
      return NextResponse.json({
        error: 'Datos inválidos',
        details: errors
      }, { status: 400 })
    }

    // Mapear campos del frontend al formato de la base de datos
    const mappedData: any = {}

    Object.keys(sanitizedData).forEach(key => {
      if (fieldMapping[key as keyof typeof fieldMapping]) {
        const dbField = fieldMapping[key as keyof typeof fieldMapping]
        mappedData[dbField] = sanitizedData[key]
      } else {
        }
    })

    // Solo proceder si hay datos para actualizar
    if (Object.keys(mappedData).length === 0) {
      return NextResponse.json({
        message: 'No hay datos para actualizar',
        user: null
      })
    }

    // Agregar timestamp de actualización
    mappedData.updated_at = new Date().toISOString()

    )
    // CORRECCIÓN CRÍTICA: Usar select("*") en lugar de select()
    // Esto evita el error 400 de PostgREST
    const { data, error } = await supabase
      .from('users')
      .update(mappedData)
      .eq('id', user.id)
      .select("*")  // ✅ CORRECCIÓN: select("*") en lugar de select()
      .single()

    if (error) {
      console.error('=== SUPABASE ERROR ===')
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)

      // Manejo específico de errores de PostgREST
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'No se encontró el usuario para actualizar',
          details: 'El usuario no existe o no tienes permisos para actualizarlo'
        }, { status: 404 })
      }

      if (error.code === '42P01') {
        return NextResponse.json({
          error: 'Error de esquema de base de datos',
          details: 'La tabla users no existe o no es accesible'
        }, { status: 500 })
      }

      return NextResponse.json({
        error: 'Error al actualizar el perfil',
        details: error.message,
        code: error.code
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
    console.error('=== UNEXPECTED ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
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
    const supabase = createServerSupabase()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in GET:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // CORRECCIÓN CRÍTICA: Usar select("*") en lugar de select()
    const { data, error } = await supabase
      .from('users')
      .select("*")  // ✅ CORRECCIÓN: select("*") en lugar de select()
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('=== SUPABASE GET ERROR ===')
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)

      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Usuario no encontrado',
          details: 'El perfil del usuario no existe'
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

    )

    return NextResponse.json({ user: mappedUser })

  } catch (error) {
    console.error('=== UNEXPECTED GET ERROR ===')
    console.error('Error:', error)

    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
