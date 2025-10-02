// =====================================================
// B6 - ATTACHMENT GUARDS: Validación de adjuntos
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { getUserPlanLimits } from './plan-guards';
import { PLAN_ATTACHMENT_LIMITS, type PlanTier } from '@/types/plan-limits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Resultado de validación de adjunto
 */
export interface AttachmentValidationResult {
  allowed: boolean;
  error?: string;
  errorCode?: 'SIZE_LIMIT' | 'MIME_NOT_ALLOWED' | 'DAILY_QUOTA' | 'PLAN_REQUIRED' | 'UNKNOWN';
  details?: {
    currentSize?: number;
    maxSize?: number;
    currentCount?: number;
    maxCount?: number;
    planTier?: PlanTier;
  };
}

/**
 * Valida si un usuario puede subir un adjunto según su plan
 */
export async function validateAttachmentUpload(
  userId: string,
  file: { size: number; type: string }
): Promise<AttachmentValidationResult> {
  try {
    // 1. Obtener límites del plan del usuario
    const limits = await getUserPlanLimits(userId);
    
    if (!limits) {
      console.error('[Attachment Guards] No se pudo obtener el plan del usuario');
      return {
        allowed: false,
        error: 'No se pudo verificar tu plan. Intenta nuevamente.',
        errorCode: 'UNKNOWN'
      };
    }

    // 2. Verificar si el plan permite adjuntos
    if (!limits.allow_attachments) {
      console.log('[Attachment Guards] Plan no permite adjuntos:', limits.plan_tier);
      return {
        allowed: false,
        error: 'Adjuntar archivos es una función PRO. Mejora tu plan para desbloquear esta característica.',
        errorCode: 'PLAN_REQUIRED',
        details: {
          planTier: limits.plan_tier
        }
      };
    }

    const planLimits = PLAN_ATTACHMENT_LIMITS[limits.plan_tier];
    
    // 3. Validar tamaño del archivo
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > planLimits.maxSizeMB) {
      console.log('[Attachment Guards] Archivo excede límite:', sizeMB, 'MB >', planLimits.maxSizeMB, 'MB');
      return {
        allowed: false,
        error: `El archivo excede el límite de ${planLimits.maxSizeMB}MB de tu plan ${limits.plan_tier.toUpperCase()}. Tamaño actual: ${sizeMB.toFixed(2)}MB`,
        errorCode: 'SIZE_LIMIT',
        details: {
          currentSize: sizeMB,
          maxSize: planLimits.maxSizeMB,
          planTier: limits.plan_tier
        }
      };
    }

    // 4. Validar tipo MIME
    const allowedMimes = planLimits.allowedMimes as readonly string[];
    if (!allowedMimes.includes(file.type)) {
      console.log('[Attachment Guards] MIME no permitido:', file.type);
      return {
        allowed: false,
        error: `Tipo de archivo no permitido. Solo se permiten: ${allowedMimes.join(', ')}`,
        errorCode: 'MIME_NOT_ALLOWED',
        details: {
          planTier: limits.plan_tier
        }
      };
    }

    // 5. Validar cuota diaria
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: dailyCount, error: countError } = await supabase.rpc(
      'count_user_daily_attachments',
      { user_uuid: userId }
    );

    if (countError) {
      console.error('[Attachment Guards] Error al contar adjuntos diarios:', countError);
      // En caso de error, permitir (fail-open) pero loguear
      return { allowed: true };
    }

    const currentCount = dailyCount || 0;
    
    if (currentCount >= planLimits.dailyCount) {
      console.log('[Attachment Guards] Cuota diaria excedida:', currentCount, '>=', planLimits.dailyCount);
      return {
        allowed: false,
        error: `Has alcanzado el límite diario de ${planLimits.dailyCount} adjuntos de tu plan ${limits.plan_tier.toUpperCase()}. Intenta mañana o mejora tu plan.`,
        errorCode: 'DAILY_QUOTA',
        details: {
          currentCount,
          maxCount: planLimits.dailyCount,
          planTier: limits.plan_tier
        }
      };
    }

    // 6. Todo OK
    console.log('[Attachment Guards] Validación exitosa:', {
      userId,
      planTier: limits.plan_tier,
      sizeMB: sizeMB.toFixed(2),
      mime: file.type,
      dailyCount: currentCount
    });

    return { allowed: true };

  } catch (error) {
    console.error('[Attachment Guards] Exception en validación:', error);
    // En caso de error, permitir (fail-open) para no bloquear usuarios
    return { allowed: true };
  }
}

/**
 * Obtiene información de límites de adjuntos para mostrar en UI
 */
export async function getAttachmentLimitsInfo(userId: string) {
  try {
    const limits = await getUserPlanLimits(userId);
    
    if (!limits) {
      return null;
    }

    const planLimits = PLAN_ATTACHMENT_LIMITS[limits.plan_tier];
    
    // Contar adjuntos del día
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: dailyCount } = await supabase.rpc(
      'count_user_daily_attachments',
      { user_uuid: userId }
    );

    return {
      planTier: limits.plan_tier,
      allowAttachments: limits.allow_attachments,
      maxSizeMB: planLimits.maxSizeMB,
      allowedMimes: planLimits.allowedMimes,
      dailyLimit: planLimits.dailyCount,
      dailyUsed: dailyCount || 0,
      dailyRemaining: Math.max(0, planLimits.dailyCount - (dailyCount || 0))
    };
  } catch (error) {
    console.error('[Attachment Guards] Error obteniendo info de límites:', error);
    return null;
  }
}

/**
 * Formatea el tamaño de archivo en formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Valida el nombre de archivo y lo sanitiza
 */
export function sanitizeFileName(fileName: string): string {
  // Remover caracteres peligrosos y path traversal
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')  // Solo alfanuméricos, puntos y guiones
    .replace(/\.{2,}/g, '.')           // Evitar múltiples puntos consecutivos
    .replace(/^\.+/, '')               // Remover puntos al inicio
    .substring(0, 255);                // Limitar longitud
}

/**
 * Detecta el tipo MIME de un archivo por su extensión
 */
export function getMimeTypeFromExtension(fileName: string): string | null {
  const ext = fileName.toLowerCase().split('.').pop();
  
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'pdf': 'application/pdf'
  };
  
  return mimeMap[ext || ''] || null;
}

/**
 * Valida que el MIME type coincida con la extensión del archivo
 */
export function validateMimeTypeMatch(fileName: string, mimeType: string): boolean {
  const expectedMime = getMimeTypeFromExtension(fileName);
  
  if (!expectedMime) {
    return false;
  }
  
  // Normalizar MIME types (image/jpg -> image/jpeg)
  const normalizedMime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
  const normalizedExpected = expectedMime === 'image/jpg' ? 'image/jpeg' : expectedMime;
  
  return normalizedMime === normalizedExpected;
}
