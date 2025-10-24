"use client";

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Eye, MessageSquare, Heart, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  summary: {
    totalViews: number;
    totalContacts: number;
    totalFavorites: number;
    conversionRate: number;
    // Comparativas
    viewsChange: number;
    contactsChange: number;
    favoritesChange: number;
    previousPeriod?: {
      views: number;
      contacts: number;
      favorites: number;
    };
  };
  viewsByDay: Array<{
    date: string;
    views: number;
    contacts: number;
  }>;
  topProperties: Array<{
    id: string;
    title: string;
    views: number;
    contacts: number;
    favorites: number;
    conversionRate: number;
  }>;
  eventBreakdown: Array<{
    event_name: string;
    count: number;
  }>;
}

interface AnalyticsDashboardProps {
  userId: string;
}

// Componente para mostrar cambio porcentual con icono
function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-500 text-sm font-medium">
        <Minus className="w-4 h-4" />
        <span>Sin cambios</span>
      </div>
    );
  }

  const isPositive = change > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`flex items-center gap-1 ${colorClass} text-sm font-medium`}>
      <Icon className="w-4 h-4" />
      <span>{isPositive ? '+' : ''}{change}%</span>
    </div>
  );
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [userId, dateRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/dashboard?userId=${userId}&range=${dateRange}`);

      if (!response.ok) {
        throw new Error('Error al cargar analytics');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">❌ {error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    );
  }

  const { summary, viewsByDay, topProperties, eventBreakdown } = data;

  // Preparar datos para el gráfico de línea
  const chartData = viewsByDay.map(day => ({
    date: new Date(day.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    Visitas: day.views,
    Contactos: day.contacts,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Estadísticas de rendimiento de tus propiedades</p>
        </div>

        {/* Filtro de rango */}
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 días
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 días
          </button>
          <button
            onClick={() => setDateRange('90d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            90 días
          </button>
        </div>
      </div>

      {/* Tarjetas de resumen CON COMPARATIVAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Visitas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Visitas</h3>
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{summary.totalViews.toLocaleString()}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Vistas a tus propiedades</p>
            <ChangeIndicator change={summary.viewsChange} />
          </div>
        </div>

        {/* Total Contactos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Contactos</h3>
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{summary.totalContacts.toLocaleString()}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Clicks en contacto</p>
            <ChangeIndicator change={summary.contactsChange} />
          </div>
        </div>

        {/* Total Favoritos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Favoritos</h3>
            <Heart className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{summary.totalFavorites.toLocaleString()}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Agregadas a favoritos</p>
            <ChangeIndicator change={summary.favoritesChange} />
          </div>
        </div>

        {/* Tasa de Conversión */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Conversión</h3>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{summary.conversionRate}%</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Visitas → Contactos</p>
            {summary.conversionRate >= 5 ? (
              <span className="text-xs font-medium text-green-600">🎯 Excelente</span>
            ) : summary.conversionRate >= 2 ? (
              <span className="text-xs font-medium text-yellow-600">📊 Promedio</span>
            ) : (
              <span className="text-xs font-medium text-gray-500">📉 Bajo</span>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de línea de visitas por día */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Tendencia de Visitas y Contactos</h2>
        </div>

        {viewsByDay.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay datos para este período</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="Visitas"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Contactos"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: '#16a34a', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Propiedades */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Propiedades Más Vistas</h2>

        {topProperties.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Propiedad</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Visitas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Contactos</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Favoritos</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Conversión</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.map((property, index) => (
                  <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-medium">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-md">
                            {property.title || 'Sin título'}
                          </p>
                          <a
                            href={`/properties/${property.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Ver propiedad →
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        <Eye className="w-3 h-3" />
                        {property.views}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <MessageSquare className="w-3 h-3" />
                        {property.contacts}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        <Heart className="w-3 h-3" />
                        {property.favorites}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-semibold text-sm ${
                        property.conversionRate >= 10 ? 'text-green-600' :
                        property.conversionRate >= 5 ? 'text-yellow-600' :
                        property.conversionRate >= 2 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {property.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Benchmark information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">💡</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Benchmarks de la Industria</h3>
            <p className="text-sm text-blue-800">
              <strong>Tasa de conversión promedio:</strong> 2-2.4% |
              <strong className="ml-2">Top performers:</strong> 5%+ |
              <strong className="ml-2">Leads mensuales objetivo:</strong> 100-200+
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
