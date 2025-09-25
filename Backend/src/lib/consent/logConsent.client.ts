'use client'

export interface ConsentLogPayload {
  policyVersion: string
  acceptedTerms: boolean
  acceptedPrivacy: boolean
  userAgent?: string
}

export async function logConsentClient(payload: ConsentLogPayload): Promise<void> {
  const res = await fetch('/api/consent/log', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      policyVersion: payload.policyVersion,
      acceptedTerms: payload.acceptedTerms,
      acceptedPrivacy: payload.acceptedPrivacy,
      userAgent: payload.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Consent log failed: ${errorData.error || res.statusText}`)
  }
}
