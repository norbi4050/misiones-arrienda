// =====================================================
// B5 - OG IMAGE AGENCY
// Genera Open Graph image dinámica para inmobiliarias
// =====================================================

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export const runtime = 'edge';

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
          <div style={{ fontSize: '120px', marginBottom: '30px' }}>🏢</div>
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

/**
 * Genera imagen OG para una inmobiliaria
 * GET /api/og/agency?id={agencyId}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('id');

    if (!agencyId) {
      return new Response('Missing agency ID', { status: 400 });
    }

    // Obtener datos de la inmobiliaria
    const supabase = createServerSupabase();
    const { data: agency, error } = await supabase
      .from('inmobiliarias')
      .select('id, company_name, city, province, verified, description')
      .eq('id', agencyId)
      .single();

    if (error || !agency) {
      // Fallback: Imagen genérica
      return generateFallbackImage('Inmobiliaria no encontrada');
    }

    // Contar propiedades activas
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('inmobiliaria_id', agencyId)
      .in('status', ['AVAILABLE', 'PUBLISHED']);

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
            {/* Logo/Ícono */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '160px',
                height: '160px',
                borderRadius: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                marginBottom: '40px',
                fontSize: '80px',
              }}
            >
              🏢
            </div>

            {/* Nombre de la inmobiliaria */}
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
              {agency.company_name.length > 40
                ? agency.company_name.substring(0, 40) + '...'
                : agency.company_name}
            </div>

            {/* Badge de verificación */}
            {agency.verified && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#48bb78',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '30px',
                }}
              >
                <span>✓</span>
                <span>Verificada</span>
              </div>
            )}

            {/* Ubicación */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '30px',
                fontSize: '32px',
                color: '#4a5568',
              }}
            >
              <span>📍</span>
              <span>{agency.city}, {agency.province}</span>
            </div>

            {/* Estadísticas */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
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
                  {propertiesCount || 0}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    color: '#718096',
                  }}
                >
                  Propiedades
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                fontSize: '28px',
                color: '#a0aec0',
                textAlign: 'center',
              }}
            >
              Misiones Arrienda
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
    console.error('[OG Image Agency] Error:', error);
    return generateFallbackImage('Error generando imagen');
  }
}
