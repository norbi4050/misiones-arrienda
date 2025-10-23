"use client";

import { useState, useEffect, useCallback } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Eye, MessageSquare, CreditCard, Calendar, Filter, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface KPIData {
  dau: Array<{ d: string; dau: number }>;
  funnel: {
    v_home: number;
    v_list: number;
    v_detail: number;
    start_pub: number;
    done_pub: number;
  };
  contactCtr: {
    property_views: number;
    contact_clicks: number;
    ctr_percentage: number;
  };
  messageConversion: {
    contact_clicks: number;
    messages_sent: number;
    conversion_percentage: number;
  };
  monetization: {
    feature_clicks: number;
    feature_prefs: number;
    feature_payments: number;
    sub_clicks: number;
    sub_activations: number;
  };
}

export default function AdminAnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Verificar autenticación y permisos de admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUser(user);
          // Verificar si es admin usando el mismo método que en otros componentes
          const adminEmails = ['misionesarrienda@gmail.com'];
          setIsAdmin(adminEmails.includes(user.email || ''));
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getBrowserSupabase();

      // Fetch DAU data
      const { data: dauData, error: dauError } = await supabase
        .from('kpi_dau')
        .select('*')
        .limit(parseInt(timeRange.replace('d', '')));

      if (dauError) throw dauError;

      // Fetch funnel data
      const { data: funnelData, error: funnelError } = await supabase
        .from('kpi_funnel_publish')
        .select('*')
        .single();

      if (funnelError) throw funnelError;

      // Fetch contact CTR
      const { data: ctrData, error: ctrError } = await supabase
        .from('kpi_contact_ctr')
        .select('*')
        .single();

      if (ctrError) throw ctrError;

      // Fetch message conversion
      const { data: msgData, error: msgError } = await supabase
        .from('kpi_message_conversion')
        .select('*')
        .single();

      if (msgError) throw msgError;

      // Fetch monetization
      const { data: monData, error: monError } = await supabase
        .from('kpi_monetization')
        .select('*')
        .single();

      if (monError) throw monError;

      setKpiData({
        dau: dauData || [],
        funnel: funnelData || { v_home: 0, v_list: 0, v_detail: 0, start_pub: 0, done_pub: 0 },
        contactCtr: ctrData || { property_views: 0, contact_clicks: 0, ctr_percentage: 0 },
        messageConversion: msgData || { contact_clicks: 0, messages_sent: 0, conversion_percentage: 0 },
        monetization: monData || { feature_clicks: 0, feature_prefs: 0, feature_payments: 0, sub_clicks: 0, sub_activations: 0 }
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [timeRange]); // Dependencias: timeRange

  useEffect(() => {
    if (user && isAdmin) {
      fetchAnalyticsData();
    }
  }, [user, isAdmin, fetchAnalyticsData]);

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
          <Link href="/dashboard">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const dauChartData = kpiData?.dau.map(item => ({
    date: new Date(item.d).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
    usuarios: item.dau
  })) || [];

  const funnelChartData = kpiData ? [
    { step: 'Home', usuarios: kpiData.funnel.v_home, color: '#3B82F6' },
    { step: 'Listado', usuarios: kpiData.funnel.v_list, color: '#10B981' },
    { step: 'Detalle', usuarios: kpiData.funnel.v_detail, color: '#F59E0B' },
    { step: 'Publicar', usuarios: kpiData.funnel.start_pub, color: '#EF4444' },
    { step: 'Completado', usuarios: kpiData.funnel.done_pub, color: '#8B5CF6' }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Métricas y KPIs de Misiones Arrienda</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                </select>
              </div>
              <Button onClick={fetchAnalyticsData} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando datos de analytics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">DAU Promedio</h4>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {kpiData?.dau.length ? Math.round(kpiData.dau.reduce((sum, item) => sum + item.dau, 0) / kpiData.dau.length) : 0}
                </div>
                <p className="text-xs text-gray-500">usuarios activos diarios</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">CTR Contacto</h4>
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {kpiData?.contactCtr.ctr_percentage.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">
                  {kpiData?.contactCtr.contact_clicks} clicks / {kpiData?.contactCtr.property_views} vistas
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Conversión Mensajes</h4>
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {kpiData?.messageConversion.conversion_percentage.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">
                  {kpiData?.messageConversion.messages_sent} mensajes enviados
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Pagos Destacados</h4>
                  <CreditCard className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {kpiData?.monetization.feature_payments || 0}
                </div>
                <p className="text-xs text-gray-500">
                  de {kpiData?.monetization.feature_clicks || 0} clicks
                </p>
              </div>
            </div>

            {/* Gráfico DAU Simplificado */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Usuarios Activos Diarios (DAU)</h3>
              <div className="space-y-2">
                {dauChartData.slice(0, 7).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.date}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((item.usuarios / Math.max(...dauChartData.map(d => d.usuarios))) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8">{item.usuarios}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel de Publicación Simplificado */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Funnel de Publicación</h3>
              <div className="space-y-4">
                {funnelChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-20">{item.step}</span>
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full" 
                          style={{ 
                            width: `${Math.min((item.usuarios / Math.max(...funnelChartData.map(d => d.usuarios))) * 100, 100)}%`,
                            backgroundColor: item.color
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{item.usuarios}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Tasas de conversión */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {kpiData?.funnel.v_list && kpiData?.funnel.v_home ? 
                      ((kpiData.funnel.v_list / kpiData.funnel.v_home) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Home → Listado</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {kpiData?.funnel.v_detail && kpiData?.funnel.v_list ? 
                      ((kpiData.funnel.v_detail / kpiData.funnel.v_list) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Listado → Detalle</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">
                    {kpiData?.funnel.start_pub && kpiData?.funnel.v_detail ? 
                      ((kpiData.funnel.start_pub / kpiData.funnel.v_detail) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Detalle → Publicar</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">
                    {kpiData?.funnel.done_pub && kpiData?.funnel.start_pub ? 
                      ((kpiData.funnel.done_pub / kpiData.funnel.start_pub) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Publicar → Completado</div>
                </div>
              </div>
            </div>

            {/* Métricas de Contacto y Monetización */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Contacto y Mensajería</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-semibold">CTR de Contacto</div>
                      <div className="text-sm text-gray-600">
                        {kpiData?.contactCtr.contact_clicks} clicks de {kpiData?.contactCtr.property_views} vistas
                      </div>
                    </div>
                    <Badge className="text-lg bg-blue-600">
                      {kpiData?.contactCtr.ctr_percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-semibold">Conversión a Mensaje</div>
                      <div className="text-sm text-gray-600">
                        {kpiData?.messageConversion.messages_sent} mensajes de {kpiData?.messageConversion.contact_clicks} clicks
                      </div>
                    </div>
                    <Badge className="text-lg bg-green-600">
                      {kpiData?.messageConversion.conversion_percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Monetización</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Destacados</span>
                      <Badge variant="outline">
                        {kpiData?.monetization.feature_payments || 0} pagos
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ 
                          width: `${kpiData?.monetization.feature_clicks ? 
                            (kpiData.monetization.feature_payments / kpiData.monetization.feature_clicks) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {kpiData?.monetization.feature_clicks || 0} clicks → {kpiData?.monetization.feature_prefs || 0} preferencias → {kpiData?.monetization.feature_payments || 0} pagos
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Suscripciones</span>
                      <Badge variant="outline">
                        {kpiData?.monetization.sub_activations || 0} activas
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${kpiData?.monetization.sub_clicks ? 
                            (kpiData.monetization.sub_activations / kpiData.monetization.sub_clicks) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {kpiData?.monetization.sub_clicks || 0} clicks → {kpiData?.monetization.sub_activations || 0} activaciones
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Período de datos</div>
                  <div className="text-gray-600">Últimos {timeRange.replace('d', ' días')}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Última actualización</div>
                  <div className="text-gray-600">{new Date().toLocaleString('es-AR')}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Privacidad</div>
                  <div className="text-gray-600">Analytics propios, sin vendors externos</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
