// src/app/api/debug-user-type-detection/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Verificar estructura de tabla users
    console.log('🔍 Verificando estructura de tabla users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, user_type, is_company, company_name, license_number')
      .limit(5);

    // 2. Verificar estructura de tabla user_profiles
    console.log('🔍 Verificando estructura de tabla user_profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    // 3. Verificar si hay usuarios con is_company = true
    const { data: companiesData, error: companiesError } = await supabase
      .from('users')
      .select('id, name, email, user_type, is_company, company_name')
      .eq('is_company', true)
      .limit(10);

    // 4. Contar usuarios por tipo
    const { data: userTypeCounts, error: countError } = await supabase
      .from('users')
      .select('user_type, is_company')
      .not('user_type', 'is', null);

    // Agrupar conteos
    const typeCounts = userTypeCounts?.reduce((acc: any, user: any) => {
      const key = user.user_type || 'null';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const isCompanyCounts = userTypeCounts?.reduce((acc: any, user: any) => {
      const key = user.is_company ? 'true' : 'false';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics: {
        usersTable: {
          success: !usersError,
          error: usersError?.message,
          sampleData: usersData,
          recordCount: usersData?.length || 0
        },
        userProfilesTable: {
          success: !profilesError,
          error: profilesError?.message,
          sampleData: profilesData,
          recordCount: profilesData?.length || 0
        },
        companiesFound: {
          success: !companiesError,
          error: companiesError?.message,
          companies: companiesData,
          count: companiesData?.length || 0
        },
        statistics: {
          success: !countError,
          error: countError?.message,
          userTypeCounts: typeCounts,
          isCompanyCounts: isCompanyCounts,
          totalUsers: userTypeCounts?.length || 0
        }
      },
      analysis: {
        hasIsCompanyColumn: !usersError && usersData !== null,
        hasCompanies: (companiesData?.length || 0) > 0,
        tablesAccessible: {
          users: !usersError,
          user_profiles: !profilesError
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
