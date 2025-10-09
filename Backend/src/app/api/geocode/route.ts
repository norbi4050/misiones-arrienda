import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const geocodeSchema = z.object({
  address: z.string().min(1, 'Dirección requerida'),
  city: z.string().min(1, 'Ciudad requerida'),
  province: z.string().default('Misiones'),
  country: z.string().default('Argentina')
});

export async function POST(request: NextRequest) {
  try {
    // Validar datos de entrada
    const body = await request.json();
    const validation = geocodeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { address, city, province, country } = validation.data;
    
    // Construir query para Nominatim
    const fullAddress = `${address}, ${city}, ${province}, ${country}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Usar Nominatim (OpenStreetMap) - gratuito, sin API key
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=ar`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'MisionesArrienda/1.0 (contact@misiones-arrienda.com)' // Requerido por Nominatim
      }
    });

    if (!response.ok) {
      throw new Error('Error en servicio de geocodificación');
    }

    const results = await response.json();
    
    if (!results || results.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron coordenadas para esta dirección',
        suggestion: 'Verificá que la dirección sea correcta y específica'
      }, { status: 404 });
    }

    const result = results[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Validar que las coordenadas estén en Argentina (aproximadamente)
    if (lat < -55 || lat > -21 || lng < -73 || lng > -53) {
      return NextResponse.json({ 
        error: 'Las coordenadas encontradas no parecen estar en Argentina',
        coordinates: { lat, lng },
        suggestion: 'Verificá la dirección o ajustá manualmente en el mapa'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      coordinates: { lat, lng },
      display_name: result.display_name,
      confidence: result.importance || 0.5
    });

  } catch (error) {
    console.error('Error in geocode API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      suggestion: 'Intentá nuevamente o ajustá las coordenadas manualmente'
    }, { status: 500 });
  }
}
