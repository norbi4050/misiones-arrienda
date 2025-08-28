// =====================================================
// EDGE FUNCTION: PROCESS PAYMENT
// Procesa webhooks de MercadoPago y actualiza pagos
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtener datos del webhook de MercadoPago
    const webhookData = await req.json()
    
    console.log('💳 Processing MercadoPago webhook:', {
      type: webhookData.type,
      action: webhookData.action,
      data_id: webhookData.data?.id
    })

    // Crear cliente Supabase con service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Registrar notificación del webhook
    const { data: notification, error: notificationError } = await supabase
      .from('PaymentNotification')
      .insert({
        mercadopagoId: webhookData.data?.id || 'unknown',
        topic: webhookData.topic || 'payment',
        type: webhookData.type || 'payment',
        status: 'PENDING',
        attempts: 1,
        webhookData: JSON.stringify(webhookData)
      })
      .select()
      .single()

    if (notificationError) {
      console.error('❌ Error creating notification:', notificationError)
    } else {
      console.log('✅ Webhook notification created:', notification.id)
    }

    // Procesar según el tipo de webhook
    let result = { success: false, message: 'Unknown webhook type' }

    switch (webhookData.type) {
      case 'payment':
        result = await processPaymentWebhook(supabase, webhookData)
        break
      case 'merchant_order':
        result = await processMerchantOrderWebhook(supabase, webhookData)
        break
      default:
        console.log('⚠️ Unhandled webhook type:', webhookData.type)
        result = { success: true, message: 'Webhook type not processed' }
    }

    // Actualizar estado de la notificación
    if (notification) {
      await supabase
        .from('PaymentNotification')
        .update({
          status: result.success ? 'PROCESSED' : 'FAILED',
          errorMessage: result.success ? null : result.message,
          processedAt: new Date().toISOString()
        })
        .eq('id', notification.id)
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.message,
        webhook_type: webhookData.type,
        processed_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Error in process-payment function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  }
})

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function processPaymentWebhook(supabase: any, webhookData: any) {
  try {
    const paymentId = webhookData.data?.id
    
    if (!paymentId) {
      return { success: false, message: 'No payment ID in webhook' }
    }

    console.log('💰 Processing payment webhook for ID:', paymentId)

    // TODO: Obtener detalles del pago desde MercadoPago API
    // const paymentDetails = await fetchPaymentFromMercadoPago(paymentId)
    
    // Por ahora simulamos los datos del pago
    const mockPaymentDetails = {
      id: paymentId,
      status: webhookData.action === 'payment.created' ? 'pending' : 'approved',
      status_detail: 'accredited',
      external_reference: `property_${Date.now()}`,
      transaction_amount: 1000,
      currency_id: 'ARS',
      payer: {
        email: 'user@example.com',
        first_name: 'Usuario',
        last_name: 'Ejemplo'
      },
      payment_method_id: 'visa',
      payment_type_id: 'credit_card',
      installments: 1,
      date_created: new Date().toISOString(),
      date_approved: webhookData.action === 'payment.approved' ? new Date().toISOString() : null
    }

    // Buscar pago existente en la base de datos
    const { data: existingPayment } = await supabase
      .from('Payment')
      .select('*')
      .eq('mercadopagoId', paymentId)
      .single()

    if (existingPayment) {
      // Actualizar pago existente
      const { error: updateError } = await supabase
        .from('Payment')
        .update({
          status: mockPaymentDetails.status,
          statusDetail: mockPaymentDetails.status_detail,
          dateLastUpdated: new Date().toISOString(),
          dateApproved: mockPaymentDetails.date_approved,
          webhookData: JSON.stringify(webhookData)
        })
        .eq('mercadopagoId', paymentId)

      if (updateError) {
        console.error('❌ Error updating payment:', updateError)
        return { success: false, message: 'Failed to update payment' }
      }

      console.log('✅ Payment updated successfully')

      // Si el pago fue aprobado, activar suscripción
      if (mockPaymentDetails.status === 'approved') {
        await activateSubscription(supabase, existingPayment.subscriptionId)
      }

    } else {
      console.log('⚠️ Payment not found in database, creating new record')
      
      // Crear nuevo registro de pago (esto normalmente no debería pasar)
      const { error: createError } = await supabase
        .from('Payment')
        .insert({
          mercadopagoId: paymentId,
          externalReference: mockPaymentDetails.external_reference,
          amount: mockPaymentDetails.transaction_amount,
          currency: mockPaymentDetails.currency_id,
          status: mockPaymentDetails.status,
          statusDetail: mockPaymentDetails.status_detail,
          paymentMethodId: mockPaymentDetails.payment_method_id,
          paymentTypeId: mockPaymentDetails.payment_type_id,
          installments: mockPaymentDetails.installments,
          dateCreated: mockPaymentDetails.date_created,
          dateApproved: mockPaymentDetails.date_approved,
          payerEmail: mockPaymentDetails.payer.email,
          payerName: `${mockPaymentDetails.payer.first_name} ${mockPaymentDetails.payer.last_name}`,
          webhookData: JSON.stringify(webhookData),
          userId: 'unknown', // Esto debería obtenerse del external_reference
          propertyId: 'unknown' // Esto debería obtenerse del external_reference
        })

      if (createError) {
        console.error('❌ Error creating payment:', createError)
        return { success: false, message: 'Failed to create payment' }
      }
    }

    // Registrar evento en analytics
    await supabase
      .from('Analytics')
      .insert({
        event_type: 'payment_webhook_processed',
        user_id: existingPayment?.userId || 'unknown',
        metadata: {
          payment_id: paymentId,
          status: mockPaymentDetails.status,
          webhook_action: webhookData.action,
          amount: mockPaymentDetails.transaction_amount
        }
      })

    return { success: true, message: 'Payment webhook processed successfully' }

  } catch (error) {
    console.error('❌ Error processing payment webhook:', error)
    return { success: false, message: error.message }
  }
}

