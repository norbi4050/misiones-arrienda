import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  console.log('=== DEBUG CREDENTIALS - ANÁLISIS DE PERMISOS ===')
  
  try {
    // 1) Capturar información del request
    const body = await request.json()
    
    console.log('📋 REQUEST HEADERS:', {
      'user-agent': request.headers.get('user-agent'),
      'authorization': request.headers.get('authorization') ? 'Bearer [PRESENTE]' : 'NO PRESENTE',
      'cookie': request.headers.get('cookie') ? 'COOKIES PRESENTES' : 'NO COOKIES',
      'content-type': request.headers.get('content-type'),
      'origin': request.headers.get('origin'),
      'referer': request.headers.get('referer')
    })

    // 2) Verificar autenticación
    const { getAuthenticatedUser } = await import('@/lib/auth-middleware')
    const authenticatedUser = await getAuthenticatedUser(request)
    
    console.log('👤 USUARIO AUTENTICADO:', authenticatedUser ? {
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      email: authenticatedUser.email
    } : 'NO AUTENTICADO')

    // 3) Probar con Service Role Key
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

    console.log('🔑 PROBANDO CON SERVICE ROLE KEY...')

    // 4) Intentar inserción de prueba
    const testData = {
      title: 'TEST - Debug Credentials',
      description: 'Prueba de permisos',
      price: 100000,
      currency: 'ARS',
      bedrooms: 2,
      bathrooms: 1,
      garages: 0,
      area: 80,
      property_type: 'HOUSE',
      address: 'Test Address 123',
      city: 'Posadas',
      province: 'Misiones',
      postal_code: '3300',
      user_id: authenticatedUser?.id || 'test-user-id',
      status: 'AVAILABLE',
      is_active: true,
      is_paid: false,
      featured: false,
      images: JSON.stringify(['/test.jpg']),
      amenities: JSON.stringify(['Test']),
      features: JSON.stringify(['Test']),
      contact_name: 'Test User',
      contact_phone: '+54 376 123456',
      operation_type: 'rent'
    }

    console.log('📝 DATOS DE PRUEBA:', {
      title: testData.title,
      user_id: testData.user_id,
      city: testData.city
    })

    // 5) Intentar inserción y capturar error detallado
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .insert(testData)
      .select('id, title')
      .single()

    if (propertyError) {
      console.error('❌ ERROR DETALLADO DE SUPABASE:', {
        message: propertyError.message,
        code: propertyError.code,
        details: propertyError.details,
        hint: propertyError.hint,
        name: propertyError.name
      })

      // 6) Analizar tipo de error específico
      let errorAnalysis = 'Error desconocido'
      
      if (propertyError.message.includes('permission denied')) {
        errorAnalysis = 'PERMISSION DENIED - Falta de permisos en tabla properties'
      } else if (propertyError.code === '23503') {
        errorAnalysis = 'FOREIGN KEY CONSTRAINT - Referencia inválida'
      } else if (propertyError.code === '23505') {
        errorAnalysis = 'UNIQUE CONSTRAINT - Datos duplicados'
      } else if (propertyError.code === '42703') {
        errorAnalysis = 'COLUMN NOT FOUND - Columna inexistente'
      }

      console.log('🔍 ANÁLISIS DEL ERROR:', errorAnalysis)

      return NextResponse.json({
        success: false,
        endpoint: '/api/debug-credentials (route handler)',
        user: authenticatedUser ? 'AUTENTICADO' : 'NO AUTENTICADO',
        credentials: 'SERVICE_ROLE_KEY',
        error: {
          message: propertyError.message,
          code: propertyError.code,
          analysis: errorAnalysis
        },
        supabase_client_info: 'supabase-js-node (Service Role)',
        request_info: {
          user_agent: request.headers.get('user-agent'),
          origin: request.headers.get('origin')
        }
      }, { status: 403 })
    }

    console.log('✅ INSERCIÓN EXITOSA:', property.id)

    return NextResponse.json({
      success: true,
      endpoint: '/api/debug-credentials (route handler)',
      user: authenticatedUser ? 'AUTENTICADO' : 'NO AUTENTICADO',
      credentials: 'SERVICE_ROLE_KEY',
      property: {
        id: property.id,
        title: property.title
      },
      supabase_client_info: 'supabase-js-node (Service Role)',
      message: 'Inserción exitosa con Service Role Key'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ ERROR EN DEBUG CREDENTIALS:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })

    return NextResponse.json({
      success: false,
      endpoint: '/api/debug-credentials (route handler)',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de debugging para analizar credenciales y permisos',
    usage: 'POST /api/debug-credentials con datos de prueba',
    purpose: 'Identificar por qué aparece permission denied for table properties'
  })
}
