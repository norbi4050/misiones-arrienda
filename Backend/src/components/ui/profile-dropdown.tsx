"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown, Heart, MessageCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface ProfileDropdownProps {
  user: User | null;
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

  // Debug logging para verificar el estado del dropdown
  useEffect(() => {
    console.log('ProfileDropdown State:', {
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      isOpen,
      userExists: !!user
    });
  }, [user, isOpen]);

  const handleSignOut = () => {
    console.log('ProfileDropdown: Signing out user');
    setIsOpen(false);
    onSignOut();
  };

  // Si no hay usuario, no renderizar el dropdown
  if (!user) {
    console.log('ProfileDropdown: No user provided, not rendering');
    return null;
  }

  // Obtener las iniciales del usuario
  const getInitials = (name?: string, email?: string) => {
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
      {/* Trigger Button - Mejorado para mayor visibilidad */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-full",
          "hover:bg-gray-100 transition-colors duration-200 border border-gray-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "bg-white shadow-sm"
        )}
      >
        {/* Avatar - Mejorado */}
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
          {initials}
        </div>
        
        {/* User Name (hidden on mobile) - Mejorado */}
        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-24 truncate">
          {displayName}
        </span>
        
        {/* Chevron - Mejorado */}
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 transition-transform duration-200",
          isOpen ? "rotate-180" : "rotate-0"
        )} />
      </Button>

      {/* Dropdown Menu - Mejorado con mejor z-index y sombra */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] animate-in slide-in-from-top-2 duration-200">
          {/* User Info Header - Mejorado */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium shadow-sm">
                {initials}
              </div>
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

          {/* Menu Items - Mejorados */}
          <div className="py-1">
            {/* Mi Perfil */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50"
            >
              <User className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Mi Perfil</span>
            </Link>

            {/* Favoritos */}
            <Link
              href="/dashboard?tab=favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50"
            >
              <Heart className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Mis Favoritos</span>
            </Link>

            {/* Mensajes */}
            <Link
              href="/dashboard?tab=messages"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50"
            >
              <MessageCircle className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Mensajes</span>
            </Link>

            {/* Notificaciones */}
            <Link
              href="/dashboard?tab=notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50"
            >
              <Bell className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Notificaciones</span>
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Configuración */}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              <span className="font-medium">Configuración</span>
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Cerrar Sesión - Mejorado */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 rounded-b-lg"
            >
              <LogOut className="w-4 h-4 mr-3 text-red-500" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
