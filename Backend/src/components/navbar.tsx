"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Heart, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import { useCurrentUser } from "@/lib/auth/AuthProvider"
import AvatarUniversal from "@/components/ui/avatar-universal"
import { useMessagesUnread } from "@/hooks/useMessagesUnread"
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, isAgency, loading, signOut } = useCurrentUser()
  const { count: unreadCount } = useMessagesUnread({
    enabled: isAuthenticated && !isAgency // Solo para usuarios no-inmobiliarias
  })

  // Navegación dinámica según userType
  const navigation = React.useMemo(() => {
    const baseNav = [
      { name: 'Inicio', href: '/' },
      { name: 'Propiedades', href: '/properties' },
    ]
    
    // Solo mostrar Comunidad si NO es inmobiliaria
    if (!isAgency) {
      baseNav.push({ name: 'Comunidad', href: '/comunidad' })
    }
    
    baseNav.push({ name: 'Publicar', href: '/publicar' })

    // Agregar "Mi Empresa" si es inmobiliaria
    if (isAgency) {
      baseNav.push({ name: 'Mi Empresa', href: '/mi-empresa' })
    }

    return baseNav
  }, [isAgency])

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center" prefetch={false}>
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
                prefetch={false}
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

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              /* Loading skeleton */
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse" />
              </div>
            ) : isAuthenticated && user ? (
              <>
                {/* Quick Actions for authenticated users */}
                <Link href="/favorites" prefetch={false}>
                  <Button variant="ghost" size="sm" title="Mis Favoritos">
                    <Heart className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={isAgency ? "/messages" : "/comunidad/mensajes"} prefetch={false}>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Mensajes"
                    className="relative"
                    aria-label={unreadCount > 0 ? `Tienes ${unreadCount} mensajes sin leer` : 'Mensajes'}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Notification Dropdown */}
                <NotificationDropdown />

                {/* Profile Dropdown */}
                <ProfileDropdown user={user} onSignOut={signOut} />
              </>
            ) : (
              <>
                {/* Login/Register buttons for non-authenticated users */}
                <Link href="/login" prefetch={false}>
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register" prefetch={false}>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                  >
                    Crear Cuenta
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
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

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200",
                  pathname === item.href
                    ? "text-primary bg-primary/10"
                    : "text-gray-700 hover:text-primary hover:bg-gray-50"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {/* Mobile Authentication Section */}
            <div className="px-3 py-2 border-t border-gray-200">
                {loading ? (
                  /* Loading skeleton for mobile */
                  <div className="space-y-2">
                    <div className="h-12 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                ) : isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 py-2">
                      <AvatarUniversal
                        userId={user.id}
                        size="sm"
                        fallbackText={user.name || user.email || 'Usuario'}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name || user.email?.split('@')[0] || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {/* [AuthBridge] href y label dinámicos según isAgency */}
                    <Link
                      href={isAgency ? '/mi-empresa' : '/profile/inquilino'}
                      prefetch={false}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      {isAgency ? 'Mi Empresa' : 'Mi Perfil'}
                    </Link>
                    <Link
                      href="/favorites"
                      prefetch={false}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Mis Favoritos
                    </Link>
                    <Link
                      href={isAgency ? "/messages" : "/comunidad/mensajes"}
                      prefetch={false}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md relative"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="flex items-center justify-between">
                        Mensajes
                        {unreadCount > 0 && (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      prefetch={false}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/register"
                      prefetch={false}
                      className="block px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md text-center font-semibold shadow-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Crear Cuenta
                    </Link>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}