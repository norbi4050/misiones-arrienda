"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Star, 
  TrendingUp, 
  Calendar,
  Shield,
  Award,
  Search,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStats } from '@/hooks/useUserStats';
import { useUserFavorites } from '@/hooks/useUserFavorites';
import toast from 'react-hot-toast';

interface ProfileStatsProps {
  stats?: {
    profileViews?: number;
    favoriteCount?: number;
    messageCount?: number;
    rating?: number;
    reviewCount?: number;
    joinDate?: string;
    responseRate?: number;
    verificationLevel?: 'none' | 'email' | 'phone' | 'full';
    searchesCount?: number;
    activityCount?: number;
  };
  className?: string;
  showRefreshButton?: boolean;
  layout?: 'grid' | 'compact' | 'detailed';
}

export function ProfileStatsAuditoria({ 
  stats: propStats, 
  className, 
  showRefreshButton = true,
  layout = 'grid'
}: ProfileStatsProps) {
  const { stats: realStats, loading, error, refreshStats } = useUserStats();
  const { favoritesCount } = useUserFavorites();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Usar estadísticas reales cuando estén disponibles, fallback a props o defaults
  const profileStats = {
    profileViews: realStats?.profileViews ?? propStats?.profileViews ?? 0,
    favoriteCount: favoritesCount ?? realStats?.favoriteCount ?? propStats?.favoriteCount ?? 0,
    messageCount: realStats?.messageCount ?? propStats?.messageCount ?? 0,
    rating: realStats?.rating ?? propStats?.rating ?? 0,
    reviewCount: realStats?.reviewCount ?? propStats?.reviewCount ?? 0,
    joinDate: realStats?.joinDate ?? propStats?.joinDate ?? new Date().toISOString(),
    responseRate: realStats?.responseRate ?? propStats?.responseRate ?? 0,
    verificationLevel: realStats?.verificationLevel ?? propStats?.verificationLevel ?? 'none' as const,
    searchesCount: realStats?.searchesCount ?? propStats?.searchesCount ?? 0,
    activityCount: (realStats as any)?.activityCount ?? propStats?.activityCount ?? 0
  };

  // Actualizar timestamp cuando cambien las stats
  useEffect(() => {
    if (realStats) {
      setLastUpdated(new Date());
    }
  }, [realStats]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshStats();
      setLastUpdated(new Date());
      toast.success('Estadísticas actualizadas');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Error al actualizar estadísticas');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'full':
        return { 
          label: 'Completamente Verificado', 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: Shield 
        };
      case 'phone':
        return { 
          label: 'Teléfono Verificado', 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: Shield 
        };
      case 'email':
        return { 
          label: 'Email Verificado', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: Shield 
        };
      default:
        return { 
          label: 'Sin Verificar', 
          color: 'bg-gray-100 text-gray-600 border-gray-200', 
          icon: AlertCircle 
        };
    }
  };

  const verification = getVerificationBadge(profileStats.verificationLevel);
  const VerificationIcon = verification.icon;

  // Layout compacto para móviles
  if (layout === 'compact') {
    return (
      <div className={cn("flex flex-wrap gap-4 p-4", className)}>
        <StatItem 
          icon={Eye} 
          value={profileStats.profileViews} 
          label="Vistas" 
          color="text-blue-600"
        />
        <StatItem 
          icon={Heart} 
          value={profileStats.favoriteCount} 
          label="Favoritos" 
          color="text-red-600"
        />
        <StatItem 
          icon={MessageCircle} 
          value={profileStats.messageCount} 
          label="Mensajes" 
          color="text-green-600"
        />
        <StatItem 
          icon={Star} 
          value={profileStats.rating} 
          label="Rating" 
          color="text-yellow-600"
          isRating
        />
      </div>
    );
  }

  // Layout detallado
  if (layout === 'detailed') {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header con refresh */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Estadísticas del Perfil</h3>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Actualizado: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {showRefreshButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="h-8"
              >
                <RefreshCw className={cn("w-3 h-3 mr-1", isRefreshing && "animate-spin")} />
                Actualizar
              </Button>
            )}
          </div>
        </div>

        {/* Estado de carga/error */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Cargando estadísticas...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Error al cargar estadísticas</span>
          </div>
        )}

        {/* Grid de estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Eye}
            value={profileStats.profileViews}
            label="Vistas del Perfil"
            subtitle="Últimos 30 días"
            color="bg-blue-50 text-blue-700"
            trend={profileStats.profileViews > 10 ? 'up' : 'stable'}
          />
          <StatCard
            icon={Heart}
            value={profileStats.favoriteCount}
            label="Propiedades Favoritas"
            subtitle="Total guardadas"
            color="bg-red-50 text-red-700"
          />
          <StatCard
            icon={MessageCircle}
            value={profileStats.messageCount}
            label="Conversaciones"
            subtitle="Últimos 30 días"
            color="bg-green-50 text-green-700"
          />
          <StatCard
            icon={Search}
            value={profileStats.searchesCount}
            label="Búsquedas Activas"
            subtitle="Alertas configuradas"
            color="bg-purple-50 text-purple-700"
          />
        </div>

        {/* Fila de métricas secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {profileStats.rating > 0 ? profileStats.rating.toFixed(1) : '0.0'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Rating ({profileStats.reviewCount} reseñas)
                </p>
              </div>
              <div className="text-right">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= profileStats.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {profileStats.responseRate}%
                </div>
                <p className="text-sm text-gray-600">Tasa de Respuesta</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {profileStats.activityCount}
                </div>
                <p className="text-sm text-gray-600">Actividad Reciente</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="font-medium">Miembro desde</span>
              </div>
              <span className="text-gray-600">
                {formatDate(profileStats.joinDate)}
              </span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VerificationIcon className="w-5 h-5" />
                <span className="font-medium">Verificación</span>
              </div>
              <Badge className={cn("text-xs", verification.color)}>
                {verification.label}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Logros/Achievements */}
        <Card className="p-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-yellow-600" />
              Logros
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <AchievementBadgeComponent
                title="Primer Favorito"
                description="Guardaste tu primera propiedad"
                earned={profileStats.favoriteCount > 0}
                icon="❤️"
              />
              <AchievementBadgeComponent
                title="Conversador"
                description="Iniciaste 5 conversaciones"
                earned={profileStats.messageCount >= 5}
                icon="💬"
              />
              <AchievementBadgeComponent
                title="Explorador"
                description="Configuraste búsquedas"
                earned={profileStats.searchesCount > 0}
                icon="🔍"
              />
              <AchievementBadgeComponent
                title="Verificado"
                description="Perfil verificado"
                earned={profileStats.verificationLevel !== 'none'}
                icon="✅"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Layout grid por defecto
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <StatCard
        icon={Eye}
        value={profileStats.profileViews}
        label="Vistas"
        color="bg-blue-50 text-blue-700"
        loading={loading}
      />
      <StatCard
        icon={Heart}
        value={profileStats.favoriteCount}
        label="Favoritos"
        color="bg-red-50 text-red-700"
        loading={loading}
      />
      <StatCard
        icon={MessageCircle}
        value={profileStats.messageCount}
        label="Mensajes"
        color="bg-green-50 text-green-700"
        loading={loading}
      />
      <StatCard
        icon={Star}
        value={profileStats.rating}
        label="Rating"
        color="bg-yellow-50 text-yellow-700"
        isRating
        loading={loading}
      />
    </div>
  );
}

