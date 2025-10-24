import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para borrar propiedades de prueba con imágenes de Unsplash
 */
export async function DELETE() {
  try {
    const supabase = createClient();

    // Primero, obtener todas las propiedades para analizar
    const { data: properties, error: fetchError } = await supabase
      .from('Property')
      .select('id, title, images');

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: fetchError.message
      }, { status: 500 });
    }

    // Identificar propiedades con URLs de Unsplash
    const testProperties: any[] = [];

    for (const property of properties || []) {
      let imgs: string[] = [];

      try {
        if (typeof property.images === 'string') {
          imgs = JSON.parse(property.images);
        } else if (Array.isArray(property.images)) {
          imgs = property.images;
        }
      } catch (e) {
        imgs = [];
      }

      // Verificar si tiene URLs de Unsplash
      const hasUnsplashImages = imgs.some(img =>
        typeof img === 'string' && img.includes('unsplash.com')
      );

      if (hasUnsplashImages) {
        testProperties.push({
          id: property.id,
          title: property.title,
          images: imgs
        });
      }
    }

    // Borrar las propiedades identificadas
    const deletedIds: string[] = [];
    for (const prop of testProperties) {
      const { error: deleteError } = await supabase
        .from('Property')
        .delete()
        .eq('id', prop.id);

      if (!deleteError) {
        deletedIds.push(prop.id);
      } else {
        console.error(`Error deleting property ${prop.id}:`, deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se borraron ${deletedIds.length} propiedades de prueba`,
      deleted: testProperties.map(p => ({
        id: p.id,
        title: p.title,
        firstImage: p.images[0]
      }))
    });

  } catch (error) {
    console.error('[DELETE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para ver qué propiedades se borrarían (preview)
export async function GET() {
  try {
    const supabase = createClient();

    const { data: properties, error } = await supabase
      .from('Property')
      .select('id, title, images, createdAt');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const testProperties: any[] = [];

    for (const property of properties || []) {
      let imgs: string[] = [];

      try {
        if (typeof property.images === 'string') {
          imgs = JSON.parse(property.images);
        } else if (Array.isArray(property.images)) {
          imgs = property.images;
        }
      } catch (e) {
        imgs = [];
      }

      const hasUnsplashImages = imgs.some(img =>
        typeof img === 'string' && img.includes('unsplash.com')
      );

      if (hasUnsplashImages) {
        testProperties.push({
          id: property.id,
          title: property.title,
          createdAt: property.createdAt,
          firstImage: imgs[0]
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se encontraron ${testProperties.length} propiedades con imágenes de Unsplash`,
      properties: testProperties
    });

  } catch (error) {
    console.error('[DELETE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
