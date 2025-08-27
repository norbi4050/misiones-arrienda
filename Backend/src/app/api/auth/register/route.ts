import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email-verification'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      userType, 
      companyName, 
      licenseNumber, 
      propertyCount 
    } = await request.json()

    // Validaciones básicas
    if (!name || !email || !phone || !password || !userType) {
      return NextResponse.json(
        { error: 'Todos los campos básicos son requeridos' },
        { status: 400 }
      )
    }

    // Validaciones específicas por tipo de usuario
    if (userType === 'inmobiliaria') {
      if (!companyName || !licenseNumber) {
        return NextResponse.json(
          { error: 'Para inmobiliarias se requiere nombre de empresa y número de matrícula' },
          { status: 400 }
        )
      }
    }

    if (userType === 'dueno_directo') {
      if (!propertyCount) {
        return NextResponse.json(
          { error: 'Para dueños directos se requiere indicar la cantidad de propiedades' },
          { status: 400 }
        )
      }
    }

    // Validar tipo de usuario
    const validUserTypes = ['inquilino', 'dueno_directo', 'inmobiliaria']
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Tipo de usuario inválido' },
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

    // Crear usuario con campos adicionales según el tipo
    const userData: any = {
      name,
      email,
      phone,
      password: hashedPassword,
      emailVerified: false,
      verificationToken,
      userType,
    }

    // Agregar campos específicos según el tipo de usuario
    if (userType === 'inmobiliaria') {
      userData.companyName = companyName
      userData.licenseNumber = licenseNumber
    }

    if (userType === 'dueno_directo') {
      userData.propertyCount = propertyCount
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        companyName: true,
        licenseNumber: true,
        propertyCount: true,
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
