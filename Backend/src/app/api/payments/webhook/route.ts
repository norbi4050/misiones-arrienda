import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentInfo, validateWebhookSignature, processPaymentEffects } from '@/lib/mercadopago/helpers';
import { MP_CONFIG } from '@/lib/mercadopago/client';

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook MercadoPago recibido');

    // Obtener headers y body
    const signature = request.headers.get('x-signature') || '';
    const body = await request.text();
    
    console.log('📋 Webhook headers:', {
      signature: signature ? '***' : 'missing',
      contentType: request.headers.get('content-type'),
      userAgent: request.headers.get('user-agent')
    });

    // Validar firma (si está configurada)
    if (MP_CONFIG.webhookSecret && signature) {
      const isValid = validateWebhookSignature(body, signature, MP_CONFIG.webhookSecret);
      if (!isValid) {
        console.log('❌ Firma de webhook inválida');
        return NextResponse.json(
          { error: 'Firma inválida' },
          { status: 401 }
        );
      }
      console.log('✅ Firma de webhook válida');
    } else {
      console.log('⚠️ Webhook sin validación de firma (desarrollo)');
    }

    // Parsear payload
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('❌ Error parseando webhook JSON:', error);
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    console.log('📦 Webhook data:', {
      id: webhookData.id,
      type: webhookData.type,
      action: webhookData.action,
      data_id: webhookData.data?.id
    });

    // Procesar solo notificaciones de payment
    if (webhookData.type !== 'payment') {
      console.log('ℹ️ Webhook ignorado (no es payment):', webhookData.type);
      return NextResponse.json({ received: true });
    }

    const paymentId = webhookData.data?.id;
    if (!paymentId) {
      console.log('❌ Payment ID no encontrado en webhook');
      return NextResponse.json(
        { error: 'Payment ID requerido' },
        { status: 400 }
      );
    }

    // Obtener información del pago desde MercadoPago
    console.log('🔍 Consultando pago en MercadoPago:', paymentId);
    const paymentInfo = await getPaymentInfo(paymentId);

    if (!paymentInfo) {
      console.log('❌ Pago no encontrado en MercadoPago');
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    console.log('💳 Info del pago:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      external_reference: paymentInfo.external_reference,
      transaction_amount: paymentInfo.transaction_amount
    });

    // Usar service role para bypass RLS
    const supabase = createClient();

    // Buscar el payment record por external_reference
    const externalRef = paymentInfo.external_reference;
    if (!externalRef) {
      console.log('❌ External reference no encontrado');
      return NextResponse.json(
        { error: 'External reference requerido' },
        { status: 400 }
      );
    }

    // Determinar si es payment o subscription por el external_reference
    let recordType: 'payment' | 'subscription' = 'payment';
    let record: any = null;

    // Intentar buscar en payments primero
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', externalRef)
      .single();

    if (paymentRecord) {
      recordType = 'payment';
      record = paymentRecord;
    } else {
      // Buscar en subscriptions
      const { data: subscriptionRecord, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', externalRef)
        .single();

      if (subscriptionRecord) {
        recordType = 'subscription';
        record = subscriptionRecord;
      }
    }

    if (!record) {
      console.log('❌ Registro no encontrado para external_reference:', externalRef);
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    console.log('📋 Registro encontrado:', {
      type: recordType,
      id: record.id,
      currentStatus: record.status
    });

    // Mapear status de MercadoPago a nuestro sistema
    const statusMap: { [key: string]: string } = {
      'approved': 'APPROVED',
      'pending': 'PENDING',
      'rejected': 'REJECTED',
      'cancelled': 'CANCELLED',
      'refunded': 'REJECTED'
    };

    const newStatus = statusMap[paymentInfo.status || 'pending'] || 'PENDING';
    console.log('🔄 Actualizando status:', paymentInfo.status, '→', newStatus);

    // Actualizar registro en DB
    if (recordType === 'payment') {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: newStatus,
          provider_payment_id: paymentInfo.id?.toString(),
          meta: {
            ...record.meta,
            mp_payment_info: {
              status: paymentInfo.status,
              status_detail: paymentInfo.status_detail,
              transaction_amount: paymentInfo.transaction_amount,
              currency_id: paymentInfo.currency_id,
              date_approved: paymentInfo.date_approved,
              payment_method_id: paymentInfo.payment_method_id
            },
            webhook_processed_at: new Date().toISOString()
          }
        })
        .eq('id', record.id);

      if (updateError) {
        console.error('❌ Error actualizando payment:', updateError);
        throw updateError;
      }

    } else {
      // Actualizar subscription
      const updateData: any = {
        meta: {
          ...record.meta,
          mp_payment_info: {
            payment_id: paymentInfo.id,
            status: paymentInfo.status,
            transaction_amount: paymentInfo.transaction_amount,
            date_approved: paymentInfo.date_approved
          },
          webhook_processed_at: new Date().toISOString()
        }
      };

      // Si el pago fue aprobado, activar suscripción
      if (newStatus === 'APPROVED') {
        updateData.status = 'ACTIVE';
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', record.id);

      if (updateError) {
        console.error('❌ Error actualizando subscription:', updateError);
        throw updateError;
      }
    }

    // Procesar efectos si el pago fue aprobado
    if (newStatus === 'APPROVED') {
      console.log('✅ Pago aprobado, procesando efectos...');
      
      try {
        if (recordType === 'payment' && record.type === 'FEATURE') {
          // Destacar anuncio por 30 días
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          
          const { error: featureError } = await supabase
            .from('properties')
            .update({
              featured: true,
              featured_expires: expiresAt.toISOString()
            })
            .eq('id', record.property_id);

          if (featureError) {
            console.error('❌ Error destacando propiedad:', featureError);
          } else {
            console.log('⭐ Propiedad destacada hasta:', expiresAt);
          }

        } else if (recordType === 'subscription') {
          // La suscripción ya se activó arriba
          console.log('🏢 Suscripción activada:', record.plan);
        }

      } catch (effectError) {
        console.error('❌ Error procesando efectos:', effectError);
        // No fallar el webhook por errores en efectos
      }
    }

    console.log('✅ Webhook procesado exitosamente');

    return NextResponse.json({
      success: true,
      processed: true,
      paymentId: paymentInfo.id,
      status: newStatus,
      recordType: recordType,
      recordId: record.id
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    
    // Log detallado para debugging
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Error procesando webhook',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET para testing (solo en desarrollo)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint no disponible en producción' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: 'Webhook MercadoPago endpoint',
    environment: process.env.NODE_ENV,
    config: {
      hasAccessToken: !!MP_CONFIG.accessToken,
      hasWebhookSecret: !!MP_CONFIG.webhookSecret,
      notificationUrl: MP_CONFIG.notificationUrl
    },
    testPayload: {
      type: 'payment',
      action: 'payment.updated',
      data: {
        id: '12345678'
      },
      external_reference: 'test-payment-id'
    }
  });
}
