import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateAgencyShareMetaTags } from '@/lib/share/metatags';
import InmobiliariaProfileClient from './inmobiliaria-profile-client';

// Tipos
interface InmobiliariaProfile {
  id: string;
  company_name: string;
  logo_url: string | null;
  verified: boolean;
  phone: string | null;
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

// Generar metadata dinámica para SEO (B5 Enhanced)
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const supabase = createClient();
    
    // Obtener datos de la inmobiliaria
    const { data: inmobiliaria } = await supabase
      .from('users')
      .select('company_name, description, logo_url, verified, city, province')
      .eq('id', params.id)
      .eq('role', 'inmobiliaria')
      .single();

    if (!inmobiliaria) {
      return {
        title: 'Inmobiliaria no encontrada | Misiones Arrienda',
        description: 'La inmobiliaria que buscas no existe o ha sido removida.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    // Contar propiedades activas
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
      const description = inmobiliaria.description
        ? `${inmobiliaria.description.substring(0, 155)}...`
        : `Propiedades de ${inmobiliaria.company_name} en Misiones. ${
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

  // Fetch del perfil de la inmobiliaria
  const supabase = createClient();
  
  const { data: inmobiliaria, error } = await supabase
    .from('users')
    .select(`
      id,
      company_name,
      logo_url,
      verified,
      phone,
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
    .eq('role', 'inmobiliaria')
    .single();

  // Si no existe o hay error, mostrar 404
  if (error || !inmobiliaria) {
    notFound();
  }

  // Fetch inicial de propiedades (primera página)
  const { data: properties, count } = await supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('user_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(0, 11); // Primera página de 12 items

  // Preparar datos para el componente cliente
  const profileData: InmobiliariaProfile = {
    id: inmobiliaria.id,
    company_name: inmobiliaria.company_name,
    logo_url: inmobiliaria.logo_url,
    verified: inmobiliaria.verified || false,
    phone: inmobiliaria.show_phone_public ? inmobiliaria.phone : null,
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
      />
    </>
  );
}

// Configuración de la página
export const revalidate = 300; // Revalidar cada 5 minutos
