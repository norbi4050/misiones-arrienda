import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || '5685128fb42e3ceca234ecd61cac300c'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Token verification request received')
    
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    console.log('📋 Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header')
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log('🔑 Token extracted:', token.substring(0, 20) + '...')
    
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('✅ Token verified successfully for user:', decoded.userId)
    } catch (error: any) {
      console.log('❌ Token verification failed:', error.message)
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    // Simular obtención de datos de usuario (en producción usar Prisma)
    const userData = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'Usuario',
      userType: decoded.userType || 'inquilino',
      verified: decoded.verified || false,
      bio: decoded.bio || '',
      occupation: decoded.occupation || '',
      age: decoded.age || null,
      phone: decoded.phone || '',
      profileImage: decoded.profileImage || '',
      createdAt: decoded.createdAt || new Date().toISOString()
    }

    console.log('✅ User data retrieved successfully')

    return NextResponse.json({
      success: true,
      message: 'Token verificado correctamente',
      user: userData
    })

  } catch (error) {
    console.error('💥 Error verifying token:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Token verification POST request received')
    
    const body = await request.json()
    const { token } = body
    
    if (!token) {
      console.log('❌ No token provided in body')
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      )
    }

    console.log('🔑 Token from body:', token.substring(0, 20) + '...')
    
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('✅ Token verified successfully for user:', decoded.userId)
    } catch (error: any) {
      console.log('❌ Token verification failed:', error.message)
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    // Simular obtención de datos de usuario
    const userData = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'Usuario',
      userType: decoded.userType || 'inquilino',
      verified: decoded.verified || false,
      bio: decoded.bio || '',
      occupation: decoded.occupation || '',
      age: decoded.age || null,
      phone: decoded.phone || '',
      profileImage: decoded.profileImage || '',
      createdAt: decoded.createdAt || new Date().toISOString()
    }

    console.log('✅ User data retrieved successfully')

    return NextResponse.json({
      success: true,
      message: 'Token verificado correctamente',
      user: userData
    })

  } catch (error) {
    console.error('💥 Error verifying token:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
