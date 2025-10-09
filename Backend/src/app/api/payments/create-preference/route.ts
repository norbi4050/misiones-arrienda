import { NextRequest, NextResponse } from 'next/server';
import { preference, MP_CONFIG } from '@/lib/mercadopago/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { items, payer, back_urls, metadata, propertyId, amount, title, description, userEmail, userName } = await req.json();

    // Si viene en el formato nuevo (items, payer, etc.)
    if (items && payer) {
      const preferenceData = {
        items: items ?? [{ 
          title: "Destacado 7 días", 
          quantity: 1, 
          unit_price: 4999,
          currency_id: 'ARS'
        }],
        payer,
        back_urls: back_urls ?? {
          success: MP_CONFIG.successUrl,
          failure: MP_CONFIG.failureUrl,
          pending: MP_CONFIG.pendingUrl,
        },
        auto_return: 'approved' as const,
        notification_url: MP_CONFIG.notificationUrl,
        metadata: { ...metadata, site: "misionesarrienda" },
      };

      const response = await preference.create({ body: preferenceData });

      return NextResponse.json({ 
        id: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point
      });
    }

    // Si viene en el formato legacy (propertyId, amount, etc.)
    if (propertyId && amount && title && userEmail && userName) {
      const preferenceData = {
        items: [
          {
            id: propertyId,
            title,
            description: description || `Pago por propiedad: ${title}`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'ARS'
          }
        ],
        payer: {
          email: userEmail,
          name: userName
        },
        back_urls: {
          success: MP_CONFIG.successUrl,
          failure: MP_CONFIG.failureUrl,
          pending: MP_CONFIG.pendingUrl,
        },
        auto_return: 'approved' as const,
        notification_url: MP_CONFIG.notificationUrl,
        external_reference: propertyId,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        }
      };

      const response = await preference.create({ body: preferenceData });

      return NextResponse.json({
        success: true,
        preference: {
          id: response.id,
          init_point: response.init_point,
          sandbox_init_point: response.sandbox_init_point,
          items: response.items
        }
      });
    }

    return NextResponse.json(
      { error: 'Faltan parámetros requeridos' },
      { status: 400 }
    );

  } catch (err: any) {
    console.error('Error creating MercadoPago preference:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
