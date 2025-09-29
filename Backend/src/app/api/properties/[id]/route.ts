import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Evitar caching agresivo durante desarrollo
export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Query 1: Obtener propiedad por ID (sin join relacional)
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching property:', error)
      
      // Si no hay fila encontrada
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'not_found' }, { status: 404 })
      }
      
      // Otros errores
      return NextResponse.json({ 
        error: error.message || 'Database error' 
      }, { status: 500 })
    }

    if (!property) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // Query 2: Resolver agent en segundo query opcional
    const uid = property.user_id ?? property.user_id_uuid ?? property.user_id_text
    let agent = null
    
    if (uid) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, user_id, full_name, email, phone, photos')
          .or(`user_id.eq.${uid},id.eq.${uid}`)  // tolerante a text/uuid
          .maybeSingle()
        
        agent = profile ?? null
      } catch (profileError) {
        console.warn('Error fetching agent profile:', profileError)
        // Continuar sin agente - no es crítico
        agent = null
      }
    }

    // Responder SIEMPRE objeto
    return NextResponse.json({ 
      ok: true, 
      property, 
      agent 
    })

  } catch (error) {
    console.error('Error in GET /api/properties/[id]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const payload = await req.json()

    // Campos permitidos (evitamos tocar user_id/status/created_at, etc.)
    const allowed = [
      'title','description','price','operation_type','property_type',
      'bedrooms','bathrooms','area','city','province','address',
      'latitude','longitude','images','featured'
    ]
    const updateData: Record<string, any> = {}
    for (const k of allowed) if (k in payload) updateData[k] = payload[k]

    // Normalizar imágenes: aceptamos string[], JSON string o vacío
    if ('images' in updateData) {
      const v = updateData.images
      if (typeof v === 'string') {
        try { updateData.images = JSON.parse(v) } catch { updateData.images = [] }
      }
      if (!Array.isArray(updateData.images)) updateData.images = []
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', params.id) // RLS asegura ownership: user_id = auth.uid()
      .select('*')
      .single()

    if (error) {
      console.error('Error updating property:', error)
      return NextResponse.json({ 
        ok: false, 
        error: error.message 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      ok: true, 
      property: data 
    })

  } catch (error) {
    console.error('Error in PATCH /api/properties/[id]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
