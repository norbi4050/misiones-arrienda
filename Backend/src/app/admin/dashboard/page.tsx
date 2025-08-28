/**
 * 🏢 DASHBOARD DE ADMINISTRACIÓN
 * 
 * Panel de control para administradores del sistema
 * Permite gestionar usuarios, propiedades, pagos y estadísticas
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminStats {
  users: {
    total: number;
    inquilinos: number;
    duenos: number;
    inmobiliarias: number;
    newThisMonth: number;
  };
  properties: {
    total: number;
    active: number;
    expired: number;
    featured: number;
    newThisMonth: number;
  };
  payments: {
    totalRevenue: number;
    thisMonth: number;
    successful: number;
    pending: number;
    failed: number;
  };
  community: {
    profiles: number;
    activeProfiles: number;
    suspendedProfiles: number;
    newThisMonth: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'property_published' | 'payment_received' | 'profile_created';
  description: string;
  timestamp: string;
  amount?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin statistics
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return '👤';
      case 'property_published': return '🏠';
      case 'payment_received': return '💰';
      case 'profile_created': return '👥';
      default: return '📊';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registered': return 'bg-blue-100 text-blue-800';
      case 'property_published': return 'bg-green-100 text-green-800';
      case 'payment_received': return 'bg-yellow-100 text-yellow-800';
      case 'profile_created': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Administración</h1>
        <p className="text-gray-600 mt-2">Panel de control y estadísticas del sistema</p>
      </div>

      {/* Estadísticas principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <span className="text-2xl">👥</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.users.newThisMonth} este mes
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stats.users.inquilinos} Inquilinos
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {stats.users.duenos} Dueños
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {stats.users.inmobiliarias} Inmobiliarias
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
              <span className="text-2xl">🏠</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.properties.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.properties.newThisMonth} este mes
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="default" className="text-xs">
                  {stats.properties.active} Activas
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {stats.properties.featured} Destacadas
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.payments.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.payments.thisMonth)} este mes
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="default" className="text-xs">
                  {stats.payments.successful} Exitosos
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  {stats.payments.failed} Fallidos
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comunidad</CardTitle>
              <span className="text-2xl">👫</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.community.profiles.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.community.newThisMonth} este mes
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="default" className="text-xs">
                  {stats.community.activeProfiles} Activos
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {stats.community.suspendedProfiles} Suspendidos
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs para diferentes secciones */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="properties">Gestión de Propiedades</TabsTrigger>
          <TabsTrigger value="payments">Gestión de Pagos</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Últimas acciones realizadas en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                    {activity.amount && (
                      <Badge className={getActivityColor(activity.type)}>
                        {formatCurrency(activity.amount)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administrar usuarios registrados en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button variant="outline">Ver Todos los Usuarios</Button>
                  <Button variant="outline">Usuarios Suspendidos</Button>
                  <Button variant="outline">Exportar Datos</Button>
                </div>
                <p className="text-sm text-gray-600">
                  Funcionalidad de gestión de usuarios en desarrollo...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Propiedades</CardTitle>
              <CardDescription>
                Administrar propiedades publicadas en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button variant="outline">Propiedades Pendientes</Button>
                  <Button variant="outline">Propiedades Reportadas</Button>
                  <Button variant="outline">Propiedades Destacadas</Button>
                </div>
                <p className="text-sm text-gray-600">
                  Funcionalidad de gestión de propiedades en desarrollo...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pagos</CardTitle>
              <CardDescription>
                Administrar transacciones y pagos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button variant="outline">Pagos Pendientes</Button>
                  <Button variant="outline">Pagos Fallidos</Button>
                  <Button variant="outline">Reembolsos</Button>
                </div>
                <p className="text-sm text-gray-600">
                  Funcionalidad de gestión de pagos en desarrollo...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes y Análisis</CardTitle>
              <CardDescription>
                Generar reportes detallados del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button variant="outline">Reporte de Ingresos</Button>
                  <Button variant="outline">Reporte de Usuarios</Button>
                  <Button variant="outline">Reporte de Actividad</Button>
                </div>
                <p className="text-sm text-gray-600">
                  Funcionalidad de reportes en desarrollo...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
