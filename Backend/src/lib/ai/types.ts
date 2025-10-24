/**
 * Types para el sistema de IA de generación de descripciones
 */

/**
 * Request para analizar una propiedad
 */
export interface PropertyAnalysisRequest {
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  garages?: number;
  area?: number;
  price: number;
  currency?: string;
  city?: string;
  operationType?: string;
  // Campos opcionales adicionales
  amenitiesHints?: string[]; // Amenidades que el usuario ya identificó
  notes?: string; // Notas adicionales del usuario
}

/**
 * Response del análisis de IA
 */
export interface PropertyAnalysisResponse {
  title: string;
  description: string;
  amenities: string[];
  features: string[];
  highlights: string;
}

/**
 * Response completo del endpoint API
 */
export interface AIAnalysisAPIResponse {
  success: boolean;
  data?: PropertyAnalysisResponse;
  error?: string;
  message?: string;
  fallback?: boolean; // true si falló y debe usar formulario manual
  timestamp: string;
}

/**
 * Estado de generación en el frontend
 */
export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Métricas de uso de IA (para analytics)
 */
export interface AIUsageMetrics {
  userId: string;
  propertyId?: string;
  action: 'generate' | 'regenerate' | 'accept' | 'reject' | 'edit';
  tokensUsed?: number;
  latencyMs: number;
  wasEdited: boolean;
  timestamp: Date;
}
