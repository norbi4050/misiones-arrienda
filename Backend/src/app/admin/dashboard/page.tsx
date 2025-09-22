"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarOptimized } from '@/components/ui/avatar-optimized';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Users, 
  Image, 
  Shield, 
  TrendingUp as Activity, 
  AlertTriangle,
  CheckCircle2 as CheckCircle,
  Timer as Clock,
  TrendingUp,
  HardDrive as Database,
  Server
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalAvatars: number;
  avatarUploadsToday: number;
  securityAlerts: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  storageUsed: number;
  storageLimit: number;
}

interface RecentActivity {
  id: string;
  type: 'avatar_upload' | 'user_registration' | 'security_alert' | 'system_event';
  user?: {
    id: string;
    name: string;
    avatar?: string;
    updated_at?: string;
  };
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifications, unreadCount } = useNotifications();

  // Cargar estadísticas del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Simular carga de datos (en producción sería una API real)
        const mockStats: AdminStats = {
          totalUsers: 1247,
          totalAvatars: 892,
          avatarUploadsToday: 23,
          securityAlerts: 2,
          systemHealth: 'healthy',
          storageUsed: 2.4, // GB
          storageLimit: 10 // GB
        };

        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'avatar_upload',
            user: {
              id: 'user1',
              name: 'María González',
              avatar: '/placeholder-house-1.jpg',
              updated_at: new Date().toISOString()
            },
            description: 'Subió nuevo avatar',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            severity: 'info'
          },
          {
            id: '2',
            type: 'user_registration',
            user: {
              id: 'user2',
              name: 'Carlos Mendoza',
              updated_at: new Date().toISOString()
            },
            description: 'Nuevo usuario registrado',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            severity: 'info'
          },
          {
            id: '3',
            type: 'security_alert',
            description: 'Rate limit alcanzado para IP 192.168.1.100',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            severity: 'warning'
          },
          {
            id: '4',
            type: 'system_event',
            description: 'Limpieza automática de avatares antiguos completada',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            severity: 'info'
          }
        ];

        setStats(mockStats);
        setRecentActivity(mockActivity);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'avatar_upload': return <Image className="w-4 h-4" />;
      case 'user_registration': return <Users className="w-4 h-4" />;
      case 'security_alert': return <Shield className="w-4 h-4" />;
      case 'system_event': return <Server className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: RecentActivity['severity']) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthColor = (health: AdminStats['systemHealth']) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
              <p className="text-gray-600">Misiones Arrienda - Sistema de Gestión</p>
            </div>
            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} notificaciones</Badge>
              )}
              <Badge className={getHealthColor(stats?.systemHealth || 'healthy')}>
                {stats?.systemHealth === 'healthy' ? 'Sistema Saludable' : 
                 stats?.systemHealth === 'warning' ? 'Advertencias' : 'Crítico'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avatares Activos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalAvatars.toLocaleString()}</p>
              </div>
              <Image className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uploads Hoy</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.avatarUploadsToday}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Seguridad</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.securityAlerts}</p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Storage y rendimiento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso de Storage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Avatares</span>
                  <span>{stats?.storageUsed}GB / {stats?.storageLimit}GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((stats?.storageUsed || 0) / (stats?.storageLimit || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Database className="w-4 h-4" />
                <span>Optimización automática activa</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cache-busting</span>
                <Badge className="bg-green-50 text-green-600">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rate Limiting</span>
                <Badge className="bg-green-50 text-green-600">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">RLS Policies</span>
                <Badge className="bg-green-50 text-green-600">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lazy Loading</span>
                <Badge className="bg-green-50 text-green-600">Activo</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Actividad reciente */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            <Button variant="outline" size="sm">
              Ver Todo
            </Button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                {activity.user && (
                  <AvatarOptimized
                    src={activity.user.avatar}
                    name={activity.user.name}
                    updatedAt={activity.user.updated_at}
                    size="sm"
                    lazy={true}
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.user?.name || 'Sistema'}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {activity.description}
                  </p>
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Acciones rápidas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Administrativas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Database className="w-4 h-4 mr-2" />
              Optimizar Storage
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Revisar Seguridad
            </Button>
            <Button variant="outline" className="justify-start">
              <Activity className="w-4 h-4 mr-2" />
              Generar Reporte
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
