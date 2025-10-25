import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para listar TODAS las propiedades con detalles completos
 * Útil para identificar propiedades demo/fantasma
 */
export async function GET() {
  try {
    const supabase = createClient();

    // Obtener TODAS las propiedades (sin filtros)
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, title, images, status, is_active, user_id, created_at, city, price')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Analizar cada propiedad
    const analysis = properties?.map(prop => {
      let imgs: string[] = [];
      try {
        if (typeof prop.images === 'string') {
          imgs = JSON.parse(prop.images);
        } else if (Array.isArray(prop.images)) {
          imgs = prop.images;
        }
      } catch (e) {
        imgs = [];
      }

      const firstImage = imgs[0] || null;
      const imageType = firstImage
        ? firstImage.includes('unsplash.com')
          ? 'unsplash'
          : firstImage.includes('supabase.co')
          ? 'supabase'
          : firstImage.includes('placeholder')
          ? 'placeholder'
          : 'unknown'
        : 'none';

      return {
        id: prop.id,
        title: prop.title,
        city: prop.city,
        price: prop.price,
        status: prop.status,
        is_active: prop.is_active,
        userId: prop.user_id,
        createdAt: prop.created_at,
        imageCount: imgs.length,
        firstImage,
        imageType,
        allImages: imgs
      };
    }) || [];

    // Agrupar por tipo de imagen
    const byImageType = {
      unsplash: analysis.filter(p => p.imageType === 'unsplash'),
      supabase: analysis.filter(p => p.imageType === 'supabase'),
      placeholder: analysis.filter(p => p.imageType === 'placeholder'),
      none: analysis.filter(p => p.imageType === 'none'),
      unknown: analysis.filter(p => p.imageType === 'unknown')
    };

    // Agrupar por estado (UPPERCASE según constraint de DB)
    const byStatus = {
      published: analysis.filter(p => p.status === 'PUBLISHED'),
      draft: analysis.filter(p => p.status === 'DRAFT'),
      archived: analysis.filter(p => p.status === 'ARCHIVED'),
      other: analysis.filter(p => !['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(p.status))
    };

    const summary = {
      total: analysis.length,
      byImageType: {
        unsplash: byImageType.unsplash.length,
        supabase: byImageType.supabase.length,
        placeholder: byImageType.placeholder.length,
        none: byImageType.none.length,
        unknown: byImageType.unknown.length
      },
      byStatus: {
        published: byStatus.published.length,
        draft: byStatus.draft.length,
        archived: byStatus.archived.length,
        other: byStatus.other.length
      }
    };

    return NextResponse.json({
      success: true,
      summary,
      properties: analysis,
      groupedByImageType: byImageType,
      groupedByStatus: byStatus
    });

  } catch (error) {
    console.error('[LIST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
