import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Función para obtener el usuario del token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET - Obtener favoritos del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            agent: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Agregar/quitar favorito
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { propertyId } = await request.json();
    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    // Verificar si ya existe el favorito
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (existingFavorite) {
      // Si existe, lo eliminamos
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      });
      
      return NextResponse.json({ 
        message: 'Favorito eliminado',
        isFavorite: false 
      });
    } else {
      // Si no existe, lo creamos
      const newFavorite = await prisma.favorite.create({
        data: {
          userId,
          propertyId
        }
      });
      
      return NextResponse.json({ 
        message: 'Favorito agregado',
        favorite: newFavorite,
        isFavorite: true 
      });
    }
  } catch (error) {
    console.error('Error al manejar favorito:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar favorito específico
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    
    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    const deletedFavorite = await prisma.favorite.deleteMany({
      where: {
        userId,
        propertyId
      }
    });

    if (deletedFavorite.count === 0) {
      return NextResponse.json({ error: 'Favorito no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Favorito eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar favorito:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
