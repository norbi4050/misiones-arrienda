/**
 * Helpers para manejo de tipo de operación (alquiler/venta)
 * Proporciona compatibilidad hacia atrás con valores en inglés
 */

export type OperationType = 'alquiler' | 'venta' | 'ambos';

// Mapeo de valores antiguos (inglés) a nuevos (español)
export const OPERATION_MAP: Record<string, OperationType> = {
  // Valores antiguos en inglés
  'RENT': 'alquiler',
  'SALE': 'venta',
  'BOTH': 'ambos',
  // Valores ya en español (passthrough)
  'alquiler': 'alquiler',
  'venta': 'venta',
  'ambos': 'ambos'
};

// Labels para mostrar en UI
export const OPERATION_LABELS: Record<OperationType, string> = {
  alquiler: 'Alquiler',
  venta: 'Venta',
  ambos: 'Alquiler y Venta'
};

// Labels extendidos para diferentes contextos
export const OPERATION_LABELS_EXTENDED: Record<OperationType, { short: string; long: string; badge: string }> = {
  alquiler: {
    short: 'Alquiler',
    long: 'En alquiler',
    badge: '🏠 Alquiler'
  },
  venta: {
    short: 'Venta',
    long: 'En venta',
    badge: '💰 Venta'
  },
  ambos: {
    short: 'Ambos',
    long: 'Alquiler o venta',
    badge: '🔄 Alquiler/Venta'
  }
};

/**
 * Normaliza un valor de operationType a español
 * Maneja compatibilidad con valores en inglés y casos edge
 * 
 * @param value - Valor a normalizar (puede ser inglés, español, null, undefined)
 * @returns Valor normalizado en español, default 'alquiler'
 */
export function normalizeOperation(value: string | null | undefined): OperationType {
  // SAFE-FIX: Si no viene valor, default a alquiler
  if (!value) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[operation] Valor vacío, defaulting to alquiler');
    }
    return 'alquiler';
  }

  // Intentar mapear el valor
  const normalized = OPERATION_MAP[value];
  
  if (normalized) {
    return normalized;
  }

  // ROLLBACK: Si el valor no es reconocido, default a alquiler con warning
  console.warn('[operation] Valor no reconocido:', value, '-> defaulting to alquiler');
  return 'alquiler';
}

/**
 * Obtiene el label para mostrar en UI
 * 
 * @param value - Valor de operationType
 * @param variant - Variante del label (short, long, badge)
 * @returns Label formateado
 */
export function getOperationLabel(
  value: string | null | undefined, 
  variant: 'short' | 'long' | 'badge' = 'short'
): string {
  const normalized = normalizeOperation(value);
  
  if (variant === 'short') {
    return OPERATION_LABELS[normalized];
  }
  
  return OPERATION_LABELS_EXTENDED[normalized][variant];
}

/**
 * Valida si un valor es un operationType válido
 * 
 * @param value - Valor a validar
 * @returns true si es válido
 */
export function isValidOperation(value: string): value is OperationType {
  return value === 'alquiler' || value === 'venta' || value === 'ambos';
}

/**
 * Sanitiza un valor de operationType para usar en la API
 * Convierte a español y valida
 * 
 * @param value - Valor a sanitizar
 * @returns Valor sanitizado y válido
 */
export function sanitizeOperation(value: string | null | undefined): OperationType {
  const normalized = normalizeOperation(value);
  
  // Double-check que el valor normalizado es válido
  if (!isValidOperation(normalized)) {
    console.error('[operation] Valor normalizado inválido:', normalized, '-> forcing alquiler');
    return 'alquiler';
  }
  
  return normalized;
}
