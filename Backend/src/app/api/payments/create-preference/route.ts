import { NextRequest, NextResponse } from 'next/server';
import { createPaymentPreference } from '@/lib/mercadopago';

export async function POST(request: NextRequest) {
  try {
    const { planId, propertyId, userId } = await request.json();

    if (!planId || !propertyId || !userId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const preference = await createPaymentPreference(planId, propertyId, userId);

    return NextResponse.json(preference);
  } catch (error) {
    console.error('Error creating payment preference:', error);
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago' },
      { status: 500 }
    );
  }
}
