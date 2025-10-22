import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNotification } from '@/lib/notification-service'
import { detectAuth, isPublicListingEnabled } from '@/lib/auth-detector'
import { maskPhone, limitArray, parseArrayField } from '@/lib/data-masking'

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
    let enrichedProperty = {
      ...property,
      owner_id: ownerData?.id || null,
      owner_type: ownerData?.user_type || null,
      owner_company_name: ownerData?.company_name || null,
    };

    // ========================================
    // FEATURE: Public Property Listing
    // Adaptar response según estado de autenticación
    // ========================================
    const publicListingEnabled = isPublicListingEnabled();
    let auth_required_for_full_details = false;

    if (publicListingEnabled) {
      // Detectar si el usuario está autenticado
      const authContext = await detectAuth(_ as any);

      // Si NO está autenticado, limitar datos sensibles
      if (!authContext.isAuthenticated) {
        const images = parseArrayField(enrichedProperty.images);
        const totalImages = images.length;

        enrichedProperty = {
          ...enrichedProperty,
          // Enmascarar contacto
          contact_phone: maskPhone(enrichedProperty.contact_phone),
          contact_email: null,
          contact_name: null,

          // Limitar imágenes a 3
          images: limitArray(images, 3),

          // Flags
          requires_auth_for_contact: true,
          requires_auth_for_full_images: totalImages > 3,
          total_images_count: totalImages
        };

        auth_required_for_full_details = true;
      } else {
        // Usuario autenticado: agregar flags en false
        enrichedProperty = {
          ...enrichedProperty,
          requires_auth_for_contact: false,
          requires_auth_for_full_images: false
        };
      }
    }

    // Responder SIEMPRE objeto
    return NextResponse.json({
      ok: true,
      property: enrichedProperty,
      agent,
      auth_required_for_full_details
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

    // Obtener estado actual antes de actualizar (para detectar cambios de status)
    const { data: currentProperty } = await supabase
      .from('properties')
      .select('status, title, user_id')
      .eq('id', params.id)
      .single()

    // Campos permitidos (evitamos tocar user_id/status/created_at, etc.)
    const allowed = [
      'title','description','price','operation_type','property_type',
      'bedrooms','bathrooms','area','city','province','address',
      'latitude','longitude','images','featured','status'
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

    // SAFE-FIX: Sanitizar operation_type (validar valores en español)
    if ('operation_type' in updateData) {
      const validOperations = ['alquiler', 'venta', 'ambos'];
      if (!validOperations.includes(updateData.operation_type)) {
        // Si viene en inglés, convertir a español
        const englishToSpanish: Record<string, string> = {
          'RENT': 'alquiler',
          'SALE': 'venta',
          'BOTH': 'ambos'
        };
        updateData.operation_type = englishToSpanish[updateData.operation_type] || 'alquiler';
      }
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

    // Enviar notificación si cambió el status
    if (currentProperty && 'status' in updateData && updateData.status !== currentProperty.status) {
      const statusLabels: Record<string, string> = {
        'PUBLISHED': 'publicada',
        'DRAFT': 'en borrador',
        'ARCHIVED': 'archivada',
        'SOLD': 'vendida',
        'RENTED': 'alquilada',
        'PENDING': 'pendiente'
      }

      const newStatusLabel = statusLabels[updateData.status] || updateData.status

      try {
        await sendNotification({
          userId: currentProperty.user_id,
          type: 'PROPERTY_STATUS_CHANGED',
          title: `Estado de tu propiedad actualizado`,
          message: `Tu propiedad "${currentProperty.title}" ahora está ${newStatusLabel}.`,
          channels: ['in_app'],
          metadata: {
            propertyId: params.id,
            propertyTitle: currentProperty.title,
            oldStatus: currentProperty.status,
            newStatus: updateData.status,
            ctaUrl: `/mi-cuenta/publicaciones/${params.id}`,
            ctaText: 'Ver propiedad'
          }
        })
      } catch (notifError) {
        console.error('Error enviando notificación de cambio de status:', notifError)
      }
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
