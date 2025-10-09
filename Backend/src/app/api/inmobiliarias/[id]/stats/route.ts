import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * API: Estadísticas Reales de Inmobiliaria
 * 
 * GET /api/inmobiliarias/[id]/stats
 * 
 * Calcula estadísticas en tiempo real desde la base de datos:
 * - Total de propiedades
 * - Propiedades activas
 * - Precio promedio
 * - Propiedades publicadas este mes
 * 
 * Uso: Perfil público de inmobiliarias
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('[Stats API] 📊 Request received for agency ID:', id);

    if (!id) {
      console.warn('[Stats API] ⚠️ No ID provided');
      return NextResponse.json(
        { error: 'ID de inmobiliaria requerido' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verificar que el usuario existe y es una inmobiliaria
    const { data: agency, error: agencyError } = await supabase
      .from('users')
      .select('id, company_name, user_type')
      .eq('id', id)
      .eq('user_type', 'inmobiliaria')
      .single();

    if (agencyError) {
      console.error('[Stats API] ❌ Error fetching agency:', agencyError);
      return NextResponse.json(
        { 
          error: 'Error al buscar inmobiliaria',
          details: agencyError.message,
          code: agencyError.code
        },
        { status: 500 }
      );
    }

    if (!agency) {
      console.warn('[Stats API] ⚠️ Agency not found for ID:', id);
      return NextResponse.json(
        { error: 'Inmobiliaria no encontrada' },
        { status: 404 }
      );
    }

    console.log('[Stats API] ✅ Agency found:', agency.company_name);

    // Calcular estadísticas en tiempo real
    
    // 1. Total de propiedades
    const { count: totalProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    // 2. Propiedades activas
    const { count: activeProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('is_active', true);

    // 3. Precio promedio (solo propiedades activas)
    const { data: priceData } = await supabase
      .from('properties')
      .select('price')
      .eq('user_id', id)
      .eq('is_active', true)
      .not('price', 'is', null);

    const averagePrice = priceData && priceData.length > 0
      ? Math.round(priceData.reduce((sum, p) => sum + (p.price || 0), 0) / priceData.length)
      : 0;

    // 4. Propiedades publicadas este mes
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: propertiesThisMonth } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .gte('created_at', firstDayOfMonth.toISOString());

    // Construir respuesta
    const stats = {
      total_properties: totalProperties || 0,
      active_properties: activeProperties || 0,
      average_price: averagePrice,
      properties_this_month: propertiesThisMonth || 0,
    };

    console.log('[Stats API] ✅ Stats calculated successfully:', stats);

    return NextResponse.json({
      success: true,
      stats,
      agency: {
        id: agency.id,
        company_name: agency.company_name,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Stats API] ❌ Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Error al calcular estadísticas',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
