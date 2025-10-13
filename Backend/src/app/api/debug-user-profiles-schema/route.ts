// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/debug-user-profiles-schema
 * Diagnostica el schema real de user_profiles en Supabase
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'No autenticado',
        authError: authError?.message
      }, { status: 401 });
    }

    // 2. Intentar query directo a user_profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    // 3. Intentar con UserProfile (Prisma naming)
    const { data: profilesPrisma, error: profilesPrismaError } = await supabase
      .from('UserProfile')
      .select('*')
      .limit(1);

    // 4. Obtener información del schema usando SQL directo
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'user_profiles' })
      .single();

    return NextResponse.json({
      userId: user.id,
      queries: {
        user_profiles: {
          success: !profilesError,
          error: profilesError?.message,
          data: profiles?.[0] || null,
          columns: profiles?.[0] ? Object.keys(profiles[0]) : []
        },
        UserProfile: {
          success: !profilesPrismaError,
          error: profilesPrismaError?.message,
          data: profilesPrisma?.[0] || null,
          columns: profilesPrisma?.[0] ? Object.keys(profilesPrisma[0]) : []
        },
        schemaInfo: {
          success: !schemaError,
          error: schemaError?.message,
          data: schemaInfo
        }
      },
      diagnosis: {
        hasUserIdColumn: profiles?.[0] ? 'userId' in profiles[0] : false,
        hasUser_idColumn: profiles?.[0] ? 'user_id' in profiles[0] : false,
        actualColumns: profiles?.[0] ? Object.keys(profiles[0]) : []
      }
    });

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      error: 'Error inesperado',
      message: error?.message,
      stack: error?.stack
    }, { status: 500 });
  }
}