// Componente para items de estadística compactos
interface StatItemProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color?: string;
  isRating?: boolean;
}

function StatItem({ icon: Icon, value, label, color = "text-gray-600", isRating = false }: StatItemProps) {
  return (
    <div className="text-center min-w-[80px]">
      <div className={cn("text-lg font-bold", color)}>
        {isRating && value > 0 ? value.toFixed(1) : value}
      </div>
      <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
    </div>
  );
}

// Componente para tarjetas de estadística
interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  subtitle?: string;
  color?: string;
  isRating?: boolean;
  trend?: 'up' | 'down' | 'stable';
  loading?: boolean;
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  subtitle, 
  color = "bg-gray-50 text-gray-700", 
  isRating = false,
  trend,
  loading = false
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className={cn("p-2 rounded-lg", color)}>
                <Icon className="w-5 h-5" />
              </div>
              {trend && (
                <div className={cn(
                  "flex items-center text-xs",
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-gray-500'
                )}>
                  <TrendingUp className={cn(
                    "w-3 h-3 mr-1",
                    trend === 'down' && "rotate-180"
                  )} />
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {isRating && value > 0 ? value.toFixed(1) : value}
            </div>
            <p className="text-sm text-gray-600">{label}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para badges de logros
interface AchievementBadgeProps {
  title: string;
  description: string;
  earned: boolean;
  icon: string;
}

function AchievementBadgeComponent({ title, description, earned, icon }: AchievementBadgeProps) {
  return (
    <div className={cn(
      "p-3 rounded-lg border-2 text-center transition-all hover:scale-105",
      earned 
        ? "border-green-200 bg-green-50 shadow-sm" 
        : "border-gray-200 bg-gray-50 opacity-60"
    )}>
      <div className="text-2xl mb-1">{icon}</div>
      <h4 className={cn(
        "text-sm font-medium mb-1",
        earned ? "text-green-800" : "text-gray-600"
      )}>
        {title}
      </h4>
      <p className="text-xs text-gray-500">{description}</p>
      {earned && (
        <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
      )}
    </div>
  );
}

// Versión compacta para displays pequeños
export function ProfileStatsCompact({ stats: propStats, className }: ProfileStatsProps) {
  return (
    <ProfileStatsAuditoria 
      stats={propStats} 
      className={className} 
      layout="compact"
      showRefreshButton={false}
    />
  );
}

export default ProfileStatsAuditoria;
