import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token de verificación requerido' },
        { status: 400 }
      )
    }

    // Buscar usuario con el token
    const user = await prisma.user.findFirst({
      where: { 
        verificationToken: token,
        emailVerified: false
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token de verificación inválido o expirado' },
        { status: 400 }
      )
    }

    // Verificar el email del usuario
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verified: true,
        verificationToken: null
      }
    })

    // Redirigir a una página de éxito
    return NextResponse.redirect(
      new URL('/login?verified=true', request.url)
    )

  } catch (error) {
    console.error('Error en verificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
