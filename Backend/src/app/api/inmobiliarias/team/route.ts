import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AGENCY_LIMITS } from '@/types/inmobiliaria';

export const dynamic = 'force-dynamic';

/**
 * API: Gestión de Equipo de Inmobiliaria
 * 
 * GET /api/inmobiliarias/team?agency_id=xxx
 * - Lista el equipo de una inmobiliaria (público)
 * 
 * POST /api/inmobiliarias/team
 * - Crea un nuevo miembro del equipo (máximo 2 activos)
 * 
 * Uso: Perfil público y Mi Empresa
 */

// GET: Listar equipo de una inmobiliaria
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agencyId = searchParams.get('agency_id');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agency_id es requerido' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Obtener miembros del equipo (solo activos para público)
    const { data: teamMembers, error } = await supabase
      .from('agency_team_members')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error obteniendo equipo:', error);
      return NextResponse.json(
        { error: 'Error al obtener equipo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      team_members: teamMembers || [],
      count: teamMembers?.length || 0,
    });

  } catch (error: any) {
    console.error('Error en GET /api/inmobiliarias/team:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo miembro del equipo
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario es una inmobiliaria
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (userData?.user_type !== 'inmobiliaria') {
      return NextResponse.json(
        { error: 'Solo las inmobiliarias pueden gestionar equipos' },
        { status: 403 }
      );
    }

    // Parsear body
    const body = await request.json();
    const { name, photo_url, display_order } = body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'El nombre no puede exceder 100 caracteres' },
        { status: 400 }
      );
    }

    // Verificar límite de miembros activos (máximo 2)
    const { count: activeCount } = await supabase
      .from('agency_team_members')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', user.id)
      .eq('is_active', true);

    if (activeCount && activeCount >= AGENCY_LIMITS.MAX_TEAM_MEMBERS) {
      return NextResponse.json(
        { 
          error: `Solo puedes tener máximo ${AGENCY_LIMITS.MAX_TEAM_MEMBERS} miembros activos en tu equipo`,
          current_count: activeCount,
          max_allowed: AGENCY_LIMITS.MAX_TEAM_MEMBERS,
        },
        { status: 400 }
      );
    }

    // Crear miembro del equipo
    const { data: newMember, error: insertError } = await supabase
      .from('agency_team_members')
      .insert({
        agency_id: user.id,
        name: name.trim(),
        photo_url: photo_url || null,
        display_order: display_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creando miembro del equipo:', insertError);
      return NextResponse.json(
        { error: 'Error al crear miembro del equipo', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Miembro del equipo creado exitosamente',
      team_member: newMember,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/inmobiliarias/team:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Guardar equipo completo (batch upsert)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que sea inmobiliaria
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (userData?.user_type !== 'inmobiliaria') {
      return NextResponse.json(
        { error: 'Solo las inmobiliarias pueden gestionar equipos' },
        { status: 403 }
      );
    }

    // Parsear body - ahora recibe array de miembros
    const body = await request.json();
    const { team } = body;

    if (!Array.isArray(team)) {
      return NextResponse.json(
        { error: 'Se esperaba un array de miembros del equipo' },
        { status: 400 }
      );
    }

    // Validar cada miembro
    for (const member of team) {
      if (!member.name || member.name.trim().length === 0) {
        return NextResponse.json(
          { error: `El nombre es requerido para todos los miembros activos` },
          { status: 400 }
        );
      }
      if (member.name.length > 100) {
        return NextResponse.json(
          { error: `El nombre no puede exceder 100 caracteres` },
          { status: 400 }
        );
      }
    }

    // Verificar límite de miembros activos
    const activeMembers = team.filter(m => m.is_active);
    if (activeMembers.length > AGENCY_LIMITS.MAX_TEAM_MEMBERS) {
      return NextResponse.json(
        { 
          error: `Solo puedes tener máximo ${AGENCY_LIMITS.MAX_TEAM_MEMBERS} miembros activos`,
          current_count: activeMembers.length,
          max_allowed: AGENCY_LIMITS.MAX_TEAM_MEMBERS,
        },
        { status: 400 }
      );
    }

    // Procesar cada miembro (INSERT o UPDATE)
    const results = [];
    
    for (const member of team) {
      const isNewMember = member.id.startsWith('temp-');
      
      if (isNewMember) {
        // INSERT: Nuevo miembro
        const { data: newMember, error: insertError } = await supabase
          .from('agency_team_members')
          .insert({
            agency_id: user.id,
            name: member.name.trim(),
            photo_url: member.photo_url || null,
            display_order: member.display_order ?? 0,
            is_active: member.is_active ?? true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error insertando miembro:', insertError);
          return NextResponse.json(
            { error: 'Error al crear miembro del equipo', details: insertError.message },
            { status: 500 }
          );
        }

        results.push(newMember);
      } else {
        // UPDATE: Miembro existente
        const { data: updatedMember, error: updateError } = await supabase
          .from('agency_team_members')
          .update({
            name: member.name.trim(),
            photo_url: member.photo_url,
            display_order: member.display_order,
            is_active: member.is_active,
          })
          .eq('id', member.id)
          .eq('agency_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error actualizando miembro:', updateError);
          return NextResponse.json(
            { error: 'Error al actualizar miembro del equipo', details: updateError.message },
            { status: 500 }
          );
        }

        results.push(updatedMember);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Equipo guardado exitosamente',
      team_members: results,
    });

  } catch (error: any) {
    console.error('Error en PUT /api/inmobiliarias/team:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar miembro del equipo
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener ID del miembro a eliminar
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'ID del miembro es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el miembro pertenece a la inmobiliaria autenticada
    const { data: existingMember } = await supabase
      .from('agency_team_members')
      .select('*')
      .eq('id', memberId)
      .eq('agency_id', user.id)
      .single();

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Miembro del equipo no encontrado o no tienes permiso para eliminarlo' },
        { status: 404 }
      );
    }

    // Eliminar miembro (soft delete: marcar como inactivo)
    const { error: deleteError } = await supabase
      .from('agency_team_members')
      .update({ is_active: false })
      .eq('id', memberId)
      .eq('agency_id', user.id);

    if (deleteError) {
      console.error('Error eliminando miembro del equipo:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar miembro del equipo', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Miembro del equipo eliminado exitosamente',
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/inmobiliarias/team:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
