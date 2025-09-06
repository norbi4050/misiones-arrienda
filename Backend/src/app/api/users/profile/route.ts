import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import logger from '@/lib/simple-logger'
import { withErrorHandler, ValidationError, AuthenticationError, NotFoundError } from '@/middleware/error-handler'
import { UpdateUserSchema, validateUserData } from '@/lib/schemas/user'

// Función para crear usuario en tabla users si no existe
async function ensureUserExists(supabase: any, userId: string, userEmail?: string) {
  try {
    // Verificar si el usuario existe en la tabla users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      // Usuario no existe, crearlo
      logger.info('Usuario no existe en tabla users, creando...', { userId, userEmail });

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail || 'unknown@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        logger.error('Error creando usuario:', createError);
        throw new Error('Error creando usuario en base de datos');
      }

      logger.info('Usuario creado exitosamente:', { userId: newUser.id });
      return { success: true, user: newUser };
    } else if (checkError) {
      logger.error('Error verificando usuario:', checkError);
      throw new Error('Error verificando existencia del usuario');
    }

    return { success: true, user: existingUser };
  } catch (error) {
    logger.error('Error en ensureUserExists:', error);
    throw error;
  }
}

// Handler para actualizar perfil con validación completa
async function handleProfileUpdate(request: NextRequest) {
  const supabase = createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new AuthenticationError('Usuario no autenticado');
  }

  logger.info('Actualizando perfil de usuario:', { userId: user.id });

  // Obtener y validar datos del cuerpo
  const body = await request.json();
  const validation = validateUserData(body, UpdateUserSchema);

  if (!validation.success) {
    throw new ValidationError('Datos de entrada inválidos');
  }

  // Preparar datos para actualización
  const updateData = {
    ...validation.data,
    updated_at: new Date().toISOString()
  };

  // Actualizar perfil
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .select('id,name,email,phone,avatar,bio,occupation,age,user_type,company_name,license_number,property_count,full_name,location,search_type,budget_range,profile_image,preferred_areas,family_size,pet_friendly,move_in_date,employment_status,monthly_income,verified,email_verified,rating,review_count,created_at,updated_at')
    .single();

  if (error) {
    logger.error('Error actualizando perfil:', error);
    throw new Error('Error al actualizar el perfil');
  }

  logger.info('Perfil actualizado exitosamente:', { userId: user.id });

  return NextResponse.json({
    message: 'Perfil actualizado exitosamente',
    user: data
  });
}

// Handler para obtener perfil
async function handleProfileGet(request: NextRequest) {
  const supabase = createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new AuthenticationError('Usuario no autenticado');
  }

  logger.info('Obteniendo perfil de usuario:', { userId: user.id });

  // Asegurar que el usuario existe
  await ensureUserExists(supabase, user.id, user.email);

  // Obtener perfil
  const { data, error } = await supabase
    .from('users')
    .select('id,name,email,phone,avatar,bio,occupation,age,user_type,company_name,license_number,property_count,full_name,location,search_type,budget_range,profile_image,preferred_areas,family_size,pet_friendly,move_in_date,employment_status,monthly_income,verified,email_verified,rating,review_count,created_at,updated_at')
    .eq('id', user.id)
    .single();

  if (error) {
    logger.error('Error obteniendo perfil:', error);

    // Si es error 406, intentar con menos campos
    if (error.code === 'PGRST406') {
      const { data: basicData, error: basicError } = await supabase
        .from('users')
        .select('id,name,email,user_type,created_at')
        .eq('id', user.id)
        .single();

      if (basicError) {
        throw new Error('Error al obtener el perfil');
      }

      return NextResponse.json({ user: basicData });
    }

    throw new Error('Error al obtener el perfil');
  }

  return NextResponse.json({ user: data });
}

// Exportar handlers con middleware de error
export const PUT = withErrorHandler(handleProfileUpdate);
export const PATCH = withErrorHandler(handleProfileUpdate);
export const GET = withErrorHandler(handleProfileGet);