async function processMerchantOrderWebhook(supabase: any, webhookData: any) {
  try {
    console.log('🛒 Processing merchant order webhook')
    
    // TODO: Implementar lógica para merchant orders
    // Por ahora solo loggeamos
    console.log('Merchant order data:', webhookData)

    return { success: true, message: 'Merchant order webhook logged' }

  } catch (error) {
    console.error('❌ Error processing merchant order webhook:', error)
    return { success: false, message: error.message }
  }
}

async function activateSubscription(supabase: any, subscriptionId: string) {
  if (!subscriptionId) {
    console.log('⚠️ No subscription ID provided')
    return
  }

  try {
    console.log('🔄 Activating subscription:', subscriptionId)

    // Actualizar suscripción a activa
    const { error: subscriptionError } = await supabase
      .from('Subscription')
      .update({
        status: 'ACTIVE',
        startDate: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (subscriptionError) {
      console.error('❌ Error activating subscription:', subscriptionError)
      return
    }

    // Obtener datos de la suscripción para activar la propiedad
    const { data: subscription } = await supabase
      .from('Subscription')
      .select('propertyId, planType, endDate')
      .eq('id', subscriptionId)
      .single()

    if (subscription) {
      // Activar propiedad según el plan
      const propertyUpdates: any = {
        isPaid: true,
        expiresAt: subscription.endDate
      }

      if (subscription.planType === 'featured' || subscription.planType === 'premium') {
        propertyUpdates.featured = true
        propertyUpdates.highlightedUntil = subscription.endDate
      }

      await supabase
        .from('Property')
        .update(propertyUpdates)
        .eq('id', subscription.propertyId)

      console.log('✅ Property activated with plan:', subscription.planType)
    }

    console.log('✅ Subscription activated successfully')

  } catch (error) {
    console.error('❌ Error activating subscription:', error)
  }
}

/* Deno.serve */
