'use client';

import { Building2, Home, TrendingUp, Calendar } from 'lucide-react';
import { AgencyStats as AgencyStatsType } from '@/types/inmobiliaria';

interface AgencyStatsProps {
  stats: AgencyStatsType;
  loading?: boolean;
  className?: string;
}

/**
 * Componente: Estadísticas de Inmobiliaria
 * 
 * Muestra 4 métricas clave en cards visuales:
 * - Total de propiedades
 * - Propiedades activas
 * - Precio promedio
 * - Propiedades publicadas este mes
 * 
 * Uso: Perfil público de inmobiliarias
 */
export default function AgencyStats({ stats, loading = false, className = '' }: AgencyStatsProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      icon: Building2,
      label: 'Total Propiedades',
      value: stats.total_properties,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Home,
      label: 'Propiedades Activas',
      value: stats.active_properties,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: TrendingUp,
      label: 'Precio Promedio',
      value: `$${stats.average_price.toLocaleString('es-AR')}`,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      icon: Calendar,
      label: 'Este Mes',
      value: stats.properties_this_month,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-0 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${stat.bgColor} shadow-sm`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
