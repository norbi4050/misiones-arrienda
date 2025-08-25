import { MercadoPagoConfig, Preference } from 'mercadopago'

// Configuración de MercadoPago con credenciales reales
const client = new MercadoPagoConfig({
  accessToken: 'APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419',
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
})

// Configuración de credenciales
export const MERCADOPAGO_CONFIG = {
  publicKey: 'APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5',
  accessToken: 'APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419',
  clientId: '3647290553297438',
  clientSecret: 'ENlqoDJIZ0fffS8QftXGYfvePfMDd8NO'
}

// Cliente de preferencias
const preference = new Preference(client)

// Función para crear una preferencia de pago
export async function createPaymentPreference(data: {
  title: string
  description: string
  price: number
  quantity: number
  propertyId: string
  userEmail: string
  userName: string
}) {
  try {
    const preferenceData = {
      items: [
        {
          id: data.propertyId,
          title: data.title,
          description: data.description,
          quantity: data.quantity,
          unit_price: data.price,
          currency_id: 'ARS'
        }
      ],
      payer: {
        email: data.userEmail,
        name: data.userName
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/pending`
      },
      auto_return: 'approved' as const,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/webhook`,
      external_reference: data.propertyId,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      }
    }

    const response = await preference.create({ body: preferenceData })
    return response
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error)
    throw error
  }
}

// Función para obtener información de un pago
export async function getPaymentInfo(paymentId: string) {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_CONFIG.accessToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment info')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching payment info:', error)
    throw error
  }
}

// Función para verificar el estado de un pago
export async function verifyPayment(paymentId: string) {
  try {
    const paymentInfo = await getPaymentInfo(paymentId)
    
    return {
      id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      transaction_amount: paymentInfo.transaction_amount,
      currency_id: paymentInfo.currency_id,
      date_created: paymentInfo.date_created,
      date_approved: paymentInfo.date_approved,
      payer: paymentInfo.payer,
      external_reference: paymentInfo.external_reference
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

// Tipos para TypeScript
export interface PaymentPreferenceData {
  title: string
  description: string
  price: number
  quantity: number
  propertyId: string
  userEmail: string
  userName: string
}

export interface PaymentStatus {
  id: string
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  status_detail: string
  transaction_amount: number
  currency_id: string
  date_created: string
  date_approved?: string
  payer: {
    email: string
    identification?: {
      type: string
      number: string
    }
  }
  external_reference: string
}

export default client
