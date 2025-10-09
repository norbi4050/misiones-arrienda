import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Evitar caching agresivo durante desarrollo
export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Query 1: Obtener propiedad por ID SIN JOIN (más robusto)
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

    // Query 2: Obtener info del dueño desde auth.users (raw_user_meta_data)
    let ownerData = null;
    if (property.user_id) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(property.user_id);
        
        if (authUser?.user) {
          const metadata = authUser.user.user_metadata || {};
          ownerData = {
            id: authUser.user.id,
            user_type: metadata.userType || null,
            company_name: metadata.companyName || null,
          };
        }
      } catch (ownerError) {
        console.warn('Error fetching owner from auth:', ownerError);
        // Continuar sin owner - no es crítico
      }
    }

    // Query 3: Resolver agent desde user_profiles (usando id en lugar de user_id)
    let agent = null;
    if (property.user_id) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', property.user_id)
          .maybeSingle()
        
        if (profile) {
          agent = {
            id: profile.id,
            full_name: profile.display_name || ownerData?.company_name || 'Propietario',
            email: null, // No disponible en user_profiles
            phone: null, // No disponible en user_profiles
            photos: null
          }
        }
      } catch (profileError) {
        console.warn('Error fetching agent profile:', profileError)
        // Continuar sin agente - no es crítico
        agent = null
      }
    }

    // FASE 6: Aplanar owner info antes de responder
    const enrichedProperty = {
      ...property,
      owner_id: ownerData?.id || null,
      owner_type: ownerData?.user_type || null,
      owner_company_name: ownerData?.company_name || null,
    };

    // Responder SIEMPRE objeto
    return NextResponse.json({ 
      ok: true, 
      property: enrichedProperty, 
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
