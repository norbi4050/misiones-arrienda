import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAgencySubscriptionPreference } from '@/lib/mercadopago/helpers';
import { isMPAvailable, logMPConfig } from '@/lib/mercadopago/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST /api/payments/subscription iniciado');

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
    const { plan = 'AGENCY_BASIC' } = body;

    if (!['AGENCY_BASIC', 'AGENCY_PRO'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plan inválido. Debe ser AGENCY_BASIC o AGENCY_PRO' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene suscripción activa
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, plan, status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      const periodEnd = new Date(existingSubscription.current_period_end);
      if (periodEnd > new Date()) {
        return NextResponse.json(
          { 
            error: 'Ya tienes una suscripción activa',
            currentPlan: existingSubscription.plan,
            expiresAt: periodEnd.toISOString()
          },
          { status: 400 }
        );
      }
    }

    // Crear preferencia de MercadoPago
    const preference = await createAgencySubscriptionPreference({
      userId: user.id,
      plan: plan as 'AGENCY_BASIC' | 'AGENCY_PRO'
    });

    const planPrices = {
      'AGENCY_BASIC': 2999,
      'AGENCY_PRO': 4999
    };

    console.log('✅ Preferencia de suscripción creada:', preference.preferenceId);

    return NextResponse.json({
      success: true,
      preferenceId: preference.preferenceId,
      initPoint: preference.initPoint,
      subscriptionId: preference.subscriptionId,
      plan: plan,
      amount: planPrices[plan as keyof typeof planPrices],
      currency: 'ARS',
      description: `Plan ${plan === 'AGENCY_BASIC' ? 'Agencia Básico' : 'Agencia Pro'} - Mensual`
    });

  } catch (error) {
    console.error('❌ Error en POST /api/payments/subscription:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET para obtener estado de suscripción del usuario
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

    // Obtener suscripción activa del usuario
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error obteniendo suscripción:', error);
      return NextResponse.json(
        { error: 'Error obteniendo datos' },
        { status: 500 }
      );
    }

    // Verificar si la suscripción está realmente activa
    let isActive = false;
    if (subscription && subscription.status === 'ACTIVE') {
      const periodEnd = new Date(subscription.current_period_end);
      isActive = periodEnd > new Date();
    }

    // Obtener estadísticas del usuario
    const { data: propertiesCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .in('status', ['PUBLISHED', 'DRAFT']);

    const { data: featuredCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('featured', true)
      .gt('featured_expires', new Date().toISOString());

    return NextResponse.json({
      success: true,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        isActive: isActive,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        createdAt: subscription.created_at
      } : null,
      stats: {
        totalProperties: propertiesCount?.length || 0,
        featuredProperties: featuredCount?.length || 0,
        canPublishMore: isActive || (propertiesCount?.length || 0) === 0
      },
      plans: {
        'AGENCY_BASIC': {
          name: 'Plan Agencia Básico',
          price: 2999,
          currency: 'ARS',
          features: [
            'Hasta 10 propiedades',
            'Destacados incluidos',
            'Badge "Agencia"',
            'Soporte prioritario'
          ]
        },
        'AGENCY_PRO': {
          name: 'Plan Agencia Pro',
          price: 4999,
          currency: 'ARS',
          features: [
            'Propiedades ilimitadas',
            'Destacados incluidos',
            'Analytics avanzados',
            'Badge "Agencia Pro"',
            'Soporte premium'
          ]
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/payments/subscription:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE para cancelar suscripción
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Buscar suscripción activa
    const { data: subscription, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (findError || !subscription) {
      return NextResponse.json(
        { error: 'No tienes una suscripción activa' },
        { status: 404 }
      );
    }

    // Cancelar suscripción (marcar como cancelada al final del período)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error cancelando suscripción:', updateError);
      return NextResponse.json(
        { error: 'Error cancelando suscripción' },
        { status: 500 }
      );
    }

    console.log('✅ Suscripción cancelada:', subscription.id);

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada. Seguirás teniendo acceso hasta el final del período actual.',
      endsAt: subscription.current_period_end
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/payments/subscription:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
