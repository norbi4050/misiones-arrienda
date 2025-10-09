/**
 * 📊 PANEL DE KPIs B7
 * 
 * Dashboard específico para KPIs de inmobiliarias y propiedades
 * Usa las vistas creadas en B7-FIX-ULTRA-FINAL-2025.sql
 */

"use client";

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, MessageSquare, TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import Link from 'next/link';

interface KPIDaily {
  day: string;
  total_events?: number;
  unique_sessions?: number;
  total_views?: number;
  total_leads?: number;
  total_signups?: number;
}

interface PropertyViewDaily {
  day: string;
  property_id: string;
  total_views: number;
  unique_sessions: number;
}

interface Last24hMetrics {
  page_view: number;
  property_view: number;
  message_sent: number;
  share_click: number;
}

export default function AdminKPIsPage() {
  const { user, isLoading } = useSupabaseAuth();
  const [kpiDaily, setKpiDaily] = useState<KPIDaily[]>([]);
  const [propertyViews, setPropertyViews] = useState<PropertyViewDaily[]>([]);
  const [leadsDaily, setLeadsDaily] = useState<KPIDaily[]>([]);
  const [last24h, setLast24h] = useState<Last24hMetrics>({ page_view: 0, property_view: 0, message_sent: 0, share_click: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar si es admin (simplificado - en producción usar roles)
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('norbe');

  useEffect(() => {
    if (user && isAdmin) {
      fetchKPIData();
    }
  }, [user, isAdmin]);

  const fetchKPIData = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getBrowserSupabase();

      // Fetch property views daily (últimos 14 días, top 20)
      const { data: propViewsData, error: propViewsError } = await supabase
        .from('kpi_property_views_daily')
        .select('*')
        .order('day', { ascending: false })
        .limit(20);

      if (!propViewsError && propViewsData) {
        setPropertyViews(propViewsData);
      }

      // Fetch leads daily (últimos 14 días)
      const { data: leadsData, error: leadsError } = await supabase
        .from('kpi_leads_daily')
        .select('*')
        .order('day', { ascending: false })
        .limit(14);

      if (!leadsError && leadsData) {
        setLeadsDaily(leadsData);
      }

      // Calcular métricas de últimas 24h desde analytics_events
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: eventsData, error: eventsError } = await supabase
        .from('analytics_events')
        .select('event_name')
        .gte('event_time', yesterday.toISOString());

      if (!eventsError && eventsData) {
        const metrics: Last24hMetrics = {
          page_view: eventsData.filter((e: { event_name: string }) => e.event_name === 'page_view').length,
          property_view: eventsData.filter((e: { event_name: string }) => e.event_name === 'view_property' || e.event_name === 'property_view').length,
          message_sent: eventsData.filter((e: { event_name: string }) => e.event_name === 'message_sent').length,
          share_click: eventsData.filter((e: { event_name: string }) => e.event_name === 'share_click').length,
        };
        setLast24h(metrics);
      }

    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err instanceof Error ? err.message : 'Error cargando KPIs');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Auth check
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">
            Esta página está disponible solo para administradores.
          </p>
          <Link href="/admin/dashboard">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KPIs B7 - Inmobiliarias</h1>
              <p className="text-gray-600">Métricas de propiedades, perfiles y leads</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchKPIData} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Link href="/admin/analytics">
                <Button variant="outline" size="sm">
                  Ver Analytics General
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">⚠️ Error: {error}</p>
            <p className="text-sm text-red-600 mt-1">
              Verifica que las vistas KPI estén creadas en Supabase (B7-FIX-ULTRA-FINAL-2025.sql)
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando KPIs...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 4 Cards - Últimas 24h */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Métricas Últimas 24 Horas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Page Views</h4>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {last24h.page_view.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vistas de página</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Property Views</h4>
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {last24h.property_view.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vistas de propiedades</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Messages Sent</h4>
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {last24h.message_sent.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">mensajes enviados</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Share Clicks</h4>
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {last24h.share_click.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">compartidos</p>
                </div>
              </div>
            </div>

            {/* Tabla 1: Leads Daily */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Leads Diarios (Últimos 14 días)</h3>
              {leadsDaily.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Día</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Total Leads</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Usuarios Únicos</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Sesiones Únicas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {leadsDaily.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">
                            {new Date(row.day).toLocaleDateString('es-AR', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {row.total_leads?.toLocaleString() || 0}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {row.unique_sessions?.toLocaleString() || 0}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {row.unique_sessions?.toLocaleString() || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay datos de leads disponibles</p>
                  <p className="text-xs mt-1">Los datos aparecerán cuando haya actividad de contacto</p>
                </div>
              )}
            </div>

            {/* Tabla 2: Property Views Daily */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Vistas de Propiedades (Top 20 - Últimos 14 días)</h3>
              {propertyViews.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Día</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Property ID</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Total Views</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Sesiones Únicas</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">% Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {propertyViews.map((row, index) => {
                        const engagement = row.unique_sessions > 0 
                          ? ((row.unique_sessions / row.total_views) * 100).toFixed(1)
                          : '0.0';
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">
                              {new Date(row.day).toLocaleDateString('es-AR', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {row.property_id.substring(0, 8)}...
                              </code>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-blue-600">
                              {row.total_views.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {row.unique_sessions.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant={parseFloat(engagement) > 50 ? 'default' : 'secondary'}>
                                {engagement}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay datos de vistas de propiedades</p>
                  <p className="text-xs mt-1">Los datos aparecerán cuando haya vistas de propiedades</p>
                </div>
              )}
            </div>

            {/* Resumen de Leads */}
            {leadsDaily.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Resumen de Leads</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Leads (14 días)</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {leadsDaily.reduce((sum, row) => sum + (row.total_leads || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Promedio Diario</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(leadsDaily.reduce((sum, row) => sum + (row.total_leads || 0), 0) / leadsDaily.length).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Mejor Día</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.max(...leadsDaily.map(row => row.total_leads || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información del Sistema */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Vistas Disponibles</div>
                  <div className="text-gray-600">
                    kpi_property_views_daily, kpi_leads_daily, analytics_events
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Última Actualización</div>
                  <div className="text-gray-600">{new Date().toLocaleString('es-AR')}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Período de Datos</div>
                  <div className="text-gray-600">Últimos 14 días</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Nota:</strong> Este panel usa las vistas KPI creadas en B7. 
                  Si no ves datos, verifica que el SQL B7-FIX-ULTRA-FINAL-2025.sql se haya ejecutado correctamente.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
