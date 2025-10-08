import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Crear cliente de Supabase
    const supabase = createClient();

    // Obtener perfil público de la inmobiliaria
    // Solo seleccionamos campos públicos
    const { data: inmobiliaria, error } = await supabase
      .from('users')
      .select(`
        id,
        company_name,
        logo_url,
        verified,
        phone,
        commercial_phone,
        address,
        website,
        facebook,
        instagram,
        tiktok,
        description,
        show_phone_public,
        show_address_public,
        created_at
      `)
      .eq('id', id)
      .eq('user_type', 'inmobiliaria')
      .single();

    if (error || !inmobiliaria) {
      return NextResponse.json(
        { error: 'Inmobiliaria no encontrada' },
        { status: 404 }
      );
    }

    // Construir perfil público respetando configuración de privacidad
    const publicProfile: InmobiliariaPublicProfile = {
      id: inmobiliaria.id,
      company_name: inmobiliaria.company_name,
      logo_url: inmobiliaria.logo_url,
      verified: inmobiliaria.verified || false,
      // Solo mostrar teléfonos si show_phone_public es true
      phone: inmobiliaria.show_phone_public ? inmobiliaria.phone : null,
      commercial_phone: inmobiliaria.show_phone_public ? inmobiliaria.commercial_phone : null,
      // Solo mostrar dirección si show_address_public es true
      address: inmobiliaria.show_address_public ? inmobiliaria.address : null,
      website: inmobiliaria.website,
      facebook: inmobiliaria.facebook,
      instagram: inmobiliaria.instagram,
      tiktok: inmobiliaria.tiktok,
      description: inmobiliaria.description,
      show_phone_public: inmobiliaria.show_phone_public || false,
      show_address_public: inmobiliaria.show_address_public || false,
      created_at: inmobiliaria.created_at,
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
