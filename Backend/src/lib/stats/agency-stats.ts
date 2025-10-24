import { createClient } from '@/lib/supabase/server';

export interface AgencyStats {
  total_properties: number;
  active_properties: number;
  average_price: number;
  properties_this_month: number;
}

/**
 * Calcula estadísticas en tiempo real para una inmobiliaria
 * @param agencyId - ID de la inmobiliaria
 * @returns Estadísticas de la agencia o null si hay error
 */
export async function getAgencyStats(agencyId: string): Promise<AgencyStats | null> {
  try {
    const supabase = createClient();

    // Verificar que el usuario existe y es una inmobiliaria
    const { data: agency, error: agencyError } = await supabase
      .from('users')
      .select('id, company_name, user_type')
      .eq('id', agencyId)
      .eq('user_type', 'inmobiliaria')
      .single();

    if (agencyError || !agency) {
      console.error('[Stats] Error fetching agency:', agencyError);
      return null;
    }

    // 1. Total de propiedades
    const { count: totalProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', agencyId);

    // 2. Propiedades activas
    const { count: activeProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', agencyId)
      .eq('is_active', true);

    // 3. Precio promedio (solo propiedades activas)
    const { data: priceData } = await supabase
      .from('properties')
      .select('price')
      .eq('user_id', agencyId)
      .eq('is_active', true)
      .not('price', 'is', null);

    const averagePrice = priceData && priceData.length > 0
      ? Math.round(priceData.reduce((sum, p) => sum + (p.price || 0), 0) / priceData.length)
      : 0;

    // 4. Propiedades publicadas este mes
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: propertiesThisMonth } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', agencyId)
      .gte('created_at', firstDayOfMonth.toISOString());

    const stats: AgencyStats = {
      total_properties: totalProperties || 0,
      active_properties: activeProperties || 0,
      average_price: averagePrice,
      properties_this_month: propertiesThisMonth || 0,
    };

    console.log('[Stats] Loaded successfully for agency:', agencyId, stats);
    return stats;

  } catch (error) {
    console.error('[Stats] Error calculating for agency:', agencyId, error);
    return null;
  }
}
