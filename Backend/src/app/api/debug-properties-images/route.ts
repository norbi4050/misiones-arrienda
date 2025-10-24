import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();

    // Obtener todas las propiedades publicadas
    const { data: properties, error } = await supabase
      .from('Property')
      .select('id, title, cover_path, images, status, is_active')
      .eq('status', 'published')
      .eq('is_active', true)
      .limit(10);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    // Analizar cada propiedad
    const analysis = properties?.map(prop => {
      let parsedImages: string[] = [];
      try {
        if (typeof prop.images === 'string') {
          parsedImages = JSON.parse(prop.images);
        } else if (Array.isArray(prop.images)) {
          parsedImages = prop.images;
        }
      } catch (e) {
        parsedImages = [];
      }

      return {
        id: prop.id,
        title: prop.title,
        cover_path: prop.cover_path,
        has_cover_path: !!prop.cover_path,
        images_raw: prop.images,
        images_type: typeof prop.images,
        images_parsed: parsedImages,
        images_count: parsedImages.length,
        first_image: parsedImages[0] || null,
        status: prop.status,
        is_active: prop.is_active
      };
    }) || [];

    return NextResponse.json({
      success: true,
      total_properties: properties?.length || 0,
      properties: analysis,
      summary: {
        with_cover_path: analysis.filter(p => p.has_cover_path).length,
        without_cover_path: analysis.filter(p => !p.has_cover_path).length,
        with_images: analysis.filter(p => p.images_count > 0).length,
        without_images: analysis.filter(p => p.images_count === 0).length
      }
    });

  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
