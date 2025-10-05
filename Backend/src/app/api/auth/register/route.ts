
// PROMPT D1: Importar guardas de displayName
import { applyDisplayNameGuards, logGuardApplication } from '@/lib/displayname-guards';

// Manejo mejorado de errores
const handleApiError = (error: any, context: string) => {
  console.error(`Error en ${context}:`, error);
  
  if (error.message?.includes('permission denied')) {
    return NextResponse.json(
      { 
        error: 'Error de permisos de base de datos. Verifica la configuración de Supabase.',
        details: 'Las políticas RLS pueden no estar configuradas correctamente.',
        context 
      },
      { status: 403 }
    );
  }
  
  if (error.message?.includes('connection')) {
    return NextResponse.json(
      { 
        error: 'Error de conexión a la base de datos.',
        details: 'Verifica las credenciales de Supabase.',
        context 
      },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { 
      error: 'Error interno del servidor',
      details: error.message || 'Error desconocido',
      context 
    },
    { status: 500 }
  );
};

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Interfaz para el cuerpo de la petición
interface RegisterRequestBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: 'inquilino' | 'dueno_directo' | 'inmobiliaria';
  companyName?: string;
  licenseNumber?: string;
  propertyCount?: number;
  acceptTerms?: boolean;
}

// Interfaz para respuesta de error
interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
  code?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [REGISTRO] Iniciando proceso de registro mejorado...');
  
  try {
    // ========================================
    // 1. VERIFICACIÓN DE VARIABLES DE ENTORNO
    // ========================================
    console.log('🔍 [REGISTRO] Verificando variables de entorno...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      console.error('❌ [REGISTRO] NEXT_PUBLIC_SUPABASE_URL no configurada');
      return NextResponse.json({
        error: 'Configuración del servidor incompleta',
        details: 'Variable NEXT_PUBLIC_SUPABASE_URL no configurada',
        timestamp: new Date().toISOString(),
        code: 'ENV_SUPABASE_URL_MISSING'
      } as ErrorResponse, { status: 500 });
    }
    
    if (!supabaseServiceKey) {
      console.error('❌ [REGISTRO] SUPABASE_SERVICE_ROLE_KEY no configurada');
      return NextResponse.json({
        error: 'Configuración del servidor incompleta',
        details: 'Variable SUPABASE_SERVICE_ROLE_KEY no configurada',
        timestamp: new Date().toISOString(),
        code: 'ENV_SERVICE_KEY_MISSING'
      } as ErrorResponse, { status: 500 });
    }
    
    console.log('✅ [REGISTRO] Variables de entorno verificadas correctamente');
    
    // ========================================
    // 2. VALIDACIÓN Y PARSEO DE DATOS
    // ========================================
    console.log('📝 [REGISTRO] Procesando datos de entrada...');
    
    let body: RegisterRequestBody;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ [REGISTRO] Error parseando JSON:', parseError);
      return NextResponse.json({
        error: 'Datos de entrada inválidos',
        details: 'El cuerpo de la petición no es un JSON válido',
        timestamp: new Date().toISOString(),
        code: 'INVALID_JSON'
      } as ErrorResponse, { status: 400 });
    }
    
    const { 
      name, 
      email, 
      phone, 
      password, 
      userType, 
      companyName, 
      licenseNumber, 
      propertyCount,
      acceptTerms
    } = body;
    
    console.log(`📋 [REGISTRO] Datos recibidos: ${JSON.stringify({ 
      name, 
      email, 
      userType,
      hasCompanyName: !!companyName,
      hasLicenseNumber: !!licenseNumber,
      hasPropertyCount: !!propertyCount
    }, null, 2)}`);
    
    // ========================================
    // 3. VALIDACIONES BÁSICAS MEJORADAS
    // ========================================
    console.log('🔍 [REGISTRO] Ejecutando validaciones básicas...');
    
    // Validar campos requeridos
    const requiredFields = { name, email, phone, password, userType };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);
    
    if (missingFields.length > 0) {
      console.warn(`⚠️ [REGISTRO] Campos faltantes: ${missingFields.join(', ')}`);
      return NextResponse.json({
        error: 'Campos requeridos faltantes',
        details: `Los siguientes campos son obligatorios: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString(),
        code: 'MISSING_REQUIRED_FIELDS'
      } as ErrorResponse, { status: 400 });
    }
    
    // Validar tipo de usuario
    const validUserTypes = ['inquilino', 'dueno_directo', 'inmobiliaria'];
    if (!validUserTypes.includes(userType)) {
      console.warn(`⚠️ [REGISTRO] Tipo de usuario inválido: ${userType}`);
      return NextResponse.json({
        error: 'Tipo de usuario inválido',
        details: `Los tipos válidos son: ${validUserTypes.join(', ')}`,
        timestamp: new Date().toISOString(),
        code: 'INVALID_USER_TYPE'
      } as ErrorResponse, { status: 400 });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn(`⚠️ [REGISTRO] Formato de email inválido: ${email}`);
      return NextResponse.json({
        error: 'Formato de email inválido',
        details: 'Por favor ingrese un email válido',
        timestamp: new Date().toISOString(),
        code: 'INVALID_EMAIL_FORMAT'
      } as ErrorResponse, { status: 400 });
    }
    
    // Validar contraseña
    if (password.length < 6) {
      console.warn('⚠️ [REGISTRO] Contraseña muy corta');
      return NextResponse.json({
        error: 'Contraseña muy corta',
        details: 'La contraseña debe tener al menos 6 caracteres',
        timestamp: new Date().toISOString(),
        code: 'PASSWORD_TOO_SHORT'
      } as ErrorResponse, { status: 400 });
    }
    
    // Validaciones específicas por tipo de usuario
    if (userType === 'inmobiliaria') {
      if (!companyName) {
        console.warn('⚠️ [REGISTRO] Falta companyName para inmobiliaria');
        return NextResponse.json({
          error: 'VALIDATION_ERROR',
          details: 'El nombre de la empresa es obligatorio para inmobiliarias',
          issues: [{ path: 'companyName', message: 'Campo requerido' }],
          timestamp: new Date().toISOString(),
          code: 'MISSING_COMPANY_NAME'
        } as ErrorResponse, { status: 400 });
      }
      if (!acceptTerms) {
        console.warn('⚠️ [REGISTRO] Falta aceptación de términos');
        return NextResponse.json({
          error: 'VALIDATION_ERROR',
          details: 'Debe aceptar los términos y condiciones',
          issues: [{ path: 'acceptTerms', message: 'Debe aceptar los términos' }],
          timestamp: new Date().toISOString(),
          code: 'TERMS_NOT_ACCEPTED'
        } as ErrorResponse, { status: 400 });
      }
    }
    
    console.log('✅ [REGISTRO] Validaciones básicas completadas');
    
    // ========================================
    // 4. CREACIÓN Y VERIFICACIÓN DE CLIENTE SUPABASE
    // ========================================
    console.log('🔗 [REGISTRO] Creando cliente Supabase...');
    
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ [REGISTRO] Cliente Supabase creado exitosamente');
    } catch (clientError) {
      console.error('❌ [REGISTRO] Error creando cliente Supabase:', clientError);
      return NextResponse.json({
        error: 'Error de configuración de base de datos',
        details: process.env.NODE_ENV === 'development' ? String(clientError) : 'Error interno de configuración',
        timestamp: new Date().toISOString(),
        code: 'SUPABASE_CLIENT_ERROR'
      } as ErrorResponse, { status: 500 });
    }
    
    // ========================================
    // 5. VERIFICACIÓN DE CONECTIVIDAD
    // ========================================
    console.log('🏥 [REGISTRO] Verificando conectividad con Supabase...');
    
    try {
      // Intentar una consulta simple para verificar conectividad
      const { error: healthError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (healthError) {
        // Si la tabla no existe, es un problema de esquema
        if (healthError.message.includes('relation "users" does not exist')) {
          console.error('❌ [REGISTRO] Tabla users no existe en Supabase');
          return NextResponse.json({
            error: 'Error de configuración de base de datos',
            details: 'La tabla de usuarios no está configurada correctamente',
            timestamp: new Date().toISOString(),
            code: 'USERS_TABLE_NOT_EXISTS'
          } as ErrorResponse, { status: 500 });
        }
        
        // Otros errores de base de datos
        console.error('❌ [REGISTRO] Error de conectividad:', healthError);
        return NextResponse.json({
          error: 'Error de conexión con base de datos',
          details: process.env.NODE_ENV === 'development' ? healthError.message : 'Error de conectividad',
          timestamp: new Date().toISOString(),
          code: 'DATABASE_CONNECTION_ERROR'
        } as ErrorResponse, { status: 503 });
      }
      
      console.log('✅ [REGISTRO] Conectividad con Supabase verificada');
    } catch (connectError) {
      console.error('❌ [REGISTRO] Error verificando conectividad:', connectError);
      return NextResponse.json({
        error: 'Error de conexión con base de datos',
        details: process.env.NODE_ENV === 'development' ? String(connectError) : 'Error de conectividad',
        timestamp: new Date().toISOString(),
        code: 'CONNECTIVITY_CHECK_FAILED'
      } as ErrorResponse, { status: 503 });
    }
    
    // ========================================
    // 6. VERIFICACIÓN DE USUARIO EXISTENTE
    // ========================================
    console.log('👤 [REGISTRO] Verificando si el usuario ya existe...');
    
    try {
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ [REGISTRO] Error listando usuarios:', listError);
        return NextResponse.json({
          error: 'Error verificando usuario existente',
          details: process.env.NODE_ENV === 'development' ? listError.message : 'Error interno',
          timestamp: new Date().toISOString(),
          code: 'USER_LIST_ERROR'
        } as ErrorResponse, { status: 500 });
      }
      
      const userExists = existingUsers?.users?.find(user => user.email === email);
      
      if (userExists) {
        console.warn(`⚠️ [REGISTRO] Usuario ya existe con email: ${email}`);
        return NextResponse.json({
          error: 'Usuario ya existe',
          details: 'Ya existe una cuenta registrada con este email',
          timestamp: new Date().toISOString(),
          code: 'USER_ALREADY_EXISTS'
        } as ErrorResponse, { status: 409 });
      }
      
      console.log('✅ [REGISTRO] Usuario no existe, procediendo con registro');
    } catch (checkError) {
      console.error('❌ [REGISTRO] Error verificando usuario existente:', checkError);
      return NextResponse.json({
        error: 'Error verificando usuario existente',
        details: process.env.NODE_ENV === 'development' ? String(checkError) : 'Error interno',
        timestamp: new Date().toISOString(),
        code: 'USER_CHECK_ERROR'
      } as ErrorResponse, { status: 500 });
    }
    
    // ========================================
    // 7. CREACIÓN DE USUARIO EN SUPABASE AUTH
    // ========================================
    console.log('🔐 [REGISTRO] Creando usuario en Supabase Auth...');
    
    let authData;
    try {
      const { data, error: authError } = await supabase.auth.admin.createUser({
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
      });
      
      if (authError) {
        console.error('❌ [REGISTRO] Error creando usuario en Auth:', authError);
        
        // Manejar errores específicos de Auth
        if (authError.message.includes('already registered') || 
            authError.message.includes('User already registered')) {
          return NextResponse.json({
            error: 'Usuario ya existe',
            details: 'Ya existe una cuenta registrada con este email',
            timestamp: new Date().toISOString(),
            code: 'AUTH_USER_EXISTS'
          } as ErrorResponse, { status: 409 });
        }
        
        return NextResponse.json({
          error: 'Error creando usuario',
          details: process.env.NODE_ENV === 'development' ? authError.message : 'Error en el proceso de registro',
          timestamp: new Date().toISOString(),
          code: 'AUTH_CREATE_ERROR'
        } as ErrorResponse, { status: 500 });
      }
      
      authData = data;
      console.log('✅ [REGISTRO] Usuario creado exitosamente en Supabase Auth');
    } catch (authException) {
      console.error('❌ [REGISTRO] Excepción creando usuario en Auth:', authException);
      return NextResponse.json({
        error: 'Error creando usuario',
        details: process.env.NODE_ENV === 'development' ? String(authException) : 'Error en el proceso de registro',
        timestamp: new Date().toISOString(),
        code: 'AUTH_CREATE_EXCEPTION'
      } as ErrorResponse, { status: 500 });
    }
    
    // ========================================
    // 8. APLICAR GUARDAS DE DISPLAYNAME (PROMPT D1)
    // ========================================
    console.log('🛡️ [REGISTRO] Aplicando guardas de displayName...');
    
    const guardResult = applyDisplayNameGuards(name, email);
    
    // Log de auditoría con información completa
    logGuardApplication('registration', {
      email,
      name: guardResult.name,
      source: guardResult.source,
      wasModified: guardResult.wasModified,
      reason: guardResult.reason
    });
    
    // ========================================
    // 9. CREACIÓN DE PERFIL EN TABLA USERS
    // ========================================
    console.log('👤 [REGISTRO] Creando perfil de usuario en tabla users...');
    
    const userData = {
      id: authData.user.id,
      name: guardResult.name,  // ✅ PROMPT D1: Garantizado válido (no UUID, no vacío)
      email,
      phone: phone || '',   // ✅ Evita NULL en phone
      user_type: userType,
      company_name: userType === 'inmobiliaria' ? companyName : null,
      license_number: userType === 'inmobiliaria' ? (licenseNumber || null) : null,
      property_count: userType === 'dueno_directo' ? propertyCount : null,
      // is_company es true para inmobiliaria Y dueno_directo (ahora llamado "Empresa")
      is_company: userType === 'inmobiliaria' || userType === 'dueno_directo',
      is_verified: false,  // Se activará con CUIT más adelante
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    let profileData;
    try {
      const { data, error: profileError } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ [REGISTRO] Error creando perfil de usuario:', profileError);
        
        // Rollback: eliminar usuario de Auth si falla la creación del perfil
        console.log('🔄 [REGISTRO] Ejecutando rollback - eliminando usuario de Auth...');
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('✅ [REGISTRO] Rollback completado');
        } catch (rollbackError) {
          console.error('❌ [REGISTRO] Error en rollback:', rollbackError);
        }
        
        // Manejar errores específicos de perfil
        if (profileError.message.includes('duplicate key')) {
          return NextResponse.json({
            error: 'Usuario ya existe',
            details: 'Ya existe un perfil con este ID de usuario',
            timestamp: new Date().toISOString(),
            code: 'PROFILE_DUPLICATE_KEY'
          } as ErrorResponse, { status: 409 });
        }
        
        return NextResponse.json({
          error: 'Database error saving new user',
          details: process.env.NODE_ENV === 'development' ? profileError.message : 'Error guardando perfil de usuario',
          timestamp: new Date().toISOString(),
          code: 'PROFILE_CREATE_ERROR'
        } as ErrorResponse, { status: 500 });
      }
      
      profileData = data;
      console.log('✅ [REGISTRO] Perfil de usuario creado exitosamente');
    } catch (profileException) {
      console.error('❌ [REGISTRO] Excepción creando perfil:', profileException);
      
      // Rollback: eliminar usuario de Auth
      console.log('🔄 [REGISTRO] Ejecutando rollback por excepción...');
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('✅ [REGISTRO] Rollback completado');
      } catch (rollbackError) {
        console.error('❌ [REGISTRO] Error en rollback:', rollbackError);
      }
      
      return NextResponse.json({
        error: 'Database error saving new user',
        details: process.env.NODE_ENV === 'development' ? String(profileException) : 'Error guardando perfil de usuario',
        timestamp: new Date().toISOString(),
        code: 'PROFILE_CREATE_EXCEPTION'
      } as ErrorResponse, { status: 500 });
    }
    
    // ========================================
    // 10. PREPARACIÓN DE RESPUESTA EXITOSA
    // ========================================
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
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
    };
    
    console.log(`🎉 [REGISTRO] Registro completado exitosamente en ${processingTime}ms`);
    console.log(`[REGISTER] USER TYPE: ${userType}`);
    
    // Determinar ruta de redirección según userType
    const nextRoute = userType === 'inmobiliaria' ? '/mi-empresa' : '/';
    console.log(`[REGISTER] NEXT ROUTE: ${nextRoute}`);
    
    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      userId: profileData.id,
      userType: profileData.user_type,
      nextRoute: nextRoute,
      user: responseUser,
      emailSent: true,
      emailConfigured: true,
      processingTime: `${processingTime}ms`
    }, { status: 201 });
    
  } catch (error) {
    return handleApiError(error, 'registro de usuario');
  }
}
