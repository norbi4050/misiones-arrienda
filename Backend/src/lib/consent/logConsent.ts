import { createClient } from '@/lib/supabase/server';

interface LogConsentParams {
  userId: string;
  policyVersion: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  ip?: string;
  userAgent?: string;
}

export async function logConsent({
  userId,
  policyVersion,
  acceptedTerms,
  acceptedPrivacy,
  ip,
  userAgent
}: LogConsentParams) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('user_consent')
      .insert([
        {
          user_id: userId,
          policy_version: policyVersion,
          accepted_terms: acceptedTerms,
          accepted_privacy: acceptedPrivacy,
          ip: ip || null,
          user_agent: userAgent || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error logging consent:', error);
      throw new Error(`Failed to log consent: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in logConsent:', error);
    throw error;
  }
}

// Helper para obtener IP del request
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || undefined;
}

// Helper para obtener User Agent
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

// Versión actual de la política (actualizar cuando cambien los términos)
export const CURRENT_POLICY_VERSION = '2025-01-01';
