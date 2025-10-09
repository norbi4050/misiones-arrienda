import { preference } from './client';
import { MP_CONFIG } from './client';
import { createClient } from '@/lib/supabase/server';

// Tipos para las preferencias
interface CreateFeaturePreferenceParams {
  userId: string;
  propertyId: string;
  amount: number;
  propertyTitle?: string;
}

interface CreateAgencySubscriptionPreferenceParams {
  userId: string;
  plan?: 'AGENCY_BASIC' | 'AGENCY_PRO';
}

/**
 * Crear preferencia para destacar anuncio (pago one-off)
 */
export async function createFeaturePreference({
  userId,
  propertyId,
  amount,
  propertyTitle = 'Destacar Anuncio'
}: CreateFeaturePreferenceParams) {
  try {
    console.log('🔧 Creando preferencia FEATURE:', { userId, propertyId, amount });

    // Crear registro en DB primero (status PENDING)
    const supabase = createClient();
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert([{
        user_id: userId,
        property_id: propertyId,
        type: 'FEATURE',
        status: 'PENDING',
        amount: amount,
        currency: 'ARS',
        meta: {
          property_title: propertyTitle,
          created_via: 'feature_preference'
        }
      }])
      .select()
      .single();

    if (dbError || !paymentRecord) {
      console.error('❌ Error creando payment record:', dbError);
      throw new Error('Error creando registro de pago');
    }

    // Crear preferencia en MercadoPago
    const preferenceData = {
      items: [
        {
          id: `feature-${propertyId}`,
          title: `Destacar: ${propertyTitle}`,
          description: 'Destacar anuncio por 30 días en Misiones Arrienda',
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: 'user@example.com' // Se puede obtener del perfil del usuario
      },
      back_urls: {
        success: MP_CONFIG.successUrl,
        failure: MP_CONFIG.failureUrl,
        pending: MP_CONFIG.pendingUrl
      },
      auto_return: 'approved' as const,
      notification_url: MP_CONFIG.notificationUrl,
      external_reference: paymentRecord.id, // Usar ID del payment para tracking
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      metadata: {
        user_id: userId,
        property_id: propertyId,
        payment_id: paymentRecord.id,
        type: 'FEATURE'
      }
    };

    const mpPreference = await preference.create({ body: preferenceData });

    if (!mpPreference.id) {
      throw new Error('Error creando preferencia en MercadoPago');
    }

    // Actualizar payment record con preference_id
    await supabase
      .from('payments')
      .update({
        meta: {
          ...paymentRecord.meta,
          preference_id: mpPreference.id,
          init_point: mpPreference.init_point
        }
      })
      .eq('id', paymentRecord.id);

    console.log('✅ Preferencia FEATURE creada:', mpPreference.id);

    return {
      success: true,
      preferenceId: mpPreference.id,
      initPoint: mpPreference.init_point,
      paymentId: paymentRecord.id
    };

  } catch (error) {
    console.error('❌ Error en createFeaturePreference:', error);
    throw error;
  }
}

/**
 * Crear preferencia para suscripción agencia
 */
export async function createAgencySubscriptionPreference({
  userId,
  plan = 'AGENCY_BASIC'
}: CreateAgencySubscriptionPreferenceParams) {
  try {
    console.log('🔧 Creando preferencia SUBSCRIPTION:', { userId, plan });

    const planPrices = {
      'AGENCY_BASIC': 2999,
      'AGENCY_PRO': 4999
    };

    const planDescriptions = {
      'AGENCY_BASIC': 'Plan Agencia Básico - Hasta 10 propiedades + destacados incluidos',
      'AGENCY_PRO': 'Plan Agencia Pro - Propiedades ilimitadas + analytics'
    };

    const amount = planPrices[plan];

    // Crear registro en DB primero
    const supabase = createClient();
    const { data: subscriptionRecord, error: dbError } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: userId,
        plan: plan,
        status: 'ACTIVE', // Se activará cuando se confirme el pago
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        meta: {
          created_via: 'subscription_preference'
        }
      }])
      .select()
      .single();

    if (dbError || !subscriptionRecord) {
      console.error('❌ Error creando subscription record:', dbError);
      throw new Error('Error creando registro de suscripción');
    }

    // Crear preferencia en MercadoPago
    const preferenceData = {
      items: [
        {
          id: `subscription-${plan.toLowerCase()}`,
          title: `${plan === 'AGENCY_BASIC' ? 'Plan Agencia Básico' : 'Plan Agencia Pro'}`,
          description: planDescriptions[plan],
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: 'user@example.com'
      },
      back_urls: {
        success: MP_CONFIG.successUrl,
        failure: MP_CONFIG.failureUrl,
        pending: MP_CONFIG.pendingUrl
      },
      auto_return: 'approved' as const,
      notification_url: MP_CONFIG.notificationUrl,
      external_reference: subscriptionRecord.id,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        user_id: userId,
        subscription_id: subscriptionRecord.id,
        plan: plan,
        type: 'SUBSCRIPTION'
      }
    };

    const mpPreference = await preference.create({ body: preferenceData });

    if (!mpPreference.id) {
      throw new Error('Error creando preferencia de suscripción en MercadoPago');
    }

    // Actualizar subscription record con preference_id
    await supabase
      .from('subscriptions')
      .update({
        meta: {
          ...subscriptionRecord.meta,
          preference_id: mpPreference.id,
          init_point: mpPreference.init_point
        }
      })
      .eq('id', subscriptionRecord.id);

    console.log('✅ Preferencia SUBSCRIPTION creada:', mpPreference.id);

    return {
      success: true,
      preferenceId: mpPreference.id,
      initPoint: mpPreference.init_point,
      subscriptionId: subscriptionRecord.id
    };

  } catch (error) {
    console.error('❌ Error en createAgencySubscriptionPreference:', error);
    throw error;
  }
}

/**
 * Obtener información de un pago desde MercadoPago
 */
export async function getPaymentInfo(paymentId: string) {
  try {
    const { payment } = await import('./client');
    const paymentInfo = await payment.get({ id: paymentId });
    return paymentInfo;
  } catch (error) {
    console.error('❌ Error obteniendo info de pago:', error);
    throw error;
  }
}

/**
 * Validar webhook signature (seguridad)
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('❌ Error validando webhook signature:', error);
    return false;
  }
}

/**
 * Procesar efectos de pago aprobado
 */
export async function processPaymentEffects(paymentData: any) {
  try {
    const supabase = createClient();
    
    if (paymentData.metadata?.type === 'FEATURE') {
      // Destacar anuncio por 30 días
      const propertyId = paymentData.metadata.property_id;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await supabase
        .from('properties')
        .update({
          featured: true,
          featured_expires: expiresAt.toISOString()
        })
        .eq('id', propertyId);
        
      console.log('✅ Anuncio destacado:', propertyId, 'hasta', expiresAt);
      
    } else if (paymentData.metadata?.type === 'SUBSCRIPTION') {
      // Activar suscripción
      const subscriptionId = paymentData.metadata.subscription_id;
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'ACTIVE'
        })
        .eq('id', subscriptionId);
        
      console.log('✅ Suscripción activada:', subscriptionId);
    }
    
  } catch (error) {
    console.error('❌ Error procesando efectos de pago:', error);
    throw error;
  }
}
