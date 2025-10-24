import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { HEX_COLOR_REGEX, AGENCY_LIMITS } from '@/types/inmobiliaria';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verify user owns this inmobiliaria profile
    if (user.id !== params.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      header_image_url,
      tagline,
      primary_color,
      secondary_color,
      founded_year,
      values,
    } = body;

    // Validate data
    const errors: string[] = [];

    // Validate tagline length
    if (tagline && tagline.length > AGENCY_LIMITS.MAX_TAGLINE_LENGTH) {
      errors.push(`Tagline debe tener máximo ${AGENCY_LIMITS.MAX_TAGLINE_LENGTH} caracteres`);
    }

    // Validate color format
    if (primary_color && !HEX_COLOR_REGEX.test(primary_color)) {
      errors.push('Color primario inválido (formato: #RRGGBB)');
    }

    if (secondary_color && !HEX_COLOR_REGEX.test(secondary_color)) {
      errors.push('Color secundario inválido (formato: #RRGGBB)');
    }

    // Validate founded year
    const currentYear = new Date().getFullYear();
    if (
      founded_year &&
      (founded_year < AGENCY_LIMITS.MIN_FOUNDED_YEAR || founded_year > currentYear)
    ) {
      errors.push(`Año de fundación debe estar entre ${AGENCY_LIMITS.MIN_FOUNDED_YEAR} y ${currentYear}`);
    }

    // Validate values array
    if (values) {
      if (!Array.isArray(values)) {
        errors.push('Values debe ser un array');
      } else {
        if (values.length > AGENCY_LIMITS.MAX_VALUES) {
          errors.push(`Máximo ${AGENCY_LIMITS.MAX_VALUES} valores permitidos`);
        }
        values.forEach((value, index) => {
          if (typeof value !== 'string') {
            errors.push(`Valor ${index + 1} debe ser texto`);
          } else if (value.length > AGENCY_LIMITS.MAX_VALUE_LENGTH) {
            errors.push(`Valor ${index + 1} debe tener máximo ${AGENCY_LIMITS.MAX_VALUE_LENGTH} caracteres`);
          }
        });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: errors },
        { status: 400 }
      );
    }

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        header_image_url,
        tagline,
        primary_color,
        secondary_color,
        founded_year,
        values,
      })
      .eq('id', params.id)
      .eq('user_type', 'inmobiliaria');

    if (updateError) {
      console.error('[API] Error updating customization:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la personalización' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Personalización actualizada correctamente',
    });
  } catch (error) {
    console.error('[API] Error in customization endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current customization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('header_image_url, tagline, primary_color, secondary_color, founded_year, values')
      .eq('id', params.id)
      .eq('user_type', 'inmobiliaria')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Inmobiliaria no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[API] Error fetching customization:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
