import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * DEBUG ENDPOINT: Diagnóstico del error 404 en /inmobiliaria/[id]
 * 
 * Este endpoint investiga:
 * 1. Qué campos existen en la tabla users para identificar inmobiliarias
 * 2. Qué valores tienen esos campos
 * 3. Cuál es el campo correcto para filtrar inmobiliarias
 * 
 * Uso: GET /api/debug-inmobiliaria-404
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
        },
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener schema de la tabla users
    console.log('🔍 Investigando schema de tabla users...');
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (schemaError) {
      return NextResponse.json({
        error: 'Error fetching schema',
        details: schemaError,
      }, { status: 500 });
    }

    const availableFields = schemaData && schemaData.length > 0 
      ? Object.keys(schemaData[0]) 
      : [];

    // 2. Buscar usuarios que podrían ser inmobiliarias
    console.log('🔍 Buscando usuarios tipo inmobiliaria...');

    // Intentar con diferentes campos posibles
    const queries = [
      { field: 'role', value: 'inmobiliaria' },
      { field: 'role', value: 'INMOBILIARIA' },
      { field: 'user_type', value: 'inmobiliaria' },
      { field: 'user_type', value: 'INMOBILIARIA' },
      { field: 'userType', value: 'inmobiliaria' },
      { field: 'userType', value: 'INMOBILIARIA' },
      { field: 'type', value: 'inmobiliaria' },
      { field: 'type', value: 'INMOBILIARIA' },
      { field: 'is_company', value: true },
    ];

    const results: any = {};

    for (const query of queries) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, company_name, created_at')
        .eq(query.field, query.value)
        .limit(5);

      results[`${query.field}=${query.value}`] = {
        found: !error && data && data.length > 0,
        count: data?.length || 0,
        sample: data?.[0] || null,
        error: error?.message || null,
      };
    }

    // 3. Buscar usuarios con company_name (probable indicador de inmobiliaria)
    const { data: companiesData, error: companiesError } = await supabase
      .from('users')
      .select('id, email, company_name, role, user_type, user_type, type, is_company, created_at')
      .not('company_name', 'is', null)
      .limit(10);

    // 4. Obtener un usuario específico si existe
    let sampleUser = null;
    if (companiesData && companiesData.length > 0) {
      const userId = companiesData[0].id;
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      sampleUser = userData;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnosis: {
        availableFields,
        queryResults: results,
        usersWithCompanyName: {
          count: companiesData?.length || 0,
          samples: companiesData || [],
        },
        sampleUserComplete: sampleUser,
        recommendation: generateRecommendation(results, availableFields),
      },
    });

  } catch (error: any) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

function generateRecommendation(results: any, fields: string[]): string {
  // Encontrar qué query funcionó
  for (const [query, result] of Object.entries(results)) {
    if ((result as any).found && (result as any).count > 0) {
      return `✅ ENCONTRADO: Usar filtro "${query}" en las queries. Este campo existe y tiene datos.`;
    }
  }

  // Si ninguno funcionó, sugerir basado en campos disponibles
  const possibleFields = ['role', 'user_type', 'userType', 'type', 'is_company'];
  const existingFields = possibleFields.filter(f => fields.includes(f));

  if (existingFields.length > 0) {
    return `⚠️ Campos disponibles: ${existingFields.join(', ')}. Verificar valores correctos en la base de datos.`;
  }

  return `❌ No se encontró ningún campo estándar para identificar inmobiliarias. Revisar schema de la tabla users.`;
}
