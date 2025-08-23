import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            rating: true,
            reviewCount: true,
            bio: true,
          }
        }
      }
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get similar properties
    const similarProperties = await prisma.property.findMany({
      where: {
        id: { not: property.id },
        city: property.city,
        propertyType: property.propertyType,
        status: 'AVAILABLE',
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    });

    // Parse JSON fields for the main property
    const parsedProperty = {
      ...property,
      images: JSON.parse(property.images || '[]'),
      amenities: JSON.parse(property.amenities || '[]'),
      features: JSON.parse(property.features || '[]'),
    };

    // Parse JSON fields for similar properties
    const parsedSimilarProperties = similarProperties.map(prop => ({
      ...prop,
      images: JSON.parse(prop.images || '[]'),
      amenities: JSON.parse(prop.amenities || '[]'),
      features: JSON.parse(prop.features || '[]'),
    }));

    return NextResponse.json({
      property: parsedProperty,
      similarProperties: parsedSimilarProperties
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json({ error: 'Error fetching property' }, { status: 500 });
  }
}
