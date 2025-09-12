"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  Search, 
  BarChart3, 
  Bell, 
  Shield
} from 'lucide-react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { useUserStats } from '@/hooks/useUserStats';
import { useUserFavorites } from '@/hooks/useUserFavorites';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count?: number;
  hasNotification?: boolean;
  isNew?: boolean;
  isComingSoon?: boolean;
}

interface QuickActionsGridProps {
  className?: string;
  userId?: string;
}

export function QuickActionsGrid({ className, userId }: QuickActionsGridProps) {
  const { stats, loading: statsLoading } = useUserStats();
  const { favoritesCount } = useUserFavorites();

  // Use real data when available, fallback to 0
  const realStats = {
    favorites: favoritesCount,
    messages: stats?.messageCount || 0,
    searches: stats?.searchesCount || 0,
    views: stats?.profileViews || 0
  };

  const quickActions: QuickAction[] = [
    {
      id: 'favorites',
      title: 'Mis Favoritos',
      description: 'Propiedades que me interesan',
      href: '/profile/inquilino?tab=favoritos',
      icon: Heart,
      color: 'bg-red-50 text-red-600 border-red-200',
      count: realStats.favorites,
      hasNotification: false
    },
    {
      id: 'messages',
      title: 'Mensajes',
      description: 'Conversaciones activas',
      href: '/profile/inquilino?tab=mensajes',
      icon: MessageCircle,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      count: realStats.messages,
      hasNotification: realStats.messages > 0
    },
    {
      id: 'searches',
      title: 'Búsquedas Guardadas',
      description: 'Filtros y alertas',
      href: '/profile/inquilino?tab=busquedas',
      icon: Search,
      color: 'bg-green-50 text-green-600 border-green-200',
      count: realStats.searches,
      hasNotification: false
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Estadísticas y actividad',
      href: '/dashboard',
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      count: realStats.views,
      hasNotification: false
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      description: 'Alertas y actualizaciones',
      href: '/profile/inquilino?tab=notificaciones',
      icon: Bell,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      hasNotification: realStats.messages > 0, // Show notification if there are unread messages
      isNew: true
    },
    {
      id: 'security',
      title: 'Seguridad',
      description: 'Privacidad y verificación',
      href: '/profile/inquilino?tab=seguridad',
      icon: Shield,
      color: 'bg-gray-50 text-gray-600 border-gray-200',
      isComingSoon: true
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {quickActions.map((action) => (
        <QuickActionCard key={action.id} action={action} />
      ))}
    </div>
  );
}

interface QuickActionCardProps {
  action: QuickAction;
}

function QuickActionCard({ action }: QuickActionCardProps) {
  if (action.isComingSoon) {
    return (
      <div>
        <Card className={cn(
          "group hover:shadow-lg transition-all duration-200 border-2 opacity-60 cursor-not-allowed",
          action.color.includes('border-') ? action.color : 'border-gray-200'
        )}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-3 rounded-xl",
                action.color.replace('border-', '').replace('text-', 'text-')
              )}>
                <action.icon className="w-6 h-6" />
              </div>
              
              <div className="flex flex-col items-end gap-1">
                {action.hasNotification && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                {action.isNew && (
                  <Badge variant="secondary" className="text-xs">
                    Nuevo
                  </Badge>
                )}
                {action.isComingSoon && (
                  <Badge variant="outline" className="text-xs">
                    Próximamente
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">
                {action.description}
              </p>
              
              {action.count !== undefined && (
                <div className="flex items-center gap-2 pt-2">
                  <div className={cn(
                    "text-2xl font-bold",
                    action.color.includes('text-') ? action.color.split(' ')[1] : 'text-gray-900'
                  )}>
                    {action.count}
                  </div>
                  <div className="text-xs text-gray-500">
                    {action.id === 'favorites' && 'propiedades'}
                    {action.id === 'messages' && 'sin leer'}
                    {action.id === 'searches' && 'activas'}
                    {action.id === 'dashboard' && 'visualizaciones'}
                  </div>
                </div>
              )}
            </div>

            {/* Progress indicator for some cards */}
            {action.id === 'favorites' && action.count && action.count > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Propiedades guardadas</span>
                  <span>{action.count} total</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-red-500 h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((action.count / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {action.id === 'messages' && action.hasNotification && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Tienes mensajes sin leer</span>
                </div>
              </div>
            )}

            {action.id === 'dashboard' && action.count && action.count > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Vistas del perfil</span>
                  <span>Este mes</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Link href={action.href}>
      <Card className={cn(
        "group hover:shadow-lg transition-all duration-200 border-2 hover:scale-[1.02] cursor-pointer",
        action.color.includes('border-') ? action.color : 'border-gray-200'
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "p-3 rounded-xl",
              action.color.replace('border-', '').replace('text-', 'text-')
            )}>
              <action.icon className="w-6 h-6" />
            </div>
            
            <div className="flex flex-col items-end gap-1">
              {action.hasNotification && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {action.isNew && (
                <Badge variant="secondary" className="text-xs">
                  Nuevo
                </Badge>
              )}
              {action.isComingSoon && (
                <Badge variant="outline" className="text-xs">
                  Próximamente
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-gray-600">
              {action.description}
            </p>
            
            {action.count !== undefined && (
              <div className="flex items-center gap-2 pt-2">
                <div className={cn(
                  "text-2xl font-bold",
                  action.color.includes('text-') ? action.color.split(' ')[1] : 'text-gray-900'
                )}>
                  {action.count}
                </div>
                <div className="text-xs text-gray-500">
                  {action.id === 'favorites' && 'propiedades'}
                  {action.id === 'messages' && 'sin leer'}
                  {action.id === 'searches' && 'activas'}
                  {action.id === 'dashboard' && 'visualizaciones'}
                </div>
              </div>
            )}
          </div>

          {/* Progress indicator for some cards */}
          {action.id === 'favorites' && action.count && action.count > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Propiedades guardadas</span>
                <span>{action.count} total</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-red-500 h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((action.count / 20) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {action.id === 'messages' && action.hasNotification && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Tienes mensajes sin leer</span>
              </div>
            </div>
          )}

          {action.id === 'dashboard' && action.count && action.count > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Vistas del perfil</span>
                <span>Este mes</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Compact version for smaller spaces
export function QuickActionsCompact({ className }: { className?: string }) {
  const { stats } = useUserStats();
  const { favoritesCount } = useUserFavorites();

  const compactActions = [
    {
      title: 'Favoritos',
      href: '/profile/inquilino?tab=favoritos',
      icon: Heart,
      count: favoritesCount,
      color: 'text-red-600'
    },
    {
      title: 'Mensajes',
      href: '/profile/inquilino?tab=mensajes',
      icon: MessageCircle,
      count: stats?.messageCount || 0,
      color: 'text-blue-600',
      hasNotification: (stats?.messageCount || 0) > 0
    },
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      count: stats?.profileViews || 0,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className={cn("flex gap-4", className)}>
      {compactActions.map((action, index) => (
        <Link key={index} href={action.href}>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="relative">
              <action.icon className={cn("w-5 h-5", action.color)} />
              {action.hasNotification && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium">{action.title}</div>
              <div className="text-xs text-gray-500">{action.count}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
