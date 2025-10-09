// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DEBUG: Diagnosticar por qué las propiedades del perfil de inmobiliaria
 * no redirigen correctamente al detalle
 * 
 * GET /api/debug-inmobiliaria-properties-detail?inmobiliariaId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inmobiliariaId = searchParams.get('inmobiliariaId');

    if (!inmobiliariaId) {
      return NextResponse.json(
        { error: 'Falta parámetro inmobiliariaId' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Verificar inmobiliaria
    const { data: inmobiliaria, error: inmoError } = await supabase
      .from('users')
      .select('id, company_name, user_type')
      .eq('id', inmobiliariaId)
      .single();

    if (inmoError || !inmobiliaria) {
      return NextResponse.json({
        error: 'Inmobiliaria no encontrada',
        details: inmoError,
      }, { status: 404 });
    }

    // 2. Obtener TODAS las propiedades de esta inmobiliaria (sin filtros)
    const { data: allProperties, error: allError } = await supabase
      .from('properties')
      .select('id, title, status, is_active, created_at, user_id')
      .eq('user_id', inmobiliariaId)
      .order('created_at', { ascending: false });

    if (allError) {
      return NextResponse.json({
        error: 'Error obteniendo propiedades',
        details: allError,
      }, { status: 500 });
    }

    // 3. Obtener solo las activas (como en el perfil público)
    const { data: activeProperties, error: activeError } = await supabase
      .from('properties')
      .select('id, title, status, is_active, created_at')
      .eq('user_id', inmobiliariaId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (activeError) {
      return NextResponse.json({
        error: 'Error obteniendo propiedades activas',
        details: activeError,
      }, { status: 500 });
    }

    // 4. Probar acceso individual a cada propiedad activa
    const accessTests = await Promise.all(
      (activeProperties || []).map(async (prop) => {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', prop.id)
          .single();

        return {
          id: prop.id,
          title: prop.title,
          status: prop.status,
          is_active: prop.is_active,
          canAccess: !error,
          error: error ? error.message : null,
          errorCode: error ? error.code : null,
        };
      })
    );

    // 5. Análisis de inconsistencias
    const analysis = {
      total_properties: allProperties?.length || 0,
      active_properties: activeProperties?.length || 0,
      inactive_properties: (allProperties?.length || 0) - (activeProperties?.length || 0),
      properties_by_status: {
        published: allProperties?.filter(p => p.status === 'PUBLISHED').length || 0,
        draft: allProperties?.filter(p => p.status === 'DRAFT').length || 0,
        archived: allProperties?.filter(p => p.status === 'ARCHIVED').length || 0,
        other: allProperties?.filter(p => !['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(p.status)).length || 0,
      },
      inconsistencies: {
        active_but_not_published: activeProperties?.filter(p => p.status !== 'PUBLISHED').length || 0,
        published_but_not_active: allProperties?.filter(p => p.status === 'PUBLISHED' && !p.is_active).length || 0,
      },
      access_issues: accessTests.filter(t => !t.canAccess).length,
    };

    return NextResponse.json({
      inmobiliaria: {
        id: inmobiliaria.id,
        company_name: inmobiliaria.company_name,
        user_type: inmobiliaria.user_type,
      },
      all_properties: allProperties,
      active_properties: activeProperties,
      access_tests: accessTests,
      analysis,
      recommendations: generateRecommendations(analysis, accessTests),
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}

function generateRecommendations(analysis: any, accessTests: any[]) {
  const recommendations = [];

  if (analysis.inconsistencies.active_but_not_published > 0) {
    recommendations.push({
      issue: 'Propiedades activas pero no publicadas',
      count: analysis.inconsistencies.active_but_not_published,
      severity: 'HIGH',
      solution: 'Cambiar el filtro en /api/inmobiliarias/[id]/properties para usar status=PUBLISHED en lugar de is_active=true',
    });
  }

  if (analysis.inconsistencies.published_but_not_active > 0) {
    recommendations.push({
      issue: 'Propiedades publicadas pero no activas',
      count: analysis.inconsistencies.published_but_not_active,
      severity: 'MEDIUM',
      solution: 'Sincronizar is_active con status en la base de datos',
    });
  }

  if (analysis.access_issues > 0) {
    const blockedProperties = accessTests.filter(t => !t.canAccess);
    recommendations.push({
      issue: 'Propiedades bloqueadas por RLS o permisos',
      count: analysis.access_issues,
      severity: 'CRITICAL',
      solution: 'Revisar políticas RLS en Supabase para la tabla properties',
      affected_properties: blockedProperties.map(p => ({
        id: p.id,
        title: p.title,
        error: p.error,
      })),
    });
  }

  return recommendations;
}
