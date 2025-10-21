"use client";

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Eye, MessageSquare, Heart, Calendar } from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalViews: number;
    totalContacts: number;
    totalFavorites: number;
    conversionRate: number;
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

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Visitas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Visitas</h3>
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.totalViews.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Vistas a tus propiedades</p>
        </div>

        {/* Total Contactos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Contactos</h3>
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.totalContacts.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Clicks en contacto</p>
        </div>

        {/* Total Favoritos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Favoritos</h3>
            <Heart className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.totalFavorites.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Agregadas a favoritos</p>
        </div>

        {/* Tasa de Conversión */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Conversión</h3>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.conversionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Visitas → Contactos</p>
        </div>
      </div>

      {/* Gráfico de visitas por día */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Visitas por Día</h2>
        </div>

        <div className="space-y-3">
          {viewsByDay.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay datos para este período</p>
          ) : (
            viewsByDay.slice().reverse().map((day, index) => {
              const maxViews = Math.max(...viewsByDay.map(d => d.views));
              const viewsPercent = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
              const contactsPercent = day.views > 0 ? (day.contacts / day.views) * 100 : 0;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium w-24">
                      {new Date(day.date).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="flex gap-1">
                        {/* Barra de visitas */}
                        <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                            style={{ width: `${viewsPercent}%` }}
                          >
                            {day.views > 0 && (
                              <span className="text-xs font-medium text-white">
                                {day.views}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Mini barra de contactos */}
                        {day.contacts > 0 && (
                          <div
                            className="w-12 bg-green-600 rounded-full h-6 flex items-center justify-center"
                            title={`${day.contacts} contactos`}
                          >
                            <span className="text-xs font-medium text-white">{day.contacts}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right w-20">
                      <span className="text-gray-900 font-semibold">{day.views}</span>
                      <span className="text-gray-500 text-xs ml-1">visitas</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600 border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Visitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Contactos</span>
          </div>
        </div>
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
                  <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                      <span className={`font-semibold ${
                        property.conversionRate >= 10 ? 'text-green-600' :
                        property.conversionRate >= 5 ? 'text-yellow-600' :
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

      {/* Breakdown de eventos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Desglose de Eventos</h2>

        {eventBreakdown.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay eventos registrados</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventBreakdown.map((event) => (
              <div
                key={event.event_name}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {event.event_name.replace(/_/g, ' ')}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{event.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
