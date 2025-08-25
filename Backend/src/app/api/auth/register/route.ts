import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email-verification'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    // Validaciones
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validar contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      )
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generar token de verificación
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        emailVerified: false,
        verificationToken,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        verified: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // Enviar email de verificación
    let emailSent = false
    try {
      await sendVerificationEmail(email, name, verificationToken)
      emailSent = true
    } catch (emailError) {
      console.error('Error enviando email de verificación:', emailError)
      // No fallar el registro si el email falla
    }

    return NextResponse.json({
      message: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
      user,
      emailSent
    }, { status: 201 })

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
