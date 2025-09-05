"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Search, Heart, MessageCircle, User, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import { useAuth } from "@/hooks/useAuth"

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Propiedades', href: '/properties' },
  { name: 'Comunidad', href: '/comunidad' },
  { name: 'Publicar', href: '/publicar' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const pathname = usePathname()
  const { user, loading, isAuthenticated, signOut } = useAuth()

  // Debug logging para verificar el estado de autenticación
  React.useEffect(() => {
    console.log('Navbar Auth State:', {
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      loading,
      isAuthenticated,
      userExists: !!user
    });
  }, [user, loading, isAuthenticated]);

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary">
                Misiones Arrienda
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "text-primary bg-primary/10 border-b-2 border-primary"
                    : "text-gray-700 hover:text-primary hover:bg-gray-50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Search and Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Buscar propiedades..."
                    className="w-64"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(true)}
                  className="p-2"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-500">Cargando...</span>
              </div>
            )}

            {/* Authentication Section - Mejorada visibilidad */}
            {!loading && (
              <div className="flex items-center space-x-2">
                {isAuthenticated && user ? (
                  <>
                    {/* Quick Actions for authenticated users */}
                    <Link href="/dashboard?tab=favorites">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Mis Favoritos"
                        className="p-2 hover:bg-gray-100"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/dashboard?tab=messages">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Mensajes"
                        className="p-2 hover:bg-gray-100"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    {/* Profile Dropdown - Mejorado */}
                    <div className="relative">
                      <ProfileDropdown 
                        user={user} 
                        onSignOut={signOut}
                        className="z-50"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Login/Register buttons for non-authenticated users - Mejorados */}
                    <Link href="/login">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-100 border border-gray-200"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>Iniciar Sesión</span>
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button 
                        variant="default" 
                        size="sm"
                        className="flex items-center space-x-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white"
                      >
                        <User className="h-4 w-4" />
                        <span>Registrarse</span>
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Mejorado */}
      {isOpen && (
        <div className="md:hidden border-t bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200",
                  pathname === item.href
                    ? "text-primary bg-primary/10 border-l-4 border-primary"
                    : "text-gray-700 hover:text-primary hover:bg-gray-50"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile Search */}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar propiedades..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Mobile Authentication Section - Mejorado */}
            <div className="border-t border-gray-200 pt-2">
              {loading && (
                <div className="px-3 py-2 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-500">Cargando...</span>
                </div>
              )}
              
              {!loading && (
                <>
                  {isAuthenticated && user ? (
                    <div className="space-y-1">
                      {/* User Info Header */}
                      <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-md mx-2">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {user.name?.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name || user.email?.split('@')[0] || 'Usuario'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <Link
                        href="/profile"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md mx-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3 text-gray-400" />
                        Mi Perfil
                      </Link>
                      <Link
                        href="/dashboard?tab=favorites"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md mx-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <Heart className="w-4 h-4 mr-3 text-gray-400" />
                        Mis Favoritos
                      </Link>
                      <Link
                        href="/dashboard?tab=messages"
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md mx-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <MessageCircle className="w-4 h-4 mr-3 text-gray-400" />
                        Mensajes
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          signOut();
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mx-2"
                      >
                        <LogIn className="w-4 h-4 mr-3 text-red-500 transform rotate-180" />
                        Cerrar Sesión
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 px-2">
                      <Link
                        href="/login"
                        className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                        onClick={() => setIsOpen(false)}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Iniciar Sesión
                      </Link>
                      <Link
                        href="/register"
                        className="flex items-center justify-center px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                        onClick={() => setIsOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Registrarse
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
