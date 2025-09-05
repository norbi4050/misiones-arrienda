import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const { userId } = params;

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario puede acceder a estos analytics
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener estadísticas de propiedades
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId);

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json({ error: 'Error al obtener propiedades' }, { status: 500 });
    }

    // Calcular métricas
    const totalProperties = properties?.length || 0;
    const activeProperties = properties?.filter(p => p.status === 'AVAILABLE').length || 0;
    const rentedProperties = properties?.filter(p => p.status === 'RENTED').length || 0;
    const soldProperties = properties?.filter(p => p.status === 'SOLD').length || 0;
    const featuredProperties = properties?.filter(p => p.is_featured).length || 0;

    // Distribución por tipo
    const propertyTypes = properties?.reduce((acc: any, property: any) => {
      const type = property.type || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Distribución por estado
    const statusDistribution = properties?.reduce((acc: any, property: any) => {
      const status = property.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Rango de precios
    const prices = properties?.map(p => p.price).filter(p => p && p > 0) || [];
    const priceStats = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      median: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)]
    } : {
      min: 0,
      max: 0,
      average: 0,
      median: 0
    };

    // Métricas de rendimiento (simuladas - en producción vendrían de analytics reales)
    const performanceMetrics = {
      totalViews: Math.floor(Math.random() * 1000) + totalProperties * 10,
      totalInquiries: Math.floor(Math.random() * 100) + totalProperties * 2,
      totalFavorites: Math.floor(Math.random() * 200) + totalProperties * 5,
      conversionRate: totalProperties > 0 ? Math.round((rentedProperties + soldProperties) / totalProperties * 100) : 0,
      averageViewsPerProperty: totalProperties > 0 ? Math.round((Math.floor(Math.random() * 1000) + totalProperties * 10) / totalProperties) : 0
    };

    // Actividad reciente (últimas 30 propiedades)
    const recentActivity = properties?.slice(0, 30).map(property => ({
      id: property.id,
      title: property.title,
      type: property.type,
      status: property.status,
      price: property.price,
      created_at: property.created_at,
      updated_at: property.updated_at,
      is_featured: property.is_featured,
      views: Math.floor(Math.random() * 100) + 10,
      inquiries: Math.floor(Math.random() * 10) + 1,
      favorites: Math.floor(Math.random() * 20) + 2
    })) || [];

    // Propiedades destacadas
    const topPerforming = properties?.filter(p => p.is_featured)
      .slice(0, 10)
      .map(property => ({
        id: property.id,
        title: property.title,
        type: property.type,
        status: property.status,
        price: property.price,
        is_featured: property.is_featured,
        performance_score: Math.floor(Math.random() * 100) + 50,
        views: Math.floor(Math.random() * 200) + 50,
        inquiries: Math.floor(Math.random() * 20) + 5,
        favorites: Math.floor(Math.random() * 50) + 10
      })) || [];

    // Análisis de conversión por tipo
    const conversionByType = Object.keys(propertyTypes).reduce((acc: any, type) => {
      const typeProperties = properties?.filter(p => p.type === type) || [];
      const convertedProperties = typeProperties.filter(p => p.status === 'RENTED' || p.status === 'SOLD');
      acc[type] = {
        total: typeProperties.length,
        converted: convertedProperties.length,
        rate: typeProperties.length > 0 ? Math.round((convertedProperties.length / typeProperties.length) * 100) : 0
      };
      return acc;
    }, {});

    const analytics = {
      summary: {
        totalProperties,
        activeProperties,
        rentedProperties,
        soldProperties,
        featuredProperties,
        conversionRate: performanceMetrics.conversionRate
      },
      distribution: {
        byType: propertyTypes,
        byStatus: statusDistribution
      },
      pricing: priceStats,
      performance: performanceMetrics,
      recentActivity,
      topPerforming,
      conversionAnalysis: conversionByType,
      trends: {
        lastMonth: {
          newProperties: Math.floor(Math.random() * 10) + 1,
          rentedProperties: Math.floor(Math.random() * 5) + 1,
          soldProperties: Math.floor(Math.random() * 3) + 1,
          totalViews: Math.floor(Math.random() * 500) + 100,
          totalInquiries: Math.floor(Math.random() * 50) + 10
        },
        growth: {
          properties: Math.floor(Math.random() * 20) - 10, // -10 to +10
          views: Math.floor(Math.random() * 30) - 15, // -15 to +15
          inquiries: Math.floor(Math.random() * 40) - 20, // -20 to +20
          conversions: Math.floor(Math.random() * 25) - 12 // -12 to +13
        }
      },
      recommendations: [
        {
          type: 'pricing',
          message: priceStats.average > 0 ? 
            `El precio promedio de tus propiedades es $${priceStats.average.toLocaleString()}` :
            'Agrega precios a tus propiedades para obtener mejores análisis',
          priority: 'medium'
        },
        {
          type: 'featured',
          message: featuredProperties < totalProperties * 0.3 ? 
            'Considera destacar más propiedades para aumentar la visibilidad' :
            'Buen balance de propiedades destacadas',
          priority: featuredProperties < totalProperties * 0.1 ? 'high' : 'low'
        },
        {
          type: 'status',
          message: activeProperties < totalProperties * 0.5 ? 
            'Muchas propiedades inactivas. Revisa y actualiza los estados' :
            'Buen porcentaje de propiedades activas',
          priority: activeProperties < totalProperties * 0.3 ? 'high' : 'medium'
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error in properties analytics API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const { userId } = params;

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { action, propertyIds, data } = body;

    switch (action) {
      case 'track_view':
        // Registrar vista de propiedad
        // En producción, esto se guardaría en una tabla de analytics
        return NextResponse.json({ 
          success: true, 
          message: 'Vista registrada',
          tracked: propertyIds?.length || 1
        });

      case 'track_inquiry':
        // Registrar consulta
        return NextResponse.json({ 
          success: true, 
          message: 'Consulta registrada',
          tracked: propertyIds?.length || 1
        });

      case 'track_favorite':
        // Registrar favorito
        return NextResponse.json({ 
          success: true, 
          message: 'Favorito registrado',
          tracked: propertyIds?.length || 1
        });

      case 'update_performance':
        // Actualizar métricas de rendimiento
        return NextResponse.json({ 
          success: true, 
          message: 'Métricas actualizadas',
          updated: propertyIds?.length || 0
        });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in properties analytics POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
