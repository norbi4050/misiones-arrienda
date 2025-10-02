import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Verificar si la tabla existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'analytics_events');

    // 2. Obtener columnas de la tabla
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'analytics_events')
      .order('ordinal_position');

    // 3. Verificar RLS
    const { data: rlsData, error: rlsError } = await supabase.rpc('pg_catalog.pg_class', {
      relname: 'analytics_events'
    }).select('relrowsecurity');

    // 4. Obtener políticas RLS
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'analytics_events');

    // 5. Obtener vistas KPI
    const { data: views, error: viewsError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'kpi_%')
      .order('table_name');

    // 6. Intentar query directo para ver estructura real
    const { data: sampleData, error: sampleError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      diagnostics: {
        tableExists: {
          data: tables,
          error: tablesError,
          exists: tables && tables.length > 0
        },
        columns: {
          data: columns,
          error: columnsError,
          count: columns?.length || 0,
          columnNames: columns?.map(c => c.column_name) || []
        },
        rls: {
          data: rlsData,
          error: rlsError
        },
        policies: {
          data: policies,
          error: policiesError,
          count: policies?.length || 0
        },
        views: {
          data: views,
          error: viewsError,
          count: views?.length || 0,
          viewNames: views?.map(v => v.table_name) || []
        },
        sampleQuery: {
          data: sampleData,
          error: sampleError,
          errorDetails: sampleError ? {
            message: sampleError.message,
            code: sampleError.code,
            details: sampleError.details,
            hint: sampleError.hint
          } : null
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
