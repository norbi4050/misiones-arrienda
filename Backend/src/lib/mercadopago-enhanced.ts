import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import crypto from 'crypto'

// =============================================================================
// CONFIGURACIÓN SEGURA DE MERCADOPAGO
// =============================================================================

// Validar que las variables de entorno estén configuradas
function validateEnvironmentVariables() {
  const requiredVars = [
    'MERCADOPAGO_ENVIRONMENT',
    'NEXT_PUBLIC_BASE_URL'
  ]

  const environment = process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox'

  if (environment === 'sandbox') {
    requiredVars.push('MERCADOPAGO_SANDBOX_ACCESS_TOKEN', 'MERCADOPAGO_SANDBOX_PUBLIC_KEY')
  } else {
    requiredVars.push('MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY')
  }

  const missingVars = requiredVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`)
  }
}

// Configuración dinámica basada en el entorno
function getMercadoPagoConfig() {
  validateEnvironmentVariables()

  const environment = process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox'
  const isSandbox = environment === 'sandbox'

  const accessToken = isSandbox
    ? process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN!
    : process.env.MERCADOPAGO_ACCESS_TOKEN!

  const publicKey = isSandbox
    ? process.env.MERCADOPAGO_SANDBOX_PUBLIC_KEY!
    : process.env.MERCADOPAGO_PUBLIC_KEY!

  return {
    accessToken,
    publicKey,
    clientId: process.env.MERCADOPAGO_CLIENT_ID,
    clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET,
    environment,
    isSandbox,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET
  }
}

// Cliente de MercadoPago configurado dinámicamente
const config = getMercadoPagoConfig()
const client = new MercadoPagoConfig({
  accessToken: config.accessToken,
  options: {
    timeout: 5000,
    idempotencyKey: crypto.randomUUID()
  }
})

// Instancias de los servicios
const preference = new Preference(client)
const payment = new Payment(client)

// Exportar configuración para uso en el frontend
export const MERCADOPAGO_CONFIG = {
  publicKey: config.publicKey,
  environment: config.environment,
  isSandbox: config.isSandbox
}

// =============================================================================
// TIPOS Y INTERFACES
// =============================================================================

export interface PaymentPreferenceData {
  title: string
  description: string
  price: number
  quantity: number
  propertyId: string
  userId: string
  userEmail: string
  userName: string
  planType?: 'basic' | 'featured' | 'premium'
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
  payment_method_id?: string
  payment_type_id?: string
  installments?: number
}

export interface WebhookData {
  id: string
  topic: string
  type: string
  date_created: string
  application_id: string
  user_id: string
  version: string
  api_version: string
  action: string
  data: {
    id: string
  }
}

// =============================================================================
// FUNCIONES PRINCIPALES
// =============================================================================

/**
 * Crear una preferencia de pago con configuración completa
 */
export async function createPaymentPreference(data: PaymentPreferenceData) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const preferenceData = {
      items: [
        {
          id: data.propertyId,
          title: data.title,
          description: data.description,
          quantity: data.quantity,
          unit_price: data.price,
          currency_id: 'ARS',
          category_id: 'real_estate'
        }
      ],
      payer: {
        email: data.userEmail,
        name: data.userName
      },
      back_urls: {
        success: `${baseUrl}/payment/success?property_id=${data.propertyId}&plan=${data.planType || 'basic'}`,
        failure: `${baseUrl}/payment/failure?property_id=${data.propertyId}`,
        pending: `${baseUrl}/payment/pending?property_id=${data.propertyId}`
      },
      auto_return: 'approved' as const,
      notification_url: `${baseUrl}/api/payments/webhook`,
      external_reference: `${data.propertyId}-${data.userId}-${Date.now()}`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
        default_installments: 1
      },
      metadata: {
        property_id: data.propertyId,
        user_id: data.userId,
        plan_type: data.planType || 'basic',
        created_at: new Date().toISOString()
      }
    }

    const response = await preference.create({ body: preferenceData })

    // Log para debugging (solo en desarrollo)
    if (config.isSandbox && process.env.DEBUG_PAYMENTS === 'true') {
      }

    return response
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error)
    throw new Error('Error al crear la preferencia de pago')
  }
}

/**
 * Obtener información detallada de un pago
 */
export async function getPaymentInfo(paymentId: string): Promise<PaymentStatus> {
  try {
    const paymentData = await payment.get({ id: paymentId })

    return {
      id: paymentData.id!.toString(),
      status: paymentData.status as PaymentStatus['status'],
      status_detail: paymentData.status_detail || '',
      transaction_amount: paymentData.transaction_amount || 0,
      currency_id: paymentData.currency_id || 'ARS',
      date_created: paymentData.date_created || '',
      date_approved: paymentData.date_approved || undefined,
      payer: {
        email: paymentData.payer?.email || '',
        identification: paymentData.payer?.identification ? {
          type: paymentData.payer.identification.type || '',
          number: paymentData.payer.identification.number || ''
        } : undefined
      },
      external_reference: paymentData.external_reference || '',
      payment_method_id: paymentData.payment_method_id || undefined,
      payment_type_id: paymentData.payment_type_id || undefined,
      installments: paymentData.installments || undefined
    }
  } catch (error) {
    console.error('Error fetching payment info:', error)
    throw new Error('Error al obtener información del pago')
  }
}

/**
 * Verificar el estado de un pago (alias para getPaymentInfo)
 */
export async function verifyPayment(paymentId: string): Promise<PaymentStatus> {
  return getPaymentInfo(paymentId)
}

/**
 * Validar webhook signature (si está configurado el secret)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  if (!secret || !config.webhookSecret) {
    return true // Si no hay secret configurado, aceptamos el webhook
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

/**
 * Procesar webhook de MercadoPago
 */
export async function processWebhook(webhookData: WebhookData): Promise<PaymentStatus | null> {
  try {
    // Solo procesar webhooks de pagos
    if (webhookData.topic !== 'payment' && webhookData.type !== 'payment') {
      return null
    }

    const paymentId = webhookData.data.id
    const paymentInfo = await getPaymentInfo(paymentId)

    // Log para debugging
    if (config.isSandbox && process.env.DEBUG_PAYMENTS === 'true') {
      }

    return paymentInfo
  } catch (error) {
    console.error('Error processing webhook:', error)
    throw error
  }
}

/**
 * Crear un reembolso (refund)
 */
export async function createRefund(paymentId: string, amount?: number) {
  try {
    const refundData: any = {
      payment_id: parseInt(paymentId)
    }

    if (amount) {
      refundData.amount = amount
    }

    // Nota: La API de reembolsos puede requerir configuración adicional
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refundData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating refund:', error)
    throw new Error('Error al crear el reembolso')
  }
}

/**
 * Obtener métodos de pago disponibles
 */
export async function getPaymentMethods() {
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    throw new Error('Error al obtener métodos de pago')
  }
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Formatear monto para mostrar
 */
export function formatAmount(amount: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Obtener descripción del estado de pago
 */
export function getPaymentStatusDescription(status: string, statusDetail: string): string {
  const statusDescriptions: Record<string, string> = {
    'pending': 'Pago pendiente',
    'approved': 'Pago aprobado',
    'authorized': 'Pago autorizado',
    'in_process': 'Pago en proceso',
    'in_mediation': 'Pago en mediación',
    'rejected': 'Pago rechazado',
    'cancelled': 'Pago cancelado',
    'refunded': 'Pago reembolsado',
    'charged_back': 'Contracargo'
  }

  return statusDescriptions[status] || `Estado: ${status} (${statusDetail})`
}

export default client
