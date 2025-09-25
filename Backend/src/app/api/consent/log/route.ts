import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClientIP, getUserAgent } from '@/lib/consent/logConsent'

interface ConsentLogPayload {
  policyVersion: string
  acceptedTerms: boolean
  acceptedPrivacy: boolean
  userAgent?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Validar sesión con Supabase server client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Leer payload del body
    const payload: ConsentLogPayload = await request.json()
    
    if (!payload.policyVersion || typeof payload.acceptedTerms !== 'boolean' || typeof payload.acceptedPrivacy !== 'boolean') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // Obtener metadata del request
    const clientIP = getClientIP(request)
    const userAgent = payload.userAgent || getUserAgent(request)

    // Insertar en public.user_consent
    const { data, error } = await supabase
      .from('user_consent')
      .insert([
        {
          user_id: user.id,
          policy_version: payload.policyVersion,
          accepted_terms: payload.acceptedTerms,
          accepted_privacy: payload.acceptedPrivacy,
          ip: clientIP || null,
          user_agent: userAgent || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error logging consent:', error)
      return NextResponse.json({ error: 'Error al registrar consentimiento' }, { status: 500 })
    }

    // Retornar 204 (No Content) o {ok: true}
    return NextResponse.json({ ok: true, id: data.id }, { status: 200 })

  } catch (error) {
    console.error('Error in consent log:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
