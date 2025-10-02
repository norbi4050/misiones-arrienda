import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Tipos para la respuesta
interface PropertyListItem {
  id: string;
  title: string;
  price: number;
  location: string;
  property_type: string;
  operation_type: string;
  cover_url: string | null;
  created_at: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

interface PropertiesResponse {
  items: PropertyListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * GET /api/inmobiliarias/[id]/properties
 * 
 * Obtiene las propiedades activas de una inmobiliaria específica
 * 
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 12, max: 50)
 * - sort: ordenamiento (recent|price_asc|price_desc, default: recent)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    // Parsear parámetros de query
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
    const sort = searchParams.get('sort') || 'recent';

    // Validar ID de inmobiliaria
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'ID de inmobiliaria inválido' },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase
    const supabase = createClient();

    // Verificar que la inmobiliaria existe
    const { data: inmobiliaria, error: inmoError } = await supabase
      .from('users')
      .select('id, company_name, role')
      .eq('id', id)
      .single();

    if (inmoError || !inmobiliaria) {
      return NextResponse.json(
        { error: 'Inmobiliaria no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que es una inmobiliaria
    if (inmobiliaria.role !== 'inmobiliaria') {
      return NextResponse.json(
        { error: 'El usuario no es una inmobiliaria' },
        { status: 400 }
      );
    }

    // Construir query base
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('user_id', id)
      .eq('is_active', true);

    // Aplicar ordenamiento
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Aplicar paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Ejecutar query
    const { data: properties, error: propsError, count } = await query;

    if (propsError) {
      console.error('Error fetching properties:', propsError);
      return NextResponse.json(
        { error: 'Error al obtener propiedades' },
        { status: 500 }
      );
    }

    // Mapear propiedades al formato de respuesta
    const items: PropertyListItem[] = (properties || []).map((prop) => ({
      id: prop.id,
      title: prop.title,
      price: prop.price,
      location: prop.location || prop.city || 'Sin ubicación',
      property_type: prop.property_type,
      operation_type: prop.operation_type || 'alquiler',
      cover_url: prop.cover_url,
      created_at: prop.created_at,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      area: prop.area,
    }));

    // Calcular total de páginas
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Construir respuesta
    const response: PropertiesResponse = {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/inmobiliarias/[id]/properties:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
