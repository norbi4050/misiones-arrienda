"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageSquare, 
  Home, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Users
} from 'lucide-react';

interface PropertyStatsProps {
  stats: {
    totalProperties: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalViews?: number;
    totalInquiries?: number;
    totalFavorites?: number;
    averagePrice?: number;
    recentActivity?: {
      newProperties: number;
      updatedProperties: number;
      period: string;
    };
    performance?: {
      topPerforming?: Array<{
        id: string;
        title: string;
        views: number;
        inquiries: number;
      }>;
      conversionRate?: number;
    };
  };
  className?: string;
}

const getStatusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return 'Disponibles';
    case 'rented':
      return 'Alquiladas';
    case 'sold':
      return 'Vendidas';
    case 'maintenance':
      return 'En mantenimiento';
    case 'reserved':
      return 'Reservadas';
    case 'expired':
      return 'Expiradas';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return 'text-green-600 bg-green-50';
    case 'rented':
      return 'text-blue-600 bg-blue-50';
    case 'sold':
      return 'text-gray-600 bg-gray-50';
    case 'maintenance':
      return 'text-yellow-600 bg-yellow-50';
    case 'reserved':
      return 'text-purple-600 bg-purple-50';
    case 'expired':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getPropertyTypeLabel = (type: string) => {
  switch (type.toLowerCase()) {
    case 'apartment':
      return 'Departamentos';
    case 'house':
      return 'Casas';
    case 'commercial':
      return 'Comerciales';
    case 'land':
      return 'Terrenos';
    case 'office':
      return 'Oficinas';
    case 'warehouse':
      return 'Depósitos';
    case 'ph':
      return 'PH';
    case 'studio':
      return 'Monoambientes';
    default:
      return type;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-AR').format(num);
};

export function PropertyStats({ stats, className = '' }: PropertyStatsProps) {
  const totalAvailable = stats.byStatus['AVAILABLE'] || stats.byStatus['available'] || 0;
  const totalRented = stats.byStatus['RENTED'] || stats.byStatus['rented'] || 0;
  const totalSold = stats.byStatus['SOLD'] || stats.byStatus['sold'] || 0;

  // Calculate percentages for status distribution
  const statusPercentages = Object.entries(stats.byStatus).map(([status, count]) => ({
    status,
    count,
    percentage: stats.totalProperties > 0 ? (count / stats.totalProperties) * 100 : 0
  }));

  // Calculate percentages for type distribution
  const typePercentages = Object.entries(stats.byType).map(([type, count]) => ({
    type,
    count,
    percentage: stats.totalProperties > 0 ? (count / stats.totalProperties) * 100 : 0
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properties */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalProperties)}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          {stats.recentActivity && (
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">
                +{stats.recentActivity.newProperties} nuevas {stats.recentActivity.period}
              </span>
            </div>
          )}
        </Card>

        {/* Total Views */}
        {stats.totalViews !== undefined && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vistas</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Promedio: {stats.totalProperties > 0 ? Math.round(stats.totalViews / stats.totalProperties) : 0} por propiedad
            </div>
          </Card>
        )}

        {/* Total Inquiries */}
        {stats.totalInquiries !== undefined && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultas</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalInquiries)}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
            {stats.performance?.conversionRate && (
              <div className="mt-2 text-sm text-gray-500">
                Tasa conversión: {stats.performance.conversionRate.toFixed(1)}%
              </div>
            )}
          </Card>
        )}

        {/* Total Favorites */}
        {stats.totalFavorites !== undefined && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favoritos</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalFavorites)}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        )}

        {/* Average Price */}
        {stats.averagePrice && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averagePrice)}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Distribución por Estado</h3>
          </div>
          <div className="space-y-3">
            {statusPercentages.map(({ status, count, percentage }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status).split(' ')[1]}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {getStatusLabel(status)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <Badge variant="secondary" className="text-xs">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Type Distribution */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Distribución por Tipo</h3>
          </div>
          <div className="space-y-3">
            {typePercentages.map(({ type, count, percentage }) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {getPropertyTypeLabel(type)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <Badge variant="secondary" className="text-xs">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Section */}
      {stats.performance?.topPerforming && stats.performance.topPerforming.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Propiedades Destacadas</h3>
          </div>
          <div className="space-y-3">
            {stats.performance.topPerforming.map((property, index) => (
              <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold mr-3">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 truncate max-w-xs">
                    {property.title}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {property.views}
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {property.inquiries}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Stats Summary */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Resumen Rápido</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalAvailable}</div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalRented}</div>
            <div className="text-sm text-gray-600">Alquiladas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{totalSold}</div>
            <div className="text-sm text-gray-600">Vendidas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalProperties > 0 ? ((totalAvailable / stats.totalProperties) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-sm text-gray-600">Disponibilidad</div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      {stats.recentActivity && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-900">
                  {stats.recentActivity.newProperties} Nuevas Propiedades
                </div>
                <div className="text-sm text-green-600">
                  {stats.recentActivity.period}
                </div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-900">
                  {stats.recentActivity.updatedProperties} Actualizaciones
                </div>
                <div className="text-sm text-blue-600">
                  {stats.recentActivity.period}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
