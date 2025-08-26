import { NextRequest, NextResponse } from 'next/server';
import { createPaymentPreference } from '@/lib/mercadopago';

export const runtime = 'nodejs';
// `dynamic` acá es opcional; los route handlers ya son dinámicos por defecto.
// `revalidate` no tiene efecto en handlers, podés omitirlo.

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
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`,
        },
        auto_return: 'approved' as const,
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
        metadata: { ...metadata, site: "misionesarrienda" },
      };

      // Aquí usaríamos directamente MercadoPago SDK si estuviera disponible
      // Por ahora, devolvemos un mock response
      return NextResponse.json({ 
        id: 'mock-preference-id',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock-preference-id',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock-preference-id'
      });
    }

    // Si viene en el formato legacy (propertyId, amount, etc.)
    if (propertyId && amount && title && userEmail && userName) {
      const preference = await createPaymentPreference({
        title,
        description: description || `Pago por propiedad: ${title}`,
        price: amount,
        quantity: 1,
        propertyId,
        userEmail,
        userName
      });

      return NextResponse.json({
        success: true,
        preference: {
          id: preference.id,
          init_point: preference.init_point,
          sandbox_init_point: preference.sandbox_init_point,
          items: preference.items
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
