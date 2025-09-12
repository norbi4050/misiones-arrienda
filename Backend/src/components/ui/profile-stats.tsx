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

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
  bgColor: string;
  isRating?: boolean;
  suffix?: string;
}

interface AchievementBadgeProps {
  title: string;
  description: string;
  earned: boolean;
  icon: string;
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

// Export compact version for smaller displays
export function ProfileStatsCompact({ stats: propStats, className }: ProfileStatsProps) {
  return <ProfileStats stats={propStats} className={className} layout="compact" />;
}

export default ProfileStats;
