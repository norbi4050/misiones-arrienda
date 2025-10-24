// =====================================================
// B5 - OG IMAGE PROPERTY
// Genera Open Graph image dinámica para propiedades
// =====================================================

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// Force dynamic rendering for OG images
export const dynamic = 'force-dynamic';

// NOTA: Cambiado de 'edge' a 'nodejs' porque Supabase no es compatible con Edge Runtime
// export const runtime = 'edge';
export const runtime = 'nodejs';

/**
 * Genera imagen OG para una propiedad
 * GET /api/og/property?id={propertyId}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('id');

    if (!propertyId) {
      return new Response('Missing property ID', { status: 400 });
    }

    // Obtener datos de la propiedad
    const supabase = createServerSupabase();
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, title, price, currency, city, property_type, bedrooms, bathrooms, area')
      .eq('id', propertyId)
      .single();

    if (error || !property) {
      // Fallback: Imagen genérica
      return generateFallbackImage('Propiedad no encontrada');
    }

    // Formatear precio
    const formattedPrice = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: property.currency || 'ARS',
      minimumFractionDigits: 0,
    }).format(property.price);

    // Tipo de propiedad en español
    const propertyTypes: Record<string, string> = {
      APARTMENT: 'Departamento',
      HOUSE: 'Casa',
      COMMERCIAL: 'Local Comercial',
      LAND: 'Terreno',
      OFFICE: 'Oficina',
      WAREHOUSE: 'Depósito',
      PH: 'PH',
      STUDIO: 'Monoambiente',
    };
    const typeLabel = propertyTypes[property.property_type] || property.property_type;

    // Generar imagen
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {/* Contenedor principal */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '60px',
              margin: '40px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxWidth: '1000px',
            }}
          >
            {/* Logo/Marca */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                🏠 Misiones Arrienda
              </div>
            </div>

            {/* Título de la propiedad */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#1a202c',
                textAlign: 'center',
                marginBottom: '20px',
                lineHeight: 1.2,
                maxWidth: '900px',
              }}
            >
              {property.title.length > 60
                ? property.title.substring(0, 60) + '...'
                : property.title}
            </div>

            {/* Detalles */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
                marginBottom: '30px',
                fontSize: '32px',
                color: '#4a5568',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🏷️</span>
                <span>{typeLabel}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📍</span>
                <span>{property.city}</span>
              </div>
            </div>

            {/* Características */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                marginBottom: '40px',
                fontSize: '28px',
                color: '#718096',
              }}
            >
              {property.bedrooms > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛏️</span>
                  <span>{property.bedrooms} dorm</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚿</span>
                  <span>{property.bathrooms} baños</span>
                </div>
              )}
              {property.area > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📐</span>
                  <span>{property.area} m²</span>
                </div>
              )}
            </div>

            {/* Precio */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {formattedPrice}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('[OG Image Property] Error:', error);
    return generateFallbackImage('Error generando imagen');
  }
}

/**
 * Genera imagen fallback genérica
 */
function generateFallbackImage(message: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '80px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: '120px', marginBottom: '30px' }}>🏠</div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '20px',
            }}
          >
            Misiones Arrienda
          </div>
          <div
            style={{
              fontSize: '32px',
              color: '#4a5568',
              textAlign: 'center',
            }}
          >
            {message}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
