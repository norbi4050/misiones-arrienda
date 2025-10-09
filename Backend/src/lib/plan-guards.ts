// =====================================================
// B4 - PLAN GUARDS: Central plan limit enforcement
// =====================================================

import { createClient } from '@supabase/supabase-js';
import type { 
  PlanTier, 
  PlanAction, 
  PlanFeature, 
  PlanCheckResult, 
  PlanLimitError,
  PlanLimits 
} from '@/types/plan-limits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Feature flag para habilitar/deshabilitar límites
const FEATURE_BILLING_LIMITS = process.env.FEATURE_BILLING_LIMITS === 'true';

/**
 * Obtiene los límites del plan de un usuario
 */
export async function getUserPlanLimits(userId: string): Promise<PlanLimits | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .rpc('get_user_plan_limits', { user_uuid: userId });
    
    if (error) {
      console.error('[Plan Guards] Error getting plan limits:', error);
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('[Plan Guards] Exception getting plan limits:', error);
    return null;
  }
}

/**
 * Verifica si un usuario puede activar más propiedades
 */
export async function canUserActivateProperty(userId: string): Promise<PlanCheckResult> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .rpc('can_user_activate_property', { user_uuid: userId });
    
    if (error) {
      console.error('[Plan Guards] Error checking property activation:', error);
      // En caso de error, permitir por defecto (fail-open)
      return {
        allowed: true,
        reason: 'unlimited',
        plan_tier: 'free'
      };
    }
    
    return data as PlanCheckResult;
  } catch (error) {
    console.error('[Plan Guards] Exception checking property activation:', error);
    return {
      allowed: true,
      reason: 'unlimited',
      plan_tier: 'free'
    };
  }
}

/**
 * Guardia central para verificar límites de plan
 */
export async function checkPlanLimit(
  userId: string,
  action: PlanAction
): Promise<{ allowed: boolean; error?: PlanLimitError }> {
  
  // Si el feature flag está desactivado, solo loguear y permitir
  if (!FEATURE_BILLING_LIMITS) {
    console.log(`[Plan Guards] Feature flag OFF - Action "${action}" allowed for user ${userId}`);
    return { allowed: true };
  }
  
  try {
    const limits = await getUserPlanLimits(userId);
    
    if (!limits) {
      console.error('[Plan Guards] Could not get plan limits, allowing by default');
      return { allowed: true };
    }
    
    // Verificar si el plan expiró
    if (limits.is_expired) {
      await logPlanBlock(userId, action, 'active_properties', {
        reason: 'PLAN_EXPIRED',
        plan_tier: limits.plan_tier,
        expired_at: limits.plan_expires_at
      });
      
      return {
        allowed: false,
        error: {
          error: 'PLAN_EXPIRED',
          feature: 'active_properties',
          plan: limits.plan_tier,
          message: `Tu plan ${limits.plan_tier.toUpperCase()} ha expirado. Por favor, renueva tu suscripción.`
        }
      };
    }
    
    // Verificar según la acción
    switch (action) {
      case 'activate_property':
      case 'create_property': {
        const check = await canUserActivateProperty(userId);
        
        if (!check.allowed) {
          await logPlanBlock(userId, action, 'active_properties', {
            current_usage: check.current_count,
            limit: check.limit,
            plan_tier: check.plan_tier
          });
          
          return {
            allowed: false,
            error: {
              error: 'PLAN_LIMIT',
              feature: 'active_properties',
              limit: check.limit || 0,
              current_usage: check.current_count || 0,
              plan: check.plan_tier,
              message: `Has alcanzado el límite de ${check.limit} propiedades activas de tu plan ${check.plan_tier.toUpperCase()}.`
            }
          };
        }
        
        return { allowed: true };
      }
      
      case 'attach_message_file': {
        if (!limits.allow_attachments) {
          await logPlanBlock(userId, action, 'attachments', {
            plan_tier: limits.plan_tier,
            required_plan: 'pro'
          });
          
          return {
            allowed: false,
            error: {
              error: 'PLAN_REQUIRED',
              feature: 'attachments',
              plan: limits.plan_tier,
              required_plan: 'pro',
              message: 'Adjuntar archivos es una función PRO. Mejora tu plan para desbloquear esta característica.'
            }
          };
        }
        
        return { allowed: true };
      }
      
      case 'mark_property_featured': {
        if (!limits.allow_featured) {
          await logPlanBlock(userId, action, 'featured', {
            plan_tier: limits.plan_tier,
            required_plan: 'pro'
          });
          
          return {
            allowed: false,
            error: {
              error: 'PLAN_REQUIRED',
              feature: 'featured',
              plan: limits.plan_tier,
              required_plan: 'pro',
              message: 'Destacar propiedades es una función PRO. Mejora tu plan para desbloquear esta característica.'
            }
          };
        }
        
        return { allowed: true };
      }
      
      default: {
        console.warn(`[Plan Guards] Unknown action: ${action}`);
        return { allowed: true };
      }
    }
  } catch (error) {
    console.error('[Plan Guards] Exception in checkPlanLimit:', error);
    // En caso de error, permitir por defecto (fail-open)
    return { allowed: true };
  }
}

/**
 * Registra un bloqueo por límite de plan (para telemetría)
 */
async function logPlanBlock(
  userId: string,
  action: PlanAction,
  feature: PlanFeature,
  metadata: Record<string, any>
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('plan_limit_blocks')
      .insert({
        user_id: userId,
        plan_tier: metadata.plan_tier || 'free',
        action,
        feature,
        current_usage: metadata.current_usage || null,
        limit_value: metadata.limit || null,
        metadata
      });
    
    if (error) {
      console.error('[Plan Guards] Error logging plan block:', error);
    } else {
      console.log(`[Plan Guards] Logged block: user=${userId}, action=${action}, feature=${feature}`);
    }
  } catch (error) {
    console.error('[Plan Guards] Exception logging plan block:', error);
  }
}

/**
 * Middleware helper para usar en API routes
 */
export async function enforcePlanLimit(
  userId: string,
  action: PlanAction
): Promise<{ success: true } | { success: false; error: PlanLimitError }> {
  const result = await checkPlanLimit(userId, action);
  
  if (!result.allowed && result.error) {
    return { success: false, error: result.error };
  }
  
  return { success: true };
}

/**
 * Obtiene información del plan para mostrar en UI
 */
export async function getPlanInfo(userId: string) {
  const limits = await getUserPlanLimits(userId);
  
  if (!limits) {
    return null;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Contar propiedades activas
  const { count: activeCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['AVAILABLE', 'PUBLISHED', 'RESERVED']);
  
  return {
    plan_tier: limits.plan_tier,
    max_active_properties: limits.max_active_properties,
    current_active_properties: activeCount || 0,
    allow_attachments: limits.allow_attachments,
    allow_featured: limits.allow_featured,
    allow_analytics: limits.allow_analytics,
    allow_priority_support: limits.allow_priority_support,
    max_images_per_property: limits.max_images_per_property,
    plan_expires_at: limits.plan_expires_at,
    is_expired: limits.is_expired,
    description: limits.description,
    price_monthly: limits.price_monthly
  };
}
