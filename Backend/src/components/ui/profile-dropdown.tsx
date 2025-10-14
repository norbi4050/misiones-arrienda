"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown, Heart, MessageCircle, Bell, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import AvatarUniversal from '@/components/ui/avatar-universal';
import type { CurrentUser } from '@/lib/auth/mapUserProfile';

interface ProfileDropdownProps {
  user: CurrentUser | null;
  onSignOut: () => void;
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onSignOut,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setIsOpen(false);
    onSignOut();
  };

  // Si no hay usuario, no renderizar el dropdown
  if (!user) {
    return null;
  }

  // Obtener las iniciales del usuario
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const initials = getInitials(user.name, user.email);
  const displayName = user.name || user.email?.split('@')[0] || 'Usuario';

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-full",
          "hover:bg-gray-100 transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
      >
        {/* Avatar */}
        <AvatarUniversal
          userId={user.id}
          size="sm"
          fallbackText={displayName}
        />
        
        {/* User Name (hidden on mobile) */}
        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-24 truncate">
          {displayName}
        </span>
        
        {/* Chevron */}
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 transition-transform duration-200",
          isOpen ? "rotate-180" : "rotate-0"
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <AvatarUniversal
                userId={user.id}
                size="md"
                fallbackText={displayName}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* [AuthBridge] Menú condicional según userType e isCompany */}
            {user.userType === 'inmobiliaria' || user.isCompany ? (
              <>
                {/* Mi Empresa - Solo para Inmobiliaria y Empresa (dueno_directo) */}
                <Link
                  href="/mi-empresa"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                  Mi Empresa
                </Link>

                {/* Mis Publicaciones */}
                <Link
                  href="/mi-cuenta/publicaciones"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <FileText className="w-4 h-4 mr-3 text-gray-400" />
                  Mis Publicaciones
                </Link>

                {/* Favoritos */}
                <Link
                  href="/favorites"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <Heart className="w-4 h-4 mr-3 text-gray-400" />
                  Mis Favoritos
                </Link>

                {/* Mensajes */}
                <Link
                  href="/messages"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <MessageCircle className="w-4 h-4 mr-3 text-gray-400" />
                  Mensajes
                </Link>
              </>
            ) : (
              <>
                {/* Mi Perfil */}
                <Link
                  href="/profile/inquilino"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <User className="w-4 h-4 mr-3 text-gray-400" />
                  Mi Perfil
                </Link>

                {/* Mis Publicaciones */}
                <Link
                  href="/mi-cuenta/publicaciones"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-400" />
                  Mis publicaciones
                </Link>

                {/* Favoritos */}
                <Link
                  href="/favorites"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <Heart className="w-4 h-4 mr-3 text-gray-400" />
                  Mis Favoritos
                </Link>

                {/* Mensajes */}
                <Link
                  href="/comunidad/mensajes"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <MessageCircle className="w-4 h-4 mr-3 text-gray-400" />
                  Mensajes
                </Link>

                {/* Notificaciones */}
                <Link
                  href="/dashboard?tab=notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <Bell className="w-4 h-4 mr-3 text-gray-400" />
                  Notificaciones
                </Link>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Configuración */}
            <Link
              href="/settings/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Configuración
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Cerrar Sesión */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
            >
              <LogOut className="w-4 h-4 mr-3 text-red-500" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
