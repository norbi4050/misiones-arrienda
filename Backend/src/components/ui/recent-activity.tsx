"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import {
  Heart,
  MessageCircle,
  Search,
  Settings,
  Eye,
  Timer,
  TrendingUp
} from 'lucide-react';
import { cn } from "@/utils";
import { useUserActivity } from '@/hooks/useUserActivity';

interface ActivityItemProps {
  type: 'favorite_added' | 'favorite_removed' | 'profile_updated' | 'message_sent' | 'search_saved' | 'property_viewed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    propertyId?: string;
    propertyTitle?: string;
    recipientName?: string;
    searchQuery?: string;
  };
}

function ActivityItem({ type, title, description, timestamp }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'favorite_added':
      case 'favorite_removed':
        return Heart;
      case 'message_sent':
        return MessageCircle;
      case 'search_saved':
        return Search;
      case 'profile_updated':
        return Settings;
      case 'property_viewed':
        return Eye;
      default:
        return TrendingUp;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'favorite_added':
        return 'text-red-500';
      case 'favorite_removed':
        return 'text-gray-500';
      case 'message_sent':
        return 'text-blue-500';
      case 'search_saved':
        return 'text-green-500';
      case 'profile_updated':
        return 'text-purple-500';
      case 'property_viewed':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'favorite_added':
        return 'bg-red-50';
      case 'favorite_removed':
        return 'bg-gray-50';
      case 'message_sent':
        return 'bg-blue-50';
      case 'search_saved':
        return 'bg-green-50';
      case 'profile_updated':
        return 'bg-purple-50';
      case 'property_viewed':
        return 'bg-orange-50';
      default:
        return 'bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;

    return activityTime.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const Icon = getIcon();

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-opacity-80",
      getBgColor()
    )}>
      <div className="flex-shrink-0">
        <Icon className={cn("w-5 h-5", getIconColor())} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {title}
        </p>
        <p className="text-sm text-gray-600 truncate">
          {description}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Timer className="w-3 h-3 text-gray-400" />
          <p className="text-xs text-gray-500">
            {formatTimeAgo(timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface RecentActivityProps {
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
}

export function RecentActivity({
  className,
  maxItems = 5,
  showHeader = true
}: RecentActivityProps) {
  const { activities, loading, error } = useUserActivity();

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-6">
            <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No se pudo cargar la actividad reciente
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {error}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-6">
            <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No hay actividad reciente
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tu actividad aparecerá aquí cuando interactúes con la plataforma
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              type={activity.type}
              title={activity.title}
              description={activity.description}
              timestamp={activity.timestamp}
              metadata={activity.metadata}
            />
          ))}
        </div>

        {activities.length > maxItems && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Mostrando {maxItems} de {activities.length} actividades
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for smaller spaces
export function RecentActivityCompact({
  className,
  maxItems = 3
}: {
  className?: string;
  maxItems?: number;
}) {
  const { activities, loading } = useUserActivity();

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-2 p-2 bg-gray-50 rounded">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("space-y-2", className)}>
      {displayActivities.map((activity) => {
        const Icon = activity.type === 'favorite_added' ? Heart :
                   activity.type === 'message_sent' ? MessageCircle :
                   activity.type === 'search_saved' ? Search : Settings;

        return (
          <div key={activity.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
            <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{activity.title}</span>
          </div>
        );
      })}
    </div>
  );
}

export default RecentActivity;
