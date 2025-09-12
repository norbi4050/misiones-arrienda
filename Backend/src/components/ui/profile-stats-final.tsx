"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
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
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStats } from '@/hooks/useUserStats';
import { useUserFavorites } from '@/hooks/useUserFavorites';

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
  };
  className?: string;
  layout?: 'grid' | 'compact' | 'detailed';
}

export function ProfileStats({ stats: propStats, className, layout = 'grid' }: ProfileStatsProps) {
  const { stats: realStats, loading, error } = useUserStats();
  const { favoritesCount } = useUserFavorites();

  // Use real stats when available, fallback to prop stats or defaults
  const profileStats = {
    profileViews: realStats?.profileViews ?? propStats?.profileViews ?? 0,
    favoriteCount: favoritesCount ?? realStats?.favoriteCount ?? propStats?.favoriteCount ?? 0,
    messageCount: realStats?.messageCount ?? propStats?.messageCount ?? 0,
    rating: realStats?.rating ?? propStats?.rating ?? 0,
    reviewCount: realStats?.reviewCount ?? propStats?.reviewCount ?? 0,
    searchesCount: realStats?.searchesCount ?? propStats?.searchesCount ?? 0,
    joinDate: realStats?.joinDate ?? propStats?.joinDate ?? new Date().toISOString(),
    responseRate: realStats?.responseRate ?? propStats?.responseRate ?? 0,
    verificationLevel: realStats?.verificationLevel ?? propStats?.verificationLevel ?? 'none' as const
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
        return { label: 'Verificado', color: 'bg-green-100 text-green-800 border-green-200', icon: Shield };
      case 'phone':
        return { label: 'Teléfono verificado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Shield };
      case 'email':
        return { label: 'Email verificado', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Shield };
      default:
        return { label: 'Sin verificar', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Shield };
    }
  };

  const verification = getVerificationBadge(profileStats.verificationLevel);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: layout === 'compact' ? 2 : 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-red-200", className)}>
        <CardContent className="p-4 text-center">
          <p className="text-red-600 text-sm">Error cargando estadísticas</p>
          <p className="text-gray-500 text-xs mt-1">Mostrando datos por defecto</p>
        </CardContent>
      </Card>
    );
  }

  if (layout === 'compact') {
    return (
      <div className={cn("flex flex-wrap gap-4 justify-center", className)}>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profileStats.profileViews}</div>
          <div className="text-xs text-gray-500">Vistas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profileStats.favoriteCount}</div>
          <div className="text-xs text-gray-500">Favoritos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profileStats.messageCount}</div>
          <div className="text-xs text-gray-500">Mensajes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {profileStats.rating > 0 ? profileStats.rating.toFixed(1) : '0.0'}
          </div>
          <div className="text-xs text-gray-500">Rating</div>
        </div>
      </div>
    );
  }

  if (layout === 'detailed') {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Eye}
            value={profileStats.profileViews}
            label="Vistas del perfil"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={Heart}
            value={profileStats.favoriteCount}
            label="Favoritos"
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatCard
            icon={MessageCircle}
            value={profileStats.messageCount}
            label="Mensajes"
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={Search}
            value={profileStats.searchesCount}
            label="Búsquedas"
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        {/* Rating and Reviews */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Calificación y Reseñas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {profileStats.rating > 0 ? profileStats.rating.toFixed(1) : '0.0'}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < Math.floor(profileStats.rating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  {profileStats.reviewCount > 0 
                    ? `Basado en ${profileStats.reviewCount} reseña${profileStats.reviewCount !== 1 ? 's' : ''}`
                    : 'Sin reseñas aún'
                  }
                </p>
                {profileStats.responseRate > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Tasa de respuesta: {profileStats.responseRate}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              Información del Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Miembro desde:</span>
                <span className="text-sm font-medium">{formatDate(profileStats.joinDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado de verificación:</span>
                <Badge className={cn("text-xs border", verification.color)}>
                  <verification.icon className="w-3 h-3 mr-1" />
                  {verification.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Logros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <AchievementBadgeComponent
                title="Primera Vista"
                description="Recibiste tu primera vista"
                earned={profileStats.profileViews > 0}
                icon="👁️"
              />
              <AchievementBadgeComponent
                title="Popular"
                description="10+ vistas del perfil"
                earned={profileStats.profileViews >= 10}
                icon="🌟"
              />
              <AchievementBadgeComponent
                title="Favorito"
                description="Agregaste tu primer favorito"
                earned={profileStats.favoriteCount > 0}
                icon="❤️"
              />
              <AchievementBadgeComponent
                title="Comunicativo"
                description="Enviaste tu primer mensaje"
                earned={profileStats.messageCount > 0}
                icon="💬"
              />
              <AchievementBadgeComponent
                title="Explorador"
                description="Realizaste 5+ búsquedas"
                earned={profileStats.searchesCount >= 5}
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

  // Default grid layout
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <StatCard
        icon={Eye}
        value={profileStats.profileViews}
        label="Vistas"
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <StatCard
        icon={Heart}
        value={profileStats.favoriteCount}
        label="Favoritos"
        color="text-red-600"
        bgColor="bg-red-50"
      />
      <StatCard
        icon={MessageCircle}
        value={profileStats.messageCount}
        label="Mensajes"
        color="text-green-600"
        bgColor="bg-green-50"
      />
      <StatCard
        icon={Star}
        value={profileStats.rating}
        label="Rating"
        color="text-yellow-600"
        bgColor="bg-yellow-50"
        isRating={true}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
  bgColor: string;
  isRating?: boolean;
  suffix?: string;
}

function StatCard({ icon: Icon, value, label, color, bgColor, isRating = false, suffix }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", bgColor)}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900 truncate">
                {isRating ? (value > 0 ? value.toFixed(1) : '0.0') : value}
              </span>
              {suffix && (
                <span className="text-xs text-gray-500">{suffix}</span>
              )}
            </div>
            <p className="text-xs text-gray-600 truncate">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AchievementBadgeProps {
  title: string;
  description: string;
  earned: boolean;
  icon: string;
}

function AchievementBadgeComponent({ title, description, earned, icon }: AchievementBadgeProps) {
  return (
    <div className={cn(
      "p-3 rounded-lg border-2 text-center transition-all cursor-default",
      earned 
        ? "border-green-200 bg-green-50 hover:bg-green-100" 
        : "border-gray-200 bg-gray-50 opacity-60"
    )}>
      <div className="text-2xl mb-1">{icon}</div>
      <h4 className={cn(
        "text-sm font-medium",
        earned ? "text-green-800" : "text-gray-600"
      )}>
        {title}
      </h4>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

// Export compact version for smaller displays
export function ProfileStatsCompact({ stats: propStats, className }: ProfileStatsProps) {
  return <ProfileStats stats={propStats} className={className} layout="compact" />;
}

// Export detailed version for full profile pages
export function ProfileStatsDetailed({ stats: propStats, className }: ProfileStatsProps) {
  return <ProfileStats stats={propStats} className={className} layout="detailed" />;
}
