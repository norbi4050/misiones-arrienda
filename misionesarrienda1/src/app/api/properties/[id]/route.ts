import { NextRequest, NextResponse } from 'next/server';
import { getPropertyById, mockProperties } from '@/lib/mock-data-clean';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = getPropertyById(params.id);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get similar properties (same city and property type, excluding current property)
    const similarProperties = mockProperties
      .filter(prop => 
        prop.id !== property.id &&
        prop.city === property.city &&
        prop.propertyType === property.propertyType &&
        prop.status === 'AVAILABLE'
      )
      .slice(0, 4);

    return NextResponse.json({
      property,
      similarProperties
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json({ error: 'Error fetching property' }, { status: 500 });
  }
}
