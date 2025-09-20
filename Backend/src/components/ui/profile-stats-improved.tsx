"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import {
  Eye,
  Heart,
  MessageCircle,
  Star,
  TrendingUp,
  User,
  Shield,
  Trophy,
  RefreshCw,
  Loader2,
  Search,
  Users
} from 'lucide-react';
import { cn } from "@/utils";
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
    sentMessages?: number;
    receivedMessages?: number;
    unreadMessages?: number;
  };
  className?: string;
  showRefresh?: boolean;
}

export function ProfileStatsImproved({ stats: propStats, className, showRefresh = true }: ProfileStatsProps) {
  const { stats: realStats, loading, error, refreshStats } = useUserStats();
  const { favoritesCount, loading: favoritesLoading } = useUserFavorites();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use real stats when available, fallback to prop stats or defaults
  const profileStats = {
    profileViews: realStats?.profileViews || propStats?.profileViews || 0,
    favoriteCount: favoritesCount || realStats?.favoriteCount || propStats?.favoriteCount || 0,
    messageCount: realStats?.messageCount || propStats?.messageCount || 0,
    rating: realStats?.rating || propStats?.rating || 0,
    reviewCount: realStats?.reviewCount || propStats?.reviewCount || 0,
    joinDate: realStats?.joinDate || propStats?.joinDate || new Date().toISOString(),
    responseRate: realStats?.responseRate || propStats?.responseRate || 0,
    verificationLevel: realStats?.verificationLevel || propStats?.verificationLevel || 'none' as const,
    searchesCount: realStats?.searchesCount || propStats?.searchesCount || 0,
    sentMessages: realStats?.sentMessages || propStats?.sentMessages || 0,
    receivedMessages: realStats?.receivedMessages || propStats?.receivedMessages || 0,
    unreadMessages: realStats?.unreadMessages || propStats?.unreadMessages || 0
  };

  const handleRefresh = async () => {
    if (refreshStats) {
      setIsRefreshing(true);
      try {
        await refreshStats();
      } catch (error) {
        console.error('Error refreshing stats:', error);
      } finally {
        setIsRefreshing(false);
      }
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
  const VerificationIcon = verification.icon;

  if (loading || favoritesLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Cargando estadísticas...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error al cargar estadísticas</p>
              {showRefresh && (
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with refresh button */}
      {showRefresh && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Estadísticas del Perfil</h3>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      )}

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="text-sm font-medium text-gray-700">Calificación</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {profileStats.rating > 0 ? profileStats.rating.toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-gray-500">
                  {profileStats.reviewCount} reseña{profileStats.reviewCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Tasa de respuesta</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {profileStats.responseRate}%
                </div>
                <div className="text-xs text-gray-500">
                  Promedio de respuestas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Breakdown */}
      {(profileStats.sentMessages > 0 || profileStats.receivedMessages > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Actividad de Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-blue-600">{profileStats.sentMessages}</div>
                <div className="text-xs text-gray-500">Enviados</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">{profileStats.receivedMessages}</div>
                <div className="text-xs text-gray-500">Recibidos</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">{profileStats.unreadMessages}</div>
                <div className="text-xs text-gray-500">Sin leer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Miembro desde {formatDate(profileStats.joinDate)}
              </span>
            </div>
            <Badge className={cn("text-xs", verification.color)}>
              <VerificationIcon className="w-3 h-3 mr-1" />
              {verification.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AchievementBadge
              title="Primer Favorito"
              description="Recibiste tu primer favorito"
              earned={profileStats.favoriteCount > 0}
              icon="❤️"
            />
            <AchievementBadge
              title="Comunicador"
              description="Enviaste 10+ mensajes"
              earned={profileStats.sentMessages >= 10}
              icon="💬"
            />
            <AchievementBadge
              title="Explorador"
              description="Realizaste 5+ búsquedas"
              earned={profileStats.searchesCount >= 5}
              icon="🔍"
            />
            <AchievementBadge
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

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color?: string;
  bgColor?: string;
  suffix?: string;
  isRating?: boolean;
}

function StatCard({ icon: Icon, value, label, color = "text-gray-600", bgColor = "bg-gray-50", suffix, isRating = false }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", bgColor)}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {isRating ? value.toFixed(1) : value.toLocaleString()}
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

function AchievementBadge({ title, description, earned, icon }: AchievementBadgeProps) {
  return (
    <div className={cn(
      "p-3 rounded-lg border-2 text-center transition-all cursor-pointer hover:scale-105",
      earned
        ? "border-green-200 bg-green-50 shadow-sm"
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

// Compact version for smaller displays
export function ProfileStatsCompact({ stats: propStats, className }: ProfileStatsProps) {
  const { stats: realStats, loading } = useUserStats();
  const { favoritesCount } = useUserFavorites();

  const profileStats = {
    profileViews: realStats?.profileViews || propStats?.profileViews || 0,
    favoriteCount: favoritesCount || propStats?.favoriteCount || 0,
    rating: realStats?.rating || propStats?.rating || 0,
    reviewCount: realStats?.reviewCount || propStats?.reviewCount || 0
  };

  if (loading) {
    return (
      <div className={cn("flex gap-4", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center animate-pulse">
            <div className="w-8 h-6 bg-gray-200 rounded mb-1"></div>
            <div className="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">{profileStats.profileViews}</div>
        <div className="text-xs text-gray-500">Vistas</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">{profileStats.favoriteCount}</div>
        <div className="text-xs text-gray-500">Favoritos</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">{profileStats.rating > 0 ? profileStats.rating.toFixed(1) : '0.0'}</div>
        <div className="text-xs text-gray-500">Rating</div>
      </div>
    </div>
  );
}
