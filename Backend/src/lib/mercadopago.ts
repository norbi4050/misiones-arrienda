import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configuración de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN',
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

export interface PlanData {
  id: string;
  name: string;
  price: number;
  duration: number; // días
  features: string[];
}

export const PLANS: Record<string, PlanData> = {
  basico: {
    id: 'basico',
    name: 'Plan Básico',
    price: 0,
    duration: 30,
    features: ['Publicación básica', 'Hasta 5 fotos', 'Descripción completa']
  },
  destacado: {
    id: 'destacado',
    name: 'Plan Destacado',
    price: 5000,
    duration: 30,
    features: ['Todo del plan básico', 'Badge "Destacado"', 'Aparece primero', 'Hasta 10 fotos']
  },
  full: {
    id: 'full',
    name: 'Plan Full',
    price: 10000,
    duration: 30,
    features: ['Todo del plan destacado', 'Video promocional', 'Agente asignado', 'Fotos ilimitadas']
  }
};

export async function createPaymentPreference(
  planId: string,
  propertyId: string,
  userId: string
) {
  const plan = PLANS[planId];
  
  if (!plan) {
    throw new Error('Plan no encontrado');
  }

  // Si es plan básico (gratis), no crear preferencia de pago
  if (plan.price === 0) {
    return {
      isFreePlan: true,
      planId,
      message: 'Plan básico activado gratuitamente'
    };
  }

  try {
    const preference = new Preference(client);

    const preferenceData = {
      items: [
        {
          id: planId,
          title: `${plan.name} - Misiones Arrienda`,
          description: `Suscripción mensual al ${plan.name} para destacar tu propiedad`,
          quantity: 1,
          unit_price: plan.price,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: 'test@example.com' // En producción, usar email real del usuario
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?plan=${planId}&property=${propertyId}`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: `${userId}-${propertyId}-${planId}`,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    const result = await preference.create({ body: preferenceData });
    
    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
      planId,
      amount: plan.price
    };
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    throw new Error('Error al crear la preferencia de pago');
  }
}

export async function verifyPayment(paymentId: string) {
  try {
    // En una implementación real, verificarías el pago con la API de MercadoPago
    // Por ahora, simulamos la verificación
    return {
      status: 'approved',
      paymentId,
      amount: 5000,
      planId: 'destacado'
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error('Error al verificar el pago');
  }
}

export function calculatePlanExpiration(planId: string): Date {
  const plan = PLANS[planId];
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + plan.duration);
  return expirationDate;
}
