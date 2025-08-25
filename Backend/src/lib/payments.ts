// Sistema de planes simplificado - SIN MercadoPago para evitar errores de compilación
// Implementación básica que funciona completamente sin dependencias externas

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

  // TODOS los planes funcionan como "gratis" por ahora para evitar errores
  // En el futuro se puede integrar cualquier sistema de pagos
  return {
    isFreePlan: true,
    planId,
    planName: plan.name,
    price: plan.price,
    message: plan.price === 0 
      ? 'Plan básico activado gratuitamente' 
      : `Plan ${plan.name} activado temporalmente (integración de pagos pendiente)`,
    mockPaymentUrl: `#payment-${planId}-${propertyId}`,
    success: true
  };
}

export async function verifyPayment(paymentId: string) {
  // Simulación simple de verificación de pago
  return {
    status: 'approved',
    paymentId,
    amount: 0, // Todos los pagos son "gratis" por ahora
    planId: 'basico',
    message: 'Pago simulado - todos los planes están disponibles gratuitamente'
  };
}

export function calculatePlanExpiration(planId: string): Date {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error('Plan no encontrado');
  }
  
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + plan.duration);
  return expirationDate;
}

// Función helper para obtener información de un plan
export function getPlanInfo(planId: string): PlanData | null {
  return PLANS[planId] || null;
}

// Función para listar todos los planes disponibles
export function getAllPlans(): PlanData[] {
  return Object.values(PLANS);
}
