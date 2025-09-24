import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createFeaturePreference } from '@/lib/mercadopago/helpers';
import { isMPAvailable, logMPConfig } from '@/lib/mercadopago/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST /api/payments/feature iniciado');

    // Verificar autenticación
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar configuración de MercadoPago
    if (!isMPAvailable()) {
      console.log('⚠️ MercadoPago no disponible');
      logMPConfig();
      return NextResponse.json(
        { error: 'Servicio de pagos no disponible' },
        { status: 503 }
      );
    }

    // Parsear body
    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId requerido' },
        { status: 400 }
      );
    }

    // Verificar que la propiedad existe y pertenece al usuario
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, user_id, featured, featured_expires')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single();

    if (propertyError || !property) {
      console.log('❌ Propiedad no encontrada o no autorizada:', propertyError);
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya está destacada y activa
    if (property.featured && property.featured_expires) {
      const expiresAt = new Date(property.featured_expires);
      if (expiresAt > new Date()) {
        return NextResponse.json(
          { 
            error: 'La propiedad ya está destacada',
            expiresAt: expiresAt.toISOString()
          },
          { status: 400 }
        );
      }
    }

    // Crear preferencia de MercadoPago
    const preference = await createFeaturePreference({
      userId: user.id,
      propertyId: propertyId,
      amount: 999, // $999 ARS por 30 días
      propertyTitle: property.title
    });

    console.log('✅ Preferencia creada exitosamente:', preference.preferenceId);

    return NextResponse.json({
      success: true,
      preferenceId: preference.preferenceId,
      initPoint: preference.initPoint,
      paymentId: preference.paymentId,
      amount: 999,
      currency: 'ARS',
      description: 'Destacar anuncio por 30 días'
    });

  } catch (error) {
    console.error('❌ Error en POST /api/payments/feature:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET para obtener estado de destacados del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener propiedades destacadas del usuario
    const { data: featuredProperties, error } = await supabase
      .from('properties')
      .select('id, title, featured, featured_expires')
      .eq('user_id', user.id)
      .eq('featured', true);

    if (error) {
      console.error('Error obteniendo propiedades destacadas:', error);
      return NextResponse.json(
        { error: 'Error obteniendo datos' },
        { status: 500 }
      );
    }

    // Filtrar solo las que no han expirado
    const activeFeatured = (featuredProperties || []).filter(prop => {
      if (!prop.featured_expires) return false;
      return new Date(prop.featured_expires) > new Date();
    });

    return NextResponse.json({
      success: true,
      featuredProperties: activeFeatured,
      count: activeFeatured.length
    });

  } catch (error) {
    console.error('❌ Error en GET /api/payments/feature:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
