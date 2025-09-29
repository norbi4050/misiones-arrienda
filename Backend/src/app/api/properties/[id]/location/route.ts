import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';

const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitud inválida'),
  lng: z.number().min(-180).max(180, 'Longitud inválida')
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Validar datos de entrada
    const body = await request.json();
    const validation = locationUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Coordenadas inválidas', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { lat, lng } = validation.data;
    const propertyId = params.id;

    // Verificar ownership de la propiedad
    const { data: property, error: findError } = await supabase
      .from('properties')
      .select('id, user_id')
      .eq('id', propertyId)
      .single();

    if (findError || !property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    if (property.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para editar esta propiedad' }, { status: 403 });
    }

    // Actualizar coordenadas
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({ 
        latitude: lat, 
        longitude: lng, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', propertyId)
      .eq('user_id', user.id) // Doble verificación de seguridad
      .select('id, latitude, longitude, updated_at')
      .single();

    if (updateError) {
      console.error('Error updating property location:', updateError);
      return NextResponse.json({ error: 'Error al actualizar ubicación' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Ubicación actualizada correctamente',
      property: updatedProperty
    });

  } catch (error) {
    console.error('Error in location update API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
