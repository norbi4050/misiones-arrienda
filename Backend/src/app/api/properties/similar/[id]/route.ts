import { NextRequest, NextResponse } from 'next/server';
import { getPropertyById, mockProperties } from '@/lib/mock-data-clean';
import { normalizeProperty } from '@/lib/type-helpers';

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

    return NextResponse.json({
      properties: similarProperties,
      total: similarProperties.length
    });
  } catch (error) {
    console.error('Error fetching similar properties:', error);
    return NextResponse.json({ error: 'Error fetching similar properties' }, { status: 500 });
  }
}
