interface LogConsentParams {
  userId: string;
  policyVersion: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  ip?: string;
  userAgent?: string;
}

export async function logConsent(params: LogConsentParams): Promise<void> {
  await fetch('/api/consent/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      userAgent: params.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    })
  })
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
