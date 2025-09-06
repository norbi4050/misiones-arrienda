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

// Función para crear usuario en tabla users si no existe
async function ensureUserExists(supabase: any, userId: string, userEmail?: string) {
  try {
    // Verificar si el usuario existe en la tabla users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      // Usuario no existe, crearlo
      console.log('Usuario no existe en tabla users, creando...');
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail || 'unknown@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creando usuario:', createError);
        return { success: false, error: createError };
      }

      console.log('Usuario creado exitosamente:', newUser);
      return { success: true, user: newUser };
    } else if (checkError) {
      console.error('Error verificando usuario:', checkError);
      return { success: false, error: checkError };
    }

    return { success: true, user: existingUser };
  } catch (error) {
    console.error('Error en ensureUserExists:', error);
    return { success: false, error };
  }
}

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

    // DEBUG: Log de cookies y headers para debugging
    console.log('🔍 DEBUG - Profile Update Request:');
    console.log('- Method:', request.method);
    console.log('- URL:', request.url);

    // Log headers safely for Next.js compatibility
    const headersObj: { [key: string]: string } = {};
    request.headers.forEach((value: string, key: string) => {
      headersObj[key] = value;
    });
    console.log('- Headers:', headersObj);

    // Verificar autenticación
    console.log('🔍 DEBUG - Verificando autenticación...');
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔍 DEBUG - Resultado autenticación:');
    console.log('- User:', user ? { id: user.id, email: user.email } : 'null');
    console.log('- Auth Error:', authError ? authError.message : 'null');

    if (authError || !user) {
      console.log('❌ DEBUG - Autenticación fallida, retornando 401');
      return NextResponse.json({
        error: 'No autorizado',
        debug: {
          authError: authError?.message,
          hasUser: !!user,
          userId: user?.id
        }
      }, { status: 401 })
    }

    console.log('✅ DEBUG - Autenticación exitosa para user:', user.id);

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

    // DEBUG: Log de cookies y headers para debugging
    console.log('🔍 DEBUG - Profile GET Request:');
    console.log('- Method:', request.method);
    console.log('- URL:', request.url);

    // Log headers safely for Next.js compatibility
    const headersObj: { [key: string]: string } = {};
    request.headers.forEach((value: string, key: string) => {
      headersObj[key] = value;
    });
    console.log('- Headers:', headersObj);

    // Verificar autenticación
    console.log('🔍 DEBUG - Verificando autenticación GET...');
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔍 DEBUG - Resultado autenticación GET:');
    console.log('- User:', user ? { id: user.id, email: user.email } : 'null');
    console.log('- Auth Error:', authError ? authError.message : 'null');

    if (authError || !user) {
      console.error('Auth error:', authError)
      console.log('❌ DEBUG - Autenticación GET fallida, retornando 401');
      return NextResponse.json({
        error: 'No autorizado',
        debug: {
          authError: authError?.message,
          hasUser: !!user,
          userId: user?.id
        }
      }, { status: 401 })
    }

    console.log('✅ DEBUG - Autenticación GET exitosa para user:', user.id);

    console.log('GET Profile request for user:', user.id)

    // Asegurar que el usuario existe en la tabla users
    const userExistsResult = await ensureUserExists(supabase, user.id, user.email)
    
    if (!userExistsResult.success) {
      console.error('Error ensuring user exists:', userExistsResult.error)
      return NextResponse.json({ 
        error: 'Error verificando usuario',
        details: userExistsResult.error?.message || 'Unknown error'
      }, { status: 500 })
    }

    // Obtener el perfil del usuario de la tabla users con campos específicos
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,phone,avatar,bio,occupation,age,user_type,company_name,license_number,property_count,full_name,location,search_type,budget_range,profile_image,preferred_areas,family_size,pet_friendly,move_in_date,employment_status,monthly_income,verified,email_verified,rating,review_count,created_at,updated_at')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      
      // Si es error 406, intentar con menos campos
      if (error.code === 'PGRST406') {
        console.log('Error 406 detectado, intentando con campos básicos...')
        
        const { data: basicData, error: basicError } = await supabase
          .from('users')
          .select('id,name,email,user_type,created_at')
          .eq('id', user.id)
          .single()

        if (basicError) {
          console.error('Error con campos básicos:', basicError)
          return NextResponse.json({ 
            error: 'Error al obtener el perfil',
            details: basicError.message,
            code: basicError.code
          }, { status: 500 })
        }

        return NextResponse.json({ user: basicData })
      }

      return NextResponse.json({ 
        error: 'Error al obtener el perfil',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    // Retornar los datos tal como están
    return NextResponse.json({ user: data })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
