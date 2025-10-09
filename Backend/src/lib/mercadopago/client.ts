import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configuración del cliente MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'mp-client-' + Date.now()
  }
});

// Instancias de APIs
export const preference = new Preference(client);
export const payment = new Payment(client);

// Configuración de la aplicación
export const MP_CONFIG = {
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  webhookSecret: process.env.MP_WEBHOOK_SECRET || '',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  
  // URLs de retorno
  successUrl: (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') + '/dashboard/billing?status=success',
  failureUrl: (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') + '/dashboard/billing?status=failure',
  pendingUrl: (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') + '/dashboard/billing?status=pending',
  
  // Configuración de notificaciones
  notificationUrl: (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') + '/api/payments/webhook'
};

// Validar configuración
export function validateMPConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!MP_CONFIG.accessToken) {
    errors.push('MP_ACCESS_TOKEN no configurado');
  }
  
  if (!MP_CONFIG.webhookSecret) {
    errors.push('MP_WEBHOOK_SECRET no configurado');
  }
  
  if (!MP_CONFIG.baseUrl) {
    errors.push('NEXT_PUBLIC_BASE_URL no configurado');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Verificar si MercadoPago está disponible
export function isMPAvailable(): boolean {
  const config = validateMPConfig();
  return config.valid;
}

// Log de configuración (sin exponer secrets)
export function logMPConfig() {
  console.log('🔧 MercadoPago Config:', {
    hasAccessToken: !!MP_CONFIG.accessToken,
    hasWebhookSecret: !!MP_CONFIG.webhookSecret,
    baseUrl: MP_CONFIG.baseUrl,
    successUrl: MP_CONFIG.successUrl,
    notificationUrl: MP_CONFIG.notificationUrl
  });
}

export default client;
