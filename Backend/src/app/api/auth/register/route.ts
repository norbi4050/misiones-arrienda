import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando proceso de registro con Supabase...');
    
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

    // Crear cliente de Supabase con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar si el usuario ya existe en Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.find(user => user.email === email);
    
    if (userExists) {
      console.warn(`⚠️ Usuario ya existe con email: ${email}`);
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      )
    }

    // Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email para desarrollo
      user_metadata: {
        name,
        phone,
        userType,
        companyName: userType === 'inmobiliaria' ? companyName : null,
        licenseNumber: userType === 'inmobiliaria' ? licenseNumber : null,
        propertyCount: userType === 'dueno_directo' ? propertyCount : null
      }
    })

    if (authError) {
      console.error('❌ Error creando usuario en Supabase Auth:', authError);
      
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error creando usuario: ' + authError.message },
        { status: 500 }
      )
    }

    console.log('✅ Usuario creado exitosamente en Supabase Auth');

    // Crear perfil en la tabla users
    const userData = {
      id: authData.user.id,
      name,
      email,
      phone,
      user_type: userType,
      company_name: userType === 'inmobiliaria' ? companyName : null,
      license_number: userType === 'inmobiliaria' ? licenseNumber : null,
      property_count: userType === 'dueno_directo' ? propertyCount : null,
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error creando perfil de usuario:', profileError);
      
      // Si falla la creación del perfil, eliminar el usuario de Auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: 'Error creando perfil de usuario: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('✅ Perfil de usuario creado exitosamente');

    const responseUser = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      userType: profileData.user_type,
      companyName: profileData.company_name,
      licenseNumber: profileData.license_number,
      propertyCount: profileData.property_count,
      emailVerified: profileData.email_verified,
      createdAt: profileData.created_at
    }

    console.log('🎉 Registro completado exitosamente');

    return NextResponse.json({
      message: 'Usuario registrado exitosamente.',
      user: responseUser,
      emailSent: true,
      emailConfigured: true
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error general en registro:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
