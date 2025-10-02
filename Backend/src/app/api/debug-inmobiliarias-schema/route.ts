import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET() {
  try {
    const diagnostico: any = {
      timestamp: new Date().toISOString(),
      checks: {} as any,
      summary: {} as any,
      recommendations: [] as any[]
    }

    // 1. Verificar campos en tabla users
    console.log('[DEBUG] Verificando campos en tabla users...')
    
    // Usar query directo a information_schema
    const { data: columnsData, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')

    if (columnsError) {
      console.error('[DEBUG] Error consultando columnas:', columnsError)
    }

    diagnostico.checks.usersTable = {
      exists: !columnsError,
      columns: columnsData || [],
      requiredFields: {
        logo_url: columnsData?.some((c: any) => c.column_name === 'logo_url') || false,
        cuit: columnsData?.some((c: any) => c.column_name === 'cuit') || false,
        verified_at: columnsData?.some((c: any) => c.column_name === 'verified_at') || false,
        address: columnsData?.some((c: any) => c.column_name === 'address') || false,
        website: columnsData?.some((c: any) => c.column_name === 'website') || false,
        facebook: columnsData?.some((c: any) => c.column_name === 'facebook') || false,
        instagram: columnsData?.some((c: any) => c.column_name === 'instagram') || false,
        tiktok: columnsData?.some((c: any) => c.column_name === 'tiktok') || false,
        description: columnsData?.some((c: any) => c.column_name === 'description') || false,
        company_name: columnsData?.some((c: any) => c.column_name === 'company_name') || false,
        is_verified: columnsData?.some((c: any) => c.column_name === 'is_verified') || false,
        user_type: columnsData?.some((c: any) => c.column_name === 'user_type') || false,
      }
    }

    // 2. Verificar bucket company-logos
    console.log('[DEBUG] Verificando bucket company-logos...')
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()

    diagnostico.checks.companyLogosBucket = {
      exists: buckets?.some(b => b.id === 'company-logos') || false,
      allBuckets: buckets?.map(b => b.id) || [],
      error: bucketsError?.message
    }

    // 3. Si existe el bucket, verificar políticas
    if (diagnostico.checks.companyLogosBucket.exists) {
      console.log('[DEBUG] Verificando políticas del bucket...')
      
      // Intentar listar archivos (esto fallará si no hay políticas correctas)
      const { data: testList, error: testListError } = await supabase
        .storage
        .from('company-logos')
        .list('', { limit: 1 })

      diagnostico.checks.companyLogosBucket.policies = {
        canList: !testListError,
        listError: testListError?.message
      }
    }

    // 4. Verificar si hay inmobiliarias registradas
    console.log('[DEBUG] Verificando inmobiliarias registradas...')
    const { data: inmobiliarias, error: inmobiliariasError } = await supabase
      .from('users')
      .select('id, email, company_name, user_type, is_verified, logo_url, cuit')
      .eq('user_type', 'inmobiliaria')
      .limit(5)

    diagnostico.checks.inmobiliarias = {
      count: inmobiliarias?.length || 0,
      samples: inmobiliarias || [],
      error: inmobiliariasError?.message
    }

    // 5. Verificar tabla user_profiles (para comparar)
    console.log('[DEBUG] Verificando tabla user_profiles...')
    const { data: userProfilesColumns, error: userProfilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public')

    diagnostico.checks.userProfilesTable = {
      exists: !userProfilesError,
      columns: userProfilesColumns || [],
      error: userProfilesError?.message
    }

    // 6. Resumen de acciones requeridas
    const camposFaltantes = []
    const requiredFields = diagnostico.checks.usersTable?.requiredFields || {}
    
    if (!requiredFields.logo_url) camposFaltantes.push('logo_url')
    if (!requiredFields.cuit) camposFaltantes.push('cuit')
    if (!requiredFields.verified_at) camposFaltantes.push('verified_at')
    if (!requiredFields.address) camposFaltantes.push('address')
    if (!requiredFields.website) camposFaltantes.push('website')
    if (!requiredFields.facebook) camposFaltantes.push('facebook')
    if (!requiredFields.instagram) camposFaltantes.push('instagram')
    if (!requiredFields.tiktok) camposFaltantes.push('tiktok')
    if (!requiredFields.description) camposFaltantes.push('description')

    diagnostico.summary = {
      bucketExists: diagnostico.checks.companyLogosBucket.exists,
      missingFields: camposFaltantes,
      needsBucketCreation: !diagnostico.checks.companyLogosBucket.exists,
      needsFieldsMigration: camposFaltantes.length > 0,
      inmobiliariasCount: diagnostico.checks.inmobiliarias.count,
      readyForImplementation: diagnostico.checks.companyLogosBucket.exists && camposFaltantes.length === 0
    }

    diagnostico.recommendations = []

    if (!diagnostico.checks.companyLogosBucket.exists) {
      diagnostico.recommendations.push({
        priority: 'CRITICAL',
        action: 'Ejecutar script SQL: sql-audit/CREATE-COMPANY-LOGOS-BUCKET.sql',
        reason: 'El bucket company-logos no existe'
      })
    }

    if (camposFaltantes.length > 0) {
      diagnostico.recommendations.push({
        priority: 'HIGH',
        action: `Agregar campos faltantes a tabla users: ${camposFaltantes.join(', ')}`,
        reason: 'Campos requeridos para inmobiliarias no existen',
        sqlScript: 'Crear script de migración'
      })
    }

    if (diagnostico.checks.inmobiliarias.count === 0) {
      diagnostico.recommendations.push({
        priority: 'INFO',
        action: 'No hay inmobiliarias registradas aún',
        reason: 'Sistema listo para primeros registros'
      })
    }

    return NextResponse.json(diagnostico, { status: 200 })

  } catch (error: any) {
    console.error('[DEBUG] Error en diagnóstico:', error)
    return NextResponse.json({
      error: 'Error ejecutando diagnóstico',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
