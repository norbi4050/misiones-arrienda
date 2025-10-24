import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para arreglar las imágenes rotas de Unsplash en las propiedades
 * Reemplaza URLs de Unsplash con placeholders o URLs de Unsplash válidas
 */
export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    const supabase = createClient();

    // Obtener todas las propiedades
    const { data: properties, error: fetchError } = await supabase
      .from('Property')
      .select('id, title, images')
      .eq('status', 'published');

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: fetchError.message
      }, { status: 500 });
    }

    const updates: any[] = [];
    const placeholders = [
      '/placeholder-apartment-1.jpg',
      '/placeholder-house-1.jpg',
      '/placeholder-apartment-2.jpg',
      '/placeholder-house-2.jpg'
    ];

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
        let newImages: string[];

        if (action === 'use-placeholders') {
          // Reemplazar con placeholders locales
          const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
          newImages = [randomPlaceholder];
        } else {
          // Arreglar URLs de Unsplash con parámetros correctos
          newImages = imgs.map(img => {
            if (typeof img === 'string' && img.includes('unsplash.com')) {
              // Extraer el ID de la foto
              const match = img.match(/photo-([^?]+)/);
              if (match) {
                const photoId = match[1];
                return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&q=80`;
              }
            }
            return img;
          });
        }

        updates.push({
          id: property.id,
          title: property.title,
          oldImages: imgs,
          newImages
        });

        // Actualizar en la base de datos
        await supabase
          .from('Property')
          .update({ images: JSON.stringify(newImages) })
          .eq('id', property.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se actualizaron ${updates.length} propiedades`,
      updates: updates.map(u => ({
        id: u.id,
        title: u.title,
        from: u.oldImages[0],
        to: u.newImages[0]
      }))
    });

  } catch (error) {
    console.error('[FIX] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para ver qué propiedades tienen URLs rotas
export async function GET() {
  try {
    const supabase = createClient();

    const { data: properties, error } = await supabase
      .from('Property')
      .select('id, title, images, status')
      .eq('status', 'published');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

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

      const hasUnsplash = imgs.some(img => typeof img === 'string' && img.includes('unsplash.com'));
      const hasSupabase = imgs.some(img => typeof img === 'string' && img.includes('supabase.co'));
      const hasPlaceholder = imgs.some(img => typeof img === 'string' && img.includes('placeholder'));

      return {
        id: prop.id,
        title: prop.title,
        imageCount: imgs.length,
        firstImage: imgs[0] || null,
        hasUnsplash,
        hasSupabase,
        hasPlaceholder
      };
    }) || [];

    const summary = {
      total: analysis.length,
      withUnsplash: analysis.filter(p => p.hasUnsplash).length,
      withSupabase: analysis.filter(p => p.hasSupabase).length,
      withPlaceholder: analysis.filter(p => p.hasPlaceholder).length,
      withoutImages: analysis.filter(p => p.imageCount === 0).length
    };

    return NextResponse.json({
      success: true,
      summary,
      properties: analysis
    });

  } catch (error) {
    console.error('[FIX] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
