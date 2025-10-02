// =====================================================
// B5 - SHORT-LINKS: Helper for PRO/BUSINESS short-links
// =====================================================

import { createClient } from '@supabase/supabase-js';
import type { ShareEntityType } from './types';
import { getPlanInfo } from '@/lib/plan-guards';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Genera un slug único usando base62
 */
function generateSlugBase62(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Genera un slug único para short-link
 */
export async function generateShortLinkSlug(
  entityType: ShareEntityType,
  entityId: string
): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Generar slug aleatorio
    const slug = generateSlugBase62(6);
    
    // Verificar si ya existe
    const { data, error } = await supabase
      .from('short_links')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    // Si no existe (error porque no encontró), retornar
    if (error && error.code === 'PGRST116') {
      return slug;
    }
    
    attempts++;
  }
  
  // Fallback: usar timestamp + random
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${timestamp}${random}`.substring(0, 10);
}

/**
 * Verifica si el usuario puede crear short-links (PRO/BUSINESS)
 */
export async function canCreateShortLink(userId: string): Promise<boolean> {
  try {
    const planInfo = await getPlanInfo(userId);
    
    if (!planInfo) {
      return false;
    }
    
    // Solo PRO y BUSINESS pueden crear short-links
    return ['pro', 'business'].includes(planInfo.plan_tier);
  } catch (error) {
    console.error('[ShortLinks] Error checking plan:', error);
    return false;
  }
}

/**
 * Crea un short-link en DB
 */
export async function createShortLink(
  userId: string,
  entityType: ShareEntityType,
  entityId: string,
  fullUrl: string,
  campaign: string = 'default'
): Promise<{ slug: string; shortUrl: string } | null> {
  try {
    // 1. Verificar plan PRO/BUSINESS
    const canCreate = await canCreateShortLink(userId);
    
    if (!canCreate) {
      throw new Error('Short-links require PRO or BUSINESS plan');
    }
    
    // 2. Generar slug único
    const slug = await generateShortLinkSlug(entityType, entityId);
    
    // 3. Guardar en DB
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('short_links')
      .insert({
        slug,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        full_url: fullUrl,
        campaign,
        clicks: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('[ShortLinks] Error creating short-link:', error);
      return null;
    }
    
    // 4. Construir short URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shortUrl = `${siteUrl}/go/${slug}`;
    
    return {
      slug,
      shortUrl
    };
  } catch (error) {
    console.error('[ShortLinks] Exception creating short-link:', error);
    return null;
  }
}

/**
 * Obtiene el mapping de un slug
 */
export async function getShortLinkMapping(slug: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('short_links')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('[ShortLinks] Error getting mapping:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('[ShortLinks] Exception getting mapping:', error);
    return null;
  }
}

/**
 * Incrementa el contador de clicks de un short-link
 */
export async function incrementShortLinkClicks(slug: string): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase.rpc('increment_short_link_clicks', {
      link_slug: slug
    });
    
    if (error) {
      // Fallback: update manual
      const { data: current } = await supabase
        .from('short_links')
        .select('clicks')
        .eq('slug', slug)
        .single();
      
      if (current) {
        await supabase
          .from('short_links')
          .update({ clicks: (current.clicks || 0) + 1 })
          .eq('slug', slug);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[ShortLinks] Error incrementing clicks:', error);
    return false;
  }
}

/**
 * Obtiene todos los short-links de un usuario
 */
export async function getUserShortLinks(userId: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('short_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[ShortLinks] Error getting user short-links:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[ShortLinks] Exception getting user short-links:', error);
    return [];
  }
}

/**
 * Elimina un short-link
 */
export async function deleteShortLink(userId: string, slug: string): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('short_links')
      .delete()
      .eq('slug', slug)
      .eq('user_id', userId); // Asegurar que solo el dueño puede eliminar
    
    if (error) {
      console.error('[ShortLinks] Error deleting short-link:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[ShortLinks] Exception deleting short-link:', error);
    return false;
  }
}

/**
 * Presets de campaña predefinidos
 */
export const CAMPAIGN_PRESETS = {
  facebook_organic: {
    id: 'facebook_organic',
    name: 'Facebook Orgánico',
    description: 'Para compartir en tu perfil o grupos de Facebook',
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: 'organic_share',
    icon: '📘'
  },
  facebook_paid: {
    id: 'facebook_paid',
    name: 'Anuncio Pago FB',
    description: 'Para campañas de Facebook Ads',
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'paid_ad',
    icon: '💰'
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Para compartir por WhatsApp',
    utm_source: 'whatsapp',
    utm_medium: 'messaging',
    utm_campaign: 'direct_share',
    icon: '💬'
  },
  email_marketing: {
    id: 'email_marketing',
    name: 'Email Marketing',
    description: 'Para newsletters y campañas de email',
    utm_source: 'email',
    utm_medium: 'email',
    utm_campaign: 'newsletter',
    icon: '📧'
  },
  instagram_stories: {
    id: 'instagram_stories',
    name: 'Instagram Stories',
    description: 'Para compartir en historias de Instagram',
    utm_source: 'instagram',
    utm_medium: 'social',
    utm_campaign: 'stories',
    icon: '📸'
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    description: 'Configura tus propios parámetros UTM',
    utm_source: 'custom',
    utm_medium: 'custom',
    utm_campaign: 'custom',
    icon: '⚙️'
  }
} as const;

export type CampaignPresetId = keyof typeof CAMPAIGN_PRESETS;

/**
 * Obtiene un preset por ID
 */
export function getCampaignPreset(presetId: CampaignPresetId) {
  return CAMPAIGN_PRESETS[presetId];
}

/**
 * Guarda preset preferido en localStorage
 */
export function savePreferredPreset(presetId: CampaignPresetId): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred_campaign_preset', presetId);
  }
}

/**
 * Obtiene preset preferido de localStorage
 */
export function getPreferredPreset(): CampaignPresetId | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('preferred_campaign_preset');
    return (saved as CampaignPresetId) || null;
  }
  return null;
}
