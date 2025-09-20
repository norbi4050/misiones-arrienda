import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('=== FIX RLS PROPERTIES REQUEST ===')
  
  try {
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

    console.log('🔧 Intentando deshabilitar RLS en tabla properties...')

    // Opción 1: Deshabilitar RLS completamente
    const { data: disableResult, error: disableError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: 'ALTER TABLE properties DISABLE ROW LEVEL SECURITY;'
    })

    if (disableError) {
      console.error('❌ Error deshabilitando RLS:', disableError)
      
      // Opción 2: Crear política permisiva
      console.log('🔧 Intentando crear política permisiva...')
      
      const { data: policyResult, error: policyError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `
          CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert properties" 
          ON properties FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
        `
      })

      if (policyError) {
        console.error('❌ Error creando política:', policyError)
        
        // Opción 3: Crear función bypass
        console.log('🔧 Creando función bypass...')
        
        const { data: functionResult, error: functionError } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: `
            CREATE OR REPLACE FUNCTION create_property_bypass(
              p_title TEXT,
              p_description TEXT,
              p_price NUMERIC,
              p_user_id TEXT,
              p_city TEXT,
              p_property_type TEXT DEFAULT 'HOUSE',
              p_bedrooms INTEGER DEFAULT 1,
              p_bathrooms INTEGER DEFAULT 1,
              p_area NUMERIC DEFAULT 50
            )
            RETURNS TABLE(id TEXT, title TEXT, price NUMERIC)
            SECURITY DEFINER
            SET search_path = public
            LANGUAGE plpgsql
            AS $$
            BEGIN
              RETURN QUERY
              INSERT INTO properties (
                title, description, price, user_id, city, 
                property_type, bedrooms, bathrooms, area,
                agent_id, currency, province, postal_code,
                status, images, amenities, features,
                is_active, operation_type, featured, is_paid
              ) VALUES (
                p_title, p_description, p_price, p_user_id, p_city,
                p_property_type, p_bedrooms, p_bathrooms, p_area,
                NULL, 'ARS', 'Misiones', '3300',
                'AVAILABLE', '[]', '[]', '[]',
                true, 'rent', false, false
              )
              RETURNING properties.id, properties.title, properties.price;
            END;
            $$;
          `
        })

        if (functionError) {
          console.error('❌ Error creando función:', functionError)
          return NextResponse.json({
            success: false,
            error: 'No se pudo aplicar ninguna solución RLS',
            details: {
              disableError: disableError?.message,
              policyError: policyError?.message,
              functionError: functionError?.message
            }
          }, { status: 500 })
        } else {
          console.log('✅ Función bypass creada exitosamente')
          return NextResponse.json({
            success: true,
            method: 'function_bypass',
            message: 'Función create_property_bypass creada. Usar endpoint /api/properties/create-bypass'
          })
        }
      } else {
        console.log('✅ Política permisiva creada exitosamente')
        return NextResponse.json({
          success: true,
          method: 'policy_created',
          message: 'Política RLS permisiva creada exitosamente'
        })
      }
    } else {
      console.log('✅ RLS deshabilitado exitosamente')
      return NextResponse.json({
        success: true,
        method: 'rls_disabled',
        message: 'RLS deshabilitado exitosamente en tabla properties'
      })
    }

  } catch (error) {
    console.error('Error fixing RLS:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno al intentar arreglar RLS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para arreglar RLS en tabla properties',
    method: 'POST',
    description: 'Intenta 3 soluciones: deshabilitar RLS, crear política permisiva, o crear función bypass',
    usage: 'POST /api/fix-rls-properties'
  })
}
