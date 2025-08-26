import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

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

// GET - Obtener historial de búsquedas del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    const searchHistory = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ searchHistory });
  } catch (error) {
    console.error('Error al obtener historial de búsquedas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Agregar nueva búsqueda al historial
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchTerm, filters, resultsCount } = await request.json();
    
    if (!searchTerm) {
      return NextResponse.json({ error: 'Término de búsqueda requerido' }, { status: 400 });
    }

    // Verificar si ya existe una búsqueda similar reciente (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingSearch = await prisma.searchHistory.findFirst({
      where: {
        userId,
        searchTerm,
        createdAt: {
          gte: oneDayAgo
        }
      }
    });

    if (existingSearch) {
      // Si existe, actualizar el timestamp y resultados
      const updatedSearch = await prisma.searchHistory.update({
        where: { id: existingSearch.id },
        data: {
          resultsCount: resultsCount || existingSearch.resultsCount,
          createdAt: new Date() // Actualizar timestamp
        }
      });
      
      return NextResponse.json({ 
        message: 'Búsqueda actualizada',
        searchHistory: updatedSearch 
      });
    } else {
      // Si no existe, crear nueva entrada
      const newSearch = await prisma.searchHistory.create({
        data: {
          userId,
          searchTerm,
          filters: filters ? JSON.stringify(filters) : null,
          resultsCount: resultsCount || 0
        }
      });
      
      return NextResponse.json({ 
        message: 'Búsqueda guardada',
        searchHistory: newSearch 
      });
    }
  } catch (error) {
    console.error('Error al guardar búsqueda:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Limpiar historial de búsquedas
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchId = request.nextUrl.searchParams.get('searchId');
    
    if (searchId) {
      // Eliminar búsqueda específica
      const deletedSearch = await prisma.searchHistory.deleteMany({
        where: {
          id: searchId,
          userId
        }
      });

      if (deletedSearch.count === 0) {
        return NextResponse.json({ error: 'Búsqueda no encontrada' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Búsqueda eliminada exitosamente' });
    } else {
      // Limpiar todo el historial del usuario
      await prisma.searchHistory.deleteMany({
        where: { userId }
      });

      return NextResponse.json({ message: 'Historial de búsquedas limpiado exitosamente' });
    }
  } catch (error) {
    console.error('Error al eliminar historial:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
