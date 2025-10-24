import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateAgencyShareMetaTags } from '@/lib/share/metatags';
import { getPropertyCoverImage } from '@/lib/property-images.server';
import InmobiliariaProfileClient from './inmobiliaria-profile-client';

// Tipos
interface InmobiliariaProfile {
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
  business_hours: any | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  show_phone_public: boolean;
  show_address_public: boolean;
  show_team_public: boolean;
  show_hours_public: boolean;
  show_map_public: boolean;
  show_stats_public: boolean;
  is_founder: boolean;
  created_at: string;
}

interface TeamMember {
  id: string;
  agency_id: string;
  name: string;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgencyStats {
  total_properties: number;
  active_properties: number;
  average_price: number;
  properties_this_month: number;
}

// Generar metadata dinámica para SEO (B5 Enhanced)
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    // Obtener datos desde auth.users
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(params.id);
    
    if (!authUser?.user) {
      return {
        title: 'Inmobiliaria no encontrada | Misiones Arrienda',
        description: 'La inmobiliaria que buscas no existe o ha sido removida.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const metadata = authUser.user.user_metadata || {};
    
    // Verificar que sea inmobiliaria
    if (metadata.userType !== 'inmobiliaria') {
      return {
        title: 'Inmobiliaria no encontrada | Misiones Arrienda',
        description: 'La inmobiliaria que buscas no existe o ha sido removida.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    // Construir objeto inmobiliaria desde metadata
    const inmobiliaria = {
      company_name: metadata.companyName || 'Inmobiliaria',
      description: null,
      logo_url: metadata.profileImage || null,
      verified: false,
      city: 'Misiones',
      province: 'Misiones',
    };

    // Contar propiedades activas
    const supabase = createClient();
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', params.id)
      .eq('is_active', true);

    // B5: Usar nuevo helper con canonical URLs y OG images
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Preparar datos de la agencia para B5
    const agencyData = {
      id: params.id,
      company_name: inmobiliaria.company_name,
      description: inmobiliaria.description,
      logo_url: inmobiliaria.logo_url,
      verified: inmobiliaria.verified,
      city: inmobiliaria.city || 'Misiones',
      province: inmobiliaria.province || 'Misiones',
    };

    try {
      const metaTags = await generateAgencyShareMetaTags(agencyData, baseUrl, propertiesCount || 0);
      return metaTags;
    } catch (error) {
      console.error('[B5] Error generating agency share metatags, falling back to legacy:', error);
      
      // Fallback al sistema anterior
      const title = `${inmobiliaria.company_name} | Inmobiliaria en Misiones — Misiones Arrienda`;
      const description = `Propiedades de ${inmobiliaria.company_name} en Misiones. ${
        inmobiliaria.verified ? 'Verificada, ' : ''
      }con precios visibles y contacto directo.`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          type: 'profile',
          images: inmobiliaria.logo_url
            ? [
                {
                  url: inmobiliaria.logo_url,
                  width: 400,
                  height: 400,
                  alt: `Logo de ${inmobiliaria.company_name}`,
                },
              ]
            : [],
        },
        twitter: {
          card: 'summary',
          title,
          description,
          images: inmobiliaria.logo_url ? [inmobiliaria.logo_url] : [],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Inmobiliaria | Misiones Arrienda',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// Página principal (Server Component)
export default async function InmobiliariaPublicPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

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
      is_founder,
      created_at,
      header_image_url,
      tagline,
      primary_color,
      secondary_color,
      founded_year,
      values
    `)
    .eq('id', id)
    .eq('user_type', 'inmobiliaria')
    .single();
  
  if (profileError || !inmobiliariaData) {
    console.error('[Page] Error fetching inmobiliaria profile:', profileError);
    notFound();
  }

  // Usar datos reales de la tabla users
  const inmobiliaria = {
    id: inmobiliariaData.id,
    company_name: inmobiliariaData.company_name || 'Inmobiliaria',
    logo_url: inmobiliariaData.logo_url,
    verified: inmobiliariaData.verified || false,
    phone: inmobiliariaData.phone,
    commercial_phone: inmobiliariaData.commercial_phone,
    address: inmobiliariaData.address,
    website: inmobiliariaData.website,
    facebook: inmobiliariaData.facebook,
    instagram: inmobiliariaData.instagram,
    tiktok: inmobiliariaData.tiktok,
    description: inmobiliariaData.description,
    business_hours: inmobiliariaData.business_hours,
    timezone: inmobiliariaData.timezone || 'America/Argentina/Buenos_Aires',
    latitude: inmobiliariaData.latitude,
    longitude: inmobiliariaData.longitude,
    show_phone_public: inmobiliariaData.show_phone_public || false,
    show_address_public: inmobiliariaData.show_address_public || false,
    show_team_public: inmobiliariaData.show_team_public || false,
    show_hours_public: inmobiliariaData.show_hours_public || false,
    show_map_public: inmobiliariaData.show_map_public || false,
    show_stats_public: inmobiliariaData.show_stats_public || false,
    is_founder: inmobiliariaData.is_founder || false,
    created_at: inmobiliariaData.created_at,
    header_image_url: inmobiliariaData.header_image_url,
    tagline: inmobiliariaData.tagline,
    primary_color: inmobiliariaData.primary_color,
    secondary_color: inmobiliariaData.secondary_color,
    founded_year: inmobiliariaData.founded_year,
    values: inmobiliariaData.values,
  };

  const supabase = createClient();

  // Fetch inicial de propiedades (primera página)
  const { data: rawProperties, count } = await supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('user_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(0, 11); // Primera página de 12 items

  // Generar signed URLs para las propiedades iniciales
  const properties = await Promise.all(
    (rawProperties || []).map(async (prop) => {
      const coverUrl = await getPropertyCoverImage(
        prop.id,
        id,
        prop.cover_url || undefined
      );
      
      return {
        ...prop,
        cover_url: coverUrl
      };
    })
  );

  // FASE 5: Fetch team members
  const { data: teamMembers } = await supabase
    .from('agency_team_members')
    .select('*')
    .eq('agency_id', id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(2);

  // FASE 5: Fetch stats (con error handling mejorado)
  let stats: AgencyStats | null = null;
  try {
    const statsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/inmobiliarias/${id}/stats`,
      { 
        next: { revalidate: 300 }
        // Removido cache: 'no-store' para evitar warning de Next.js
      }
    );
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      stats = statsData.stats || null;
      console.log('[Stats] Loaded successfully for agency:', id);
    } else {
      console.warn(`[Stats] Failed with status ${statsResponse.status} for agency:`, id);
      // Continuar sin stats - no bloquear la página
    }
  } catch (error) {
    console.error('[Stats] Error fetching for agency:', id, error);
    // Continuar sin stats - degradación elegante
  }

  // Preparar datos para el componente cliente
  const profileData: InmobiliariaProfile = {
    id: inmobiliaria.id,
    company_name: inmobiliaria.company_name,
    logo_url: inmobiliaria.logo_url,
    verified: inmobiliaria.verified || false,
    phone: inmobiliaria.show_phone_public ? inmobiliaria.phone : null,
    commercial_phone: inmobiliaria.show_phone_public ? inmobiliaria.commercial_phone : null,
    address: inmobiliaria.show_address_public ? inmobiliaria.address : null,
    website: inmobiliaria.website,
    facebook: inmobiliaria.facebook,
    instagram: inmobiliaria.instagram,
    tiktok: inmobiliaria.tiktok,
    description: inmobiliaria.description,
    business_hours: inmobiliaria.business_hours,
    timezone: inmobiliaria.timezone || 'America/Argentina/Buenos_Aires',
    latitude: inmobiliaria.show_map_public ? inmobiliaria.latitude : null,
    longitude: inmobiliaria.show_map_public ? inmobiliaria.longitude : null,
    show_phone_public: inmobiliaria.show_phone_public || false,
    show_address_public: inmobiliaria.show_address_public || false,
    show_team_public: inmobiliaria.show_team_public || false,
    show_hours_public: inmobiliaria.show_hours_public || false,
    show_map_public: inmobiliaria.show_map_public || false,
    show_stats_public: inmobiliaria.show_stats_public || false,
    is_founder: inmobiliaria.is_founder || false,
    created_at: inmobiliaria.created_at,
    header_image_url: inmobiliaria.header_image_url,
    tagline: inmobiliaria.tagline,
    primary_color: inmobiliaria.primary_color,
    secondary_color: inmobiliaria.secondary_color,
    founded_year: inmobiliaria.founded_year,
    values: inmobiliaria.values,
    email: '', // Will be populated from user context if needed
  };

  // Structured Data para SEO (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: inmobiliaria.company_name,
    image: inmobiliaria.logo_url || undefined,
    url: `https://misionesarrienda.com/inmobiliaria/${id}`,
    description: inmobiliaria.description || undefined,
    telephone: inmobiliaria.show_phone_public ? inmobiliaria.phone : undefined,
    address: inmobiliaria.show_address_public
      ? {
          '@type': 'PostalAddress',
          addressLocality: 'Misiones',
          addressCountry: 'AR',
          streetAddress: inmobiliaria.address,
        }
      : undefined,
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Componente Cliente con interactividad */}
      <InmobiliariaProfileClient
        profile={profileData}
        initialProperties={properties || []}
        totalProperties={count || 0}
        teamMembers={teamMembers || []}
        stats={stats}
      />
    </>
  );
}

// Configuración de la página
export const revalidate = 300; // Revalidar cada 5 minutos
