import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`=== AUDIT DRAFT SUPPORT [${requestId}] ===`)

  try {
    // Crear cliente admin con Service Role
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log(`[${requestId}] Auditando soporte para DRAFT...`)

    // 1. Intentar crear una propiedad con status DRAFT directamente
    const testProperty = {
      title: 'TEST DRAFT PROPERTY',
      description: 'Testing DRAFT status support',
      price: 100000,
      currency: 'ARS',
      city: 'Posadas',
      province: 'Misiones',
      property_type: 'HOUSE',
      bedrooms: 2,
      bathrooms: 1,
      area: 100,
      address: 'Test Address 123',
      status: 'DRAFT', // ← TESTING DRAFT
      is_active: false,
      user_id: 'test-user-id',
      agent_id: null,
      images: JSON.stringify([]),
      amenities: JSON.stringify([]),
      features: JSON.stringify([])
    }

    console.log(`[${requestId}] Intentando crear propiedad DRAFT...`)

    const { data: draftProperty, error: draftError } = await supabase
      .from('properties')
      .insert(testProperty)
      .select('id, status')
      .single()

    console.log(`[${requestId}] DRAFT creation result:`, { draftProperty, draftError })

    // 2. Si se creó exitosamente, intentar cambiar a AVAILABLE
    let publishResult = null
    if (draftProperty && !draftError) {
      console.log(`[${requestId}] Intentando publicar DRAFT...`)
      
      const { data: publishedProperty, error: publishError } = await supabase
        .from('properties')
        .update({ status: 'AVAILABLE', is_active: true })
        .eq('id', draftProperty.id)
        .select('id, status, is_active')
        .single()

      publishResult = { publishedProperty, publishError }
      console.log(`[${requestId}] Publish result:`, publishResult)

      // 3. Limpiar - eliminar propiedad de prueba
      await supabase
        .from('properties')
        .delete()
        .eq('id', draftProperty.id)
      
      console.log(`[${requestId}] Test property cleaned up`)
    }

    // 4. Verificar schema de la tabla properties
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'properties')
      .eq('column_name', 'status')

    console.log(`[${requestId}] Schema result:`, { schemaData, schemaError })

    return NextResponse.json({
      requestId,
      audit: {
        draftCreation: {
          success: !draftError && !!draftProperty,
          data: draftProperty,
          error: draftError?.message || null,
          errorCode: draftError?.code || null
        },
        draftToAvailable: publishResult ? {
          success: !publishResult.publishError && !!publishResult.publishedProperty,
          data: publishResult.publishedProperty,
          error: publishResult.publishError?.message || null
        } : null,
        schema: {
          data: schemaData,
          error: schemaError?.message || null
        }
      },
      summary: {
        draftSupported: !draftError && !!draftProperty,
        canPublishDraft: publishResult?.publishedProperty && !publishResult?.publishError,
        recommendedAction: !draftError ? 'SAFE_TO_PROCEED' : 'NEEDS_SCHEMA_UPDATE',
        errorDetails: draftError ? {
          message: draftError.message,
          code: draftError.code,
          hint: draftError.hint
        } : null
      }
    })

  } catch (error) {
    console.error(`[${requestId}] Error in audit:`, error)
    
    return NextResponse.json({
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      audit: null,
      summary: {
        draftSupported: false,
        canPublishDraft: false,
        recommendedAction: 'INVESTIGATION_FAILED'
      }
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
