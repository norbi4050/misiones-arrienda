// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPropertyCoverImage } from '@/lib/property-images.server';

/**
 * DEBUG: Endpoint para diagnosticar el problema de imágenes en perfil de inmobiliaria
 * GET /api/debug-inmobiliaria-images?agencyId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId') || 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

    console.log('🔍 [DEBUG] Iniciando diagnóstico para agencia:', agencyId);

    const supabase = createClient();

    // 1. Verificar que la inmobiliaria existe
    // Nota: La tabla users usa 'user_type' en lugar de 'role'
    const { data: agency, error: agencyError } = await supabase
      .from('users')
      .select('id, company_name, user_type')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json({
        error: 'Inmobiliaria no encontrada',
        agencyId,
        agencyError
      }, { status: 404 });
    }

    console.log('✅ [DEBUG] Inmobiliaria encontrada:', agency);

    // 2. Obtener propiedades
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', agencyId)
      .eq('is_active', true)
      .limit(3);

    if (propsError) {
      return NextResponse.json({
        error: 'Error obteniendo propiedades',
        propsError
      }, { status: 500 });
    }

    console.log(`✅ [DEBUG] Propiedades encontradas: ${properties?.length || 0}`);

    // 3. Procesar cada propiedad y generar signed URLs
    const debugResults = [];

    for (const prop of properties || []) {
      console.log(`\n🔍 [DEBUG] Procesando propiedad: ${prop.id}`);
      console.log(`   - Título: ${prop.title}`);
      console.log(`   - cover_url en BD: ${prop.cover_url}`);

      // Intentar generar signed URL
      let coverUrl;
      let error = null;

      try {
        coverUrl = await getPropertyCoverImage(
          prop.id,
          agencyId,
          prop.cover_url || undefined
        );
        console.log(`   ✅ cover_url generada: ${coverUrl}`);
      } catch (e: any) {
        error = e.message;
        console.error(`   ❌ Error generando cover_url:`, e);
      }

      // Verificar archivos en bucket
      const { data: files, error: listError } = await supabase.storage
        .from('property-images')
        .list(`${agencyId}/${prop.id}`, {
          limit: 10
        });

      console.log(`   📂 Archivos en bucket: ${files?.length || 0}`);
      if (files && files.length > 0) {
        console.log(`   📁 Archivos encontrados:`, files.map(f => f.name));
      }

      debugResults.push({
        propertyId: prop.id,
        title: prop.title,
        coverUrlInDB: prop.cover_url,
        coverUrlGenerated: coverUrl,
        error,
        filesInBucket: files?.length || 0,
        fileNames: files?.map(f => f.name) || [],
        listError: listError?.message || null
      });
    }

    return NextResponse.json({
      success: true,
      agency: {
        id: agency.id,
        name: agency.company_name,
        user_type: agency.user_type
      },
      totalProperties: properties?.length || 0,
      results: debugResults,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [DEBUG] Error en diagnóstico:', error);
    return NextResponse.json({
      error: 'Error en diagnóstico',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
