import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma, handlePrismaError, checkDatabaseConnection } from '@/lib/prisma'
import { sendVerificationEmailAsync, checkEmailServiceStatus } from '@/lib/email-verification-robust'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando proceso de registro...');
    
    // Verificar conexión a la base de datos
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 }
      );
    }

    // Verificar estado del servicio de email
    const emailStatus = checkEmailServiceStatus();
    console.log(`📧 Estado del servicio de email: ${emailStatus.configured ? 'Configurado' : 'No configurado'}`);

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

    console.log(`📝 Datos recibidos: ${JSON.stringify({ name, email, userType }, null, 2)}`);

    // Validaciones básicas
    if (!name || !email || !phone || !password || !userType) {
      console.warn('⚠️ Faltan campos básicos requeridos');
      return NextResponse.json(
        { error: 'Todos los campos básicos son requeridos' },
        { status: 400 }
      )
    }

    // Validaciones específicas por tipo de usuario
    if (userType === 'inmobiliaria') {
      if (!companyName || !licenseNumber) {
        console.warn('⚠️ Faltan campos requeridos para inmobiliaria');
        return NextResponse.json(
          { error: 'Para inmobiliarias se requiere nombre de empresa y número de matrícula' },
          { status: 400 }
        )
      }
    }

    if (userType === 'dueno_directo') {
      if (!propertyCount) {
        console.warn('⚠️ Falta cantidad de propiedades para dueño directo');
        return NextResponse.json(
          { error: 'Para dueños directos se requiere indicar la cantidad de propiedades' },
          { status: 400 }
        )
      }
    }

    // Validar tipo de usuario
    const validUserTypes = ['inquilino', 'dueno_directo', 'inmobiliaria']
    if (!validUserTypes.includes(userType)) {
      console.warn(`⚠️ Tipo de usuario inválido: ${userType}`);
      return NextResponse.json(
        { error: 'Tipo de usuario inválido' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.warn(`⚠️ Formato de email inválido: ${email}`);
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validar contraseña
    if (password.length < 6) {
      console.warn('⚠️ Contraseña muy corta');
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    console.log('✅ Validaciones básicas completadas');

    // Verificar si el usuario ya existe
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        console.warn(`⚠️ Usuario ya existe con email: ${email}`);
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 409 }
        )
      }
    } catch (dbError) {
      console.error('❌ Error verificando usuario existente:', dbError);
      const errorInfo = handlePrismaError(dbError);
      return NextResponse.json(
        { error: errorInfo.message },
        { status: 500 }
      );
    }

    console.log('✅ Usuario no existe, procediendo con el registro');

    // Encriptar contraseña
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
      console.log('✅ Contraseña encriptada exitosamente');
    } catch (hashError) {
      console.error('❌ Error encriptando contraseña:', hashError);
      return NextResponse.json(
        { error: 'Error procesando la contraseña' },
        { status: 500 }
      );
    }

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

    console.log('📝 Creando usuario en la base de datos...');

    // Crear usuario en la base de datos
    let user: any;
    try {
      user = await prisma.user.create({
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
      console.log('✅ Usuario creado exitosamente en la base de datos');
    } catch (createError) {
      console.error('❌ Error creando usuario:', createError);
      const errorInfo = handlePrismaError(createError);
      
      if (errorInfo.field === 'email') {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: errorInfo.message },
        { status: 500 }
      );
    }

    // Enviar email de verificación de forma asíncrona (no bloqueante)
    let emailSent = false;
    if (emailStatus.configured) {
      try {
        // Envío asíncrono para no bloquear la respuesta
        sendVerificationEmailAsync(email, name, verificationToken);
        emailSent = true;
        console.log('📧 Email de verificación programado para envío asíncrono');
      } catch (emailError) {
        console.warn('⚠️ Error programando envío de email:', emailError);
        // No fallar el registro si el email falla
      }
    } else {
      console.warn('⚠️ Servicio de email no configurado - saltando envío de email');
    }

    console.log('🎉 Registro completado exitosamente');

    return NextResponse.json({
      message: emailSent 
        ? 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.'
        : 'Usuario registrado exitosamente. El servicio de email no está disponible en este momento.',
      user,
      emailSent,
      emailConfigured: emailStatus.configured
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error general en registro:', error);
    
    // Manejo específico de errores de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const errorInfo = handlePrismaError(error);
      return NextResponse.json(
        { error: errorInfo.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
