import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  console.log('=== TESTING SERVICE ROLE KEY ===')
  
  try {
    // Verificar que las variables de entorno existan
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'Present' : 'Missing',
      serviceRoleKey: serviceRoleKey ? 'Present' : 'Missing',
      serviceRoleKeyLength: serviceRoleKey?.length || 0
    })
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          supabaseUrl: !!supabaseUrl,
          serviceRoleKey: !!serviceRoleKey
        }
      }, { status: 500 })
    }
    
    // Crear cliente admin con Service Role Key
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('Service Role client created')
    
    // Test 1: Verificar conexión básica
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('properties')
      .select('count')
      .limit(1)
    
    console.log('Connection test:', { data: connectionTest, error: connectionError?.message })
    
    // Test 2: Intentar insertar datos de prueba
    const testData = {
      title: 'Test Property Service Role',
      description: 'Testing Service Role permissions',
      price: 100000,
      currency: 'ARS',
      bedrooms: 2,
      bathrooms: 1,
      garages: 0,
      area: 80,
      address: 'Test Address 123',
      city: 'Posadas',
      province: 'Misiones',
      postal_code: '3300',
      property_type: 'HOUSE',
      status: 'AVAILABLE',
      images: JSON.stringify(['/test.jpg']),
      amenities: JSON.stringify(['Test']),
      features: JSON.stringify(['Test']),
      user_id: 'test-user-id',
      agent_id: null,
      is_active: true,
      operation_type: 'rent',
      featured: false,
      is_paid: false
    }
    
    console.log('Attempting test insert...')
    
    const { data: insertTest, error: insertError } = await supabaseAdmin
      .from('properties')
      .insert(testData)
      .select()
      .single()
    
    console.log('Insert test result:', { 
      success: !!insertTest, 
      propertyId: insertTest?.id,
      error: insertError?.message,
      errorCode: insertError?.code
    })
    
    // Si la inserción fue exitosa, limpiar el dato de prueba
    if (insertTest?.id) {
      console.log('Cleaning up test data...')
      const { error: deleteError } = await supabaseAdmin
        .from('properties')
        .delete()
        .eq('id', insertTest.id)
      
      console.log('Cleanup result:', { error: deleteError?.message })
    }
    
    // Test 3: Verificar políticas RLS
    const { data: rlsTest, error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql_query: "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'properties';"
      })
    
    console.log('RLS test:', { data: rlsTest, error: rlsError?.message })
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        environment: {
          supabaseUrl: !!supabaseUrl,
          serviceRoleKey: !!serviceRoleKey,
          serviceRoleKeyLength: serviceRoleKey?.length
        },
        connection: {
          success: !connectionError,
          error: connectionError?.message
        },
        insert: {
          success: !!insertTest,
          propertyId: insertTest?.id,
          error: insertError?.message,
          errorCode: insertError?.code
        },
        rls: {
          success: !rlsError,
          data: rlsTest,
          error: rlsError?.message
        }
      },
      conclusion: insertTest ? 'Service Role Key funciona correctamente' : 'Service Role Key tiene problemas'
    })
    
  } catch (error) {
    console.error('Error testing Service Role:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno al probar Service Role',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
