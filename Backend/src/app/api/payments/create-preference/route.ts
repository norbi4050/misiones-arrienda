import { NextRequest, NextResponse } from 'next/server';
import { createPaymentPreference } from '@/lib/mercadopago';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { propertyId, amount, title, description, userEmail, userName } = await request.json();

    // Validate required fields
    if (!propertyId || !amount || !title || !userEmail || !userName) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: propertyId, amount, title, userEmail, userName' },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número positivo' },
        { status: 400 }
      );
    }

    // Create MercadoPago preference with real credentials
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
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago' },
      { status: 500 }
    );
  }
}

// GET endpoint to verify payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID de pago requerido' },
        { status: 400 }
      );
    }

    // Here you can verify the payment with MercadoPago
    // and update your database accordingly
    
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentId,
        status,
        external_reference: externalReference
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Error al verificar el pago' },
      { status: 500 }
    );
  }
}
