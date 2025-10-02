// =====================================================
// B5 - OG IMAGE AGENCY
// Genera Open Graph image dinámica para inmobiliarias
// Versión simplificada - retorna JSON con datos para OG
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Genera datos OG para una inmobiliaria
 * GET /api/og/agency?id={agencyId}
 * 
 * Nota: En producción, esto debería generar una imagen con ImageResponse
 * Por ahora retorna JSON con los datos para debugging
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('id');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Missing agency ID' },
        { status: 400 }
      );
    }

    // Obtener datos de la inmobiliaria
    const supabase = createServerSupabase();
    const { data: agency, error } = await supabase
      .from('inmobiliarias')
      .select('id, company_name, city, province, verified, description')
      .eq('id', agencyId)
      .single();

    if (error || !agency) {
      return NextResponse.json(
        { 
          error: 'Agency not found',
          fallback: true,
          imageUrl: '/placeholder-agency.png'
        },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    // Contar propiedades activas
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('inmobiliaria_id', agencyId)
      .in('status', ['AVAILABLE', 'PUBLISHED']);

    // Retornar datos OG
    return NextResponse.json(
      {
        id: agency.id,
        title: agency.company_name,
        description: agency.description || `Inmobiliaria en ${agency.city}, ${agency.province}`,
        location: `${agency.city}, ${agency.province}`,
        verified: agency.verified,
        propertiesCount: propertiesCount || 0,
        imageUrl: `/api/og/agency/image?id=${agencyId}`, // Endpoint futuro para imagen real
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[OG Agency] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        fallback: true 
      },
      { status: 500 }
    );
  }
}
