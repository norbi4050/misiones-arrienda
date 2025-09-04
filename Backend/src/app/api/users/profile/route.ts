import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autorizado - Sesión inválida' },
        { status: 401 }
      );
    }

    // Obtener perfil del usuario
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error obteniendo perfil:', error);
      return NextResponse.json(
        { error: 'Error obteniendo perfil de usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error en API profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autorizado - Sesión inválida' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone, bio } = body;

    // Actualizar perfil del usuario
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({
        name,
        email,
        phone,
        bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando perfil:', error);
      return NextResponse.json(
        { error: 'Error actualizando perfil de usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Perfil actualizado exitosamente',
      profile: updatedProfile 
    });
  } catch (error) {
    console.error('Error en API profile PUT:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}