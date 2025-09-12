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
  Users,
  Loader2,
  AlertCircle
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

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
  bgColor: string;
  isRating?: boolean;
  suffix?: string;
  isLoading?: boolean;
  motivationalMessage?: string;
}

interface AchievementBadgeProps {
  title: string;
  description: string;
  earned: boolean;
  icon: string;
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color, 
  bgColor, 
  isRating = false, 
  suffix,
  isLoading = false,
  motivationalMessage
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", bgColor)}>
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            {value === 0 && motivationalMessage && (
              <p className="text-xs text-blue-600 mt-1 truncate">
                {motivationalMessage}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
        "text-xs font-medium mb-1",
        earned ? "text-green-800" : "text-gray-500"
      )}>
        {title}
      </h4>
      <p className={cn(
        "text-xs",
        earned ? "text-green-600" : "text-gray-400"
      )}>
        {description}
      </p>
    </div>
  );
}

export function ProfileStatsEnhanced({ stats: propStats, className, layout = 'grid' }: ProfileStatsProps) {
  const { stats: hookStats, loading: statsLoading, error: statsError } = useUserStats();
  const { favoritesCount, loading: favLoading, error: favError } = useUserFavorites();

  // Merge stats from props and hooks, with hooks taking priority
  const profileStats = {
    profileViews: hookStats?.profileViews ?? propStats?.profileViews ?? 0,
    favoriteCount: favoritesCount ?? hookStats?.favoriteCount ?? propStats?.favoriteCount ?? 0,
    messageCount: hookStats?.messageCount ?? propStats?.messageCount ?? 0,
    rating: hookStats?.rating ?? propStats?.rating ?? 0,
    reviewCount: hookStats?.reviewCount ?? propStats?.reviewCount ?? 0,
    searchesCount: hookStats?.searchesCount ?? propStats?.searchesCount ?? 0,
    responseRate: hookStats?.responseRate ?? propStats?.responseRate ?? 0,
    joinDate: hookStats?.joinDate ?? propStats?.joinDate ?? '',
    verificationLevel: hookStats?.verificationLevel ?? propStats?.verificationLevel ?? 'none'
  };

  const isLoading = statsLoading || favLoading;
  const hasError = statsError || favError;

  // Motivational messages for zero values
  const motivationalMessages = {
    profileViews: "¡Completa tu perfil para más vistas!",
    favoriteCount: "¡Guarda propiedades que te gusten!",
    messageCount: "¡Contacta propietarios!",
    rating: "¡Recibe tu primera reseña!"
  };

  if (hasError && !isLoading) {
    return (
      <Card className={cn("border-orange-200 bg-orange-50", className)}>
        <CardContent className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-orange-700 text-sm font-medium">
            Problema cargando estadísticas
          </p>
          <p className="text-orange-600 text-xs mt-1">
            Mostrando datos disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  if (layout === 'compact') {
    if (isLoading) {
      return (
        <div className={cn("flex flex-wrap gap-4 justify-center", className)}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-1"></div>
              <div className="w-12 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={cn("flex flex-wrap gap-4 justify-center", className)}>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profileStats.profileViews}</div>
          <div className="text-xs text-gray-500">Vistas</div>
          {profileStats.profileViews === 0 && (
            <div className="text-xs text-blue-600 mt-1">¡Completa tu perfil!</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profileStats.favoriteCount}</div>
          <div className="text-xs text-gray-500">Favoritos</div>
          {profileStats.favoriteCount === 0 && (
            <div className="text-xs text-blue-600 mt-1">¡Guarda propiedades!</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{profileStats.messageCount}</div>
          <div className="text-xs text-gray-500">Mensajes</div>
          {profileStats.messageCount === 0 && (
            <div className="text-xs text-blue-600 mt-1">¡Contacta propietarios!</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {profileStats.rating > 0 ? profileStats.rating.toFixed(1) : '0.0'}
          </div>
          <div className="text-xs text-gray-500">Rating</div>
          {profileStats.rating === 0 && (
            <div className="text-xs text-blue-600 mt-1">¡Primera reseña!</div>
          )}
        </div>
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
        isLoading={isLoading}
        motivationalMessage={motivationalMessages.profileViews}
      />
      <StatCard
        icon={Heart}
        value={profileStats.favoriteCount}
        label="Favoritos"
        color="text-red-600"
        bgColor="bg-red-50"
        isLoading={isLoading}
        motivationalMessage={motivationalMessages.favoriteCount}
      />
      <StatCard
        icon={MessageCircle}
        value={profileStats.messageCount}
        label="Mensajes"
        color="text-green-600"
        bgColor="bg-green-50"
        isLoading={isLoading}
        motivationalMessage={motivationalMessages.messageCount}
      />
      <StatCard
        icon={Star}
        value={profileStats.rating}
        label="Rating"
        color="text-yellow-600"
        bgColor="bg-yellow-50"
        isRating={true}
        isLoading={isLoading}
        motivationalMessage={motivationalMessages.rating}
      />
    </div>
  );
}

// Detailed layout with achievements and additional info
export function ProfileStatsDetailed({ stats: propStats, className }: ProfileStatsProps) {
  const { stats: hookStats, loading: statsLoading, error: statsError } = useUserStats();
  const { favoritesCount, loading: favLoading } = useUserFavorites();

  const profileStats = {
    profileViews: hookStats?.profileViews ?? propStats?.profileViews ?? 0,
    favoriteCount: favoritesCount ?? hookStats?.favoriteCount ?? propStats?.favoriteCount ?? 0,
    messageCount: hookStats?.messageCount ?? propStats?.messageCount ?? 0,
    rating: hookStats?.rating ?? propStats?.rating ?? 0,
    reviewCount: hookStats?.reviewCount ?? propStats?.reviewCount ?? 0,
    searchesCount: hookStats?.searchesCount ?? propStats?.searchesCount ?? 0,
    responseRate: hookStats?.responseRate ?? propStats?.responseRate ?? 0,
    joinDate: hookStats?.joinDate ?? propStats?.joinDate ?? '',
    verificationLevel: hookStats?.verificationLevel ?? propStats?.verificationLevel ?? 'none'
  };

  const isLoading = statsLoading || favLoading;

  const achievements = [
    {
      title: "Primera Vista",
      description: "Perfil visto por primera vez",
      earned: profileStats.profileViews > 0,
      icon: "👁️"
    },
    {
      title: "Primer Favorito",
      description: "Primera propiedad guardada",
      earned: profileStats.favoriteCount > 0,
      icon: "❤️"
    },
    {
      title: "Comunicador",
      description: "Primer mensaje enviado",
      earned: profileStats.messageCount > 0,
      icon: "💬"
    },
    {
      title: "Bien Valorado",
      description: "Rating superior a 4.0",
      earned: profileStats.rating >= 4.0,
      icon: "⭐"
    }
  ];

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Logros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 bg-gray-100 rounded-lg animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Stats */}
      <ProfileStatsEnhanced stats={profileStats} layout="grid" />
      
      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Search className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profileStats.searchesCount}</div>
            <div className="text-sm text-gray-600">Búsquedas Guardadas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profileStats.responseRate}%</div>
            <div className="text-sm text-gray-600">Tasa de Respuesta</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-gray-900">
              {profileStats.joinDate ? new Date(profileStats.joinDate).toLocaleDateString('es-AR', { 
                month: 'short', 
                year: 'numeric' 
              }) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Miembro desde</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <AchievementBadgeComponent
                key={index}
                title={achievement.title}
                description={achievement.description}
                earned={achievement.earned}
                icon={achievement.icon}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export compact version for smaller displays
export function ProfileStatsCompactEnhanced({ stats: propStats, className }: ProfileStatsProps) {
  return <ProfileStatsEnhanced stats={propStats} className={className} layout="compact" />;
}

export default ProfileStatsEnhanced;
