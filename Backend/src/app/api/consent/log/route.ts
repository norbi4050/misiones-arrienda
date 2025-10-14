import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


interface ConsentLogPayload {
  userId: string
  policyVersion: string
  acceptedTerms: boolean
  acceptedPrivacy: boolean
  ip?: string
  userAgent?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Leer payload del body
    const payload: ConsentLogPayload = await request.json()
    
    // Validar tipos requeridos
    if (!payload.userId || !payload.policyVersion) {
      return NextResponse.json({ error: 'userId y policyVersion son requeridos' }, { status: 400 })
    }
    
    if (typeof payload.acceptedTerms !== 'boolean' || typeof payload.acceptedPrivacy !== 'boolean') {
      return NextResponse.json({ error: 'acceptedTerms y acceptedPrivacy deben ser boolean' }, { status: 400 })
    }

    // Obtener IP real desde headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                   request.headers.get('x-real-ip') || 
                   payload.ip || 
                   'unknown'

    // Obtener User Agent
    const userAgent = payload.userAgent || request.headers.get('user-agent') || 'unknown'

    // Insertar en public.user_consent con RLS
    const { error } = await supabase
      .from('user_consent')
      .insert([
        {
          user_id: payload.userId,
          policy_version: payload.policyVersion,
          accepted_terms: payload.acceptedTerms,
          accepted_privacy: payload.acceptedPrivacy,
          ip: realIP,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        }
      ])

    if (error) {
      console.error('Error logging consent:', error)
      return NextResponse.json({ error: 'Error al registrar consentimiento' }, { status: 500 })
    }

    // Retornar 204 No Content
    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('Error in consent log:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
