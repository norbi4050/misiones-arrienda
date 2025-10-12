// =====================================================
// B4 - TYPES: Plan Limits and Restrictions
// =====================================================

export type PlanTier = 'free' | 'pro' | 'business';

export type PlanAction = 
  | 'activate_property' 
  | 'create_property' 
  | 'attach_message_file' 
  | 'mark_property_featured';

export type PlanFeature = 
  | 'active_properties' 
  | 'attachments' 
  | 'featured' 
  | 'analytics' 
  | 'priority_support';

export interface PlanLimits {
  plan_tier: PlanTier;
  max_active_properties: number | null; // null = unlimited
  allow_attachments: boolean;
  allow_featured: boolean;
  allow_analytics: boolean;
  allow_priority_support: boolean;
  max_images_per_property: number;
  max_attachment_size_mb: number;
  allowed_attachment_mimes: string[];
  daily_attachment_count: number;
  description: string;
  price_monthly: number;
  plan_expires_at: string | null;
  is_expired: boolean;
}

// Constantes de límites de adjuntos por plan
export const PLAN_ATTACHMENT_LIMITS = {
  free: {
    maxFiles: 1,
    maxSizeMB: 5,
    dailyCount: 20,
    allowedMimes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'] as const
  },
  pro: {
    maxFiles: 5,
    maxSizeMB: 15,
    dailyCount: 200,
    allowedMimes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'] as const
  },
  business: {
    maxFiles: 10,
    maxSizeMB: 50,
    dailyCount: 1000,
    allowedMimes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'] as const
  }
} as const;

export interface PlanCheckResult {
  allowed: boolean;
  reason: 'unlimited' | 'within_limit' | 'PLAN_LIMIT' | 'PLAN_REQUIRED' | 'PLAN_EXPIRED';
  current_count?: number;
  limit?: number | null;
  plan_tier: PlanTier;
  feature?: PlanFeature;
  required_plan?: PlanTier;
}

export interface PlanLimitError {
  error: 'PLAN_LIMIT' | 'PLAN_REQUIRED' | 'PLAN_EXPIRED';
  feature: PlanFeature;
  limit?: number;
  current_usage?: number;
  plan: PlanTier;
  required_plan?: PlanTier;
  message: string;
}

export interface PlanLimitBlock {
  id: string;
  user_id: string;
  plan_tier: PlanTier;
  action: PlanAction;
  feature: PlanFeature;
  current_usage: number | null;
  limit_value: number | null;
  metadata: Record<string, any>;
  created_at: string;
}
