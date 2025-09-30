import { NextRequest, NextResponse } from 'next/server';
import { getPropertyById, mockProperties } from '@/lib/mock-data-clean';
import { normalizeProperty } from '@/lib/type-helpers';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    const property = getPropertyById(params.id);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Setup for cover_url generation
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const BUCKET = process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images';
    const PLACEHOLDER = '/placeholder-apartment-1.jpg';

    function toCoverUrl(coverPath?: string) {
      if (!coverPath) return PLACEHOLDER;
      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(coverPath);
      return data.publicUrl || PLACEHOLDER;
    }

    // Get similar properties (same city and property type, excluding current property)
    let similarProperties = mockProperties
      .filter(prop => 
        prop.id !== property.id &&
        prop.city === property.city &&
        prop.propertyType === property.propertyType &&
        prop.status === 'AVAILABLE'
      )
      .slice(0, limit);

    // Normalize all properties to ensure proper typing
    similarProperties = similarProperties.map(normalizeProperty);

    // Add cover_url to each property
    const properties = similarProperties.map(p => ({
      ...p,
      cover_url: toCoverUrl((p as any).cover_path),
    }));

    return NextResponse.json({
      properties,
      total: properties.length
    });
  } catch (error) {
    console.error('Error fetching similar properties:', error);
    return NextResponse.json({ error: 'Error fetching similar properties' }, { status: 500 });
  }
}
