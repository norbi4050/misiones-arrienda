import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        reviewsReceived: {
          include: {
            reviewer: {
              select: {
                name: true,
                avatar: true,
                verified: true
              }
            },
            rental: {
              select: {
                startDate: true,
                endDate: true,
                property: {
                  select: {
                    title: true,
                    address: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        rentalHistory: {
          include: {
            property: {
              select: {
                title: true,
                address: true,
                city: true
              }
            }
          },
          orderBy: { startDate: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No incluir información sensible como email completo
    const publicUser = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      occupation: user.occupation,
      age: user.age,
      verified: user.verified,
      rating: user.rating,
      reviewCount: user.reviewCount,
      createdAt: user.createdAt,
      reviewsReceived: user.reviewsReceived,
      rentalHistory: user.rentalHistory.map(rental => ({
        id: rental.id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        status: rental.status,
        property: rental.property
      }))
    };

    return NextResponse.json(publicUser);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 });
  }
}
