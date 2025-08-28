import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || '5685128fb42e3ceca234ecd61cac300c'

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener datos del cuerpo de la petición
    const body = await request.json()
    const { name, bio, occupation, age, phone } = body

    // Validaciones básicas
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    if (age && (age < 18 || age > 120)) {
      return NextResponse.json(
        { error: 'La edad debe estar entre 18 y 120 años' },
        { status: 400 }
      )
    }

    // Simular actualización de usuario (en una implementación real usarías Prisma)
    const updatedUser = {
      id: decoded.userId,
      name: name.trim(),
      bio: bio?.trim() || '',
      occupation: occupation?.trim() || '',
      age: age || null,
      phone: phone?.trim() || '',
      email: decoded.email,
      userType: decoded.userType || 'inquilino',
      verified: decoded.verified || false,
      updatedAt: new Date().toISOString()
    }

    // En una implementación real, aquí actualizarías la base de datos:
    /*
    const prisma = new PrismaClient()
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name: name.trim(),
        bio: bio?.trim() || null,
        occupation: occupation?.trim() || null,
        age: age || null,
        phone: phone?.trim() || null,
      }
    })
    */

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Simular obtención de perfil de usuario
    const userProfile = {
      id: decoded.userId,
      name: decoded.name || 'Usuario',
      email: decoded.email,
      bio: decoded.bio || '',
      occupation: decoded.occupation || '',
      age: decoded.age || null,
      phone: decoded.phone || '',
      userType: decoded.userType || 'inquilino',
      verified: decoded.verified || false,
      rating: 0,
      reviewCount: 0,
      createdAt: decoded.createdAt || new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      user: userProfile
    })

  } catch (error) {
    console.error('Error getting profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
