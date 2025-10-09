import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Tipo para el perfil público de inmobiliaria
interface InmobiliariaPublicProfile {
  id: string;
  company_name: string;
  logo_url: string | null;
  verified: boolean;
  phone: string | null;
  commercial_phone: string | null;
  address: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  description: string | null;
  show_phone_public: boolean;
  show_address_public: boolean;
  created_at: string;
}

/**
 * GET /api/inmobiliarias/[id]
 * 
 * Obtiene el perfil público de una inmobiliaria
 * Solo expone campos aptos para exhibición pública
 * 
 * Campos NO expuestos por seguridad:
 * - email
 * - cuit
 * - password_hash
 * - role
 * - verified_at
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validar ID
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'ID de inmobiliaria inválido' },
        { status: 400 }
      );
    }

    // ✅ FIX: Obtener datos completos desde la tabla users
    const { data: inmobiliariaData, error: profileError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        company_name, 
        phone, 
        address, 
        website, 
        facebook, 
        instagram, 
        tiktok, 
        description, 
        logo_url, 
        verified, 
        user_type,
        commercial_phone,
        business_hours,
        timezone,
        latitude,
        longitude,
        show_team_public,
        show_hours_public,
        show_map_public,
        show_stats_public,
        show_phone_public,
        show_address_public,
        created_at
      `)
      .eq('id', id)
      .eq('user_type', 'inmobiliaria')
      .single();
    
    if (profileError || !inmobiliariaData) {
      console.error('[API] Error fetching inmobiliaria profile:', profileError);
      return NextResponse.json(
        { error: 'Inmobiliaria no encontrada' },
        { status: 404 }
      );
    }

    // Construir perfil público respetando configuración de privacidad
    const publicProfile: InmobiliariaPublicProfile = {
      id: inmobiliariaData.id,
      company_name: inmobiliariaData.company_name || 'Inmobiliaria',
      logo_url: inmobiliariaData.logo_url,
      verified: inmobiliariaData.verified || false,
      // Solo mostrar teléfonos si show_phone_public es true
      phone: inmobiliariaData.show_phone_public ? inmobiliariaData.phone : null,
      commercial_phone: inmobiliariaData.show_phone_public ? inmobiliariaData.commercial_phone : null,
      // Solo mostrar dirección si show_address_public es true
      address: inmobiliariaData.show_address_public ? inmobiliariaData.address : null,
      // Redes sociales y website siempre públicos
      website: inmobiliariaData.website,
      facebook: inmobiliariaData.facebook,
      instagram: inmobiliariaData.instagram,
      tiktok: inmobiliariaData.tiktok,
      description: inmobiliariaData.description,
      show_phone_public: inmobiliariaData.show_phone_public || false,
      show_address_public: inmobiliariaData.show_address_public || false,
      created_at: inmobiliariaData.created_at,
    };

    return NextResponse.json(publicProfile, {
      status: 200,
      headers: {
        // Cache por 5 minutos, revalidar en background por 10 minutos
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/inmobiliarias/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
