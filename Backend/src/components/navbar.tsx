"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Search, Heart, MessageCircle } from "lucide-react"
import { cn } from "@/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import { AvatarUniversal } from "@/components/ui/avatar-universal"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useUser } from "@/contexts/UserContext"
import type { Session } from "@supabase/supabase-js"

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Propiedades', href: '/properties' },
  { name: 'Comunidad', href: '/comunidad' },
  { name: 'Publicar', href: '/publicar' },
]

interface NavbarProps {
  initialSession?: Session | null
}

export function Navbar({ initialSession }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const pathname = usePathname()
  const { user, loading, isAuthenticated, signOut } = useSupabaseAuth()
  const { profile } = useUser()

  // Usar sesión inicial del servidor para evitar flicker
  const hasInitialSession = !!initialSession?.user
  const shouldShowAuth = !loading || hasInitialSession
  const isUserAuthenticated = isAuthenticated || hasInitialSession
  const currentUser = user || initialSession?.user
  const displayName = profile?.name || currentUser?.email?.split('@')[0] || 'Usuario'

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
          <div className="hidden md:flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Buscar propiedades..."
                    className="w-64"
                    icon={<Search className="h-4 w-4" />}
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
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Authentication Section */}
            {shouldShowAuth && (
              <>
                {isUserAuthenticated && currentUser ? (
                  <>
                    {/* Quick Actions for authenticated users */}
                    <Link href="/profile/inquilino?tab=favoritos">
                      <Button variant="ghost" size="sm" title="Mis Favoritos">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/profile/inquilino?tab=mensajes">
                      <Button variant="ghost" size="sm" title="Mensajes">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </Link>

                    {/* Profile Dropdown */}
                    <ProfileDropdown user={currentUser} onSignOut={signOut} />
                  </>
                ) : (
                  <>
                    {/* Login/Register buttons for non-authenticated users */}
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="default" size="sm">
                        Registrarse
                      </Button>
                    </Link>
                  </>
                )}
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

            {/* Mobile Search */}
            <div className="px-3 py-2">
              <Input
                type="text"
                placeholder="Buscar propiedades..."
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Mobile Authentication Section */}
            {shouldShowAuth && (
              <div className="px-3 py-2 border-t border-gray-200">
                {isUserAuthenticated && currentUser ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 py-2">
                      <AvatarUniversal
                        src={profile?.profile_image}
                        name={displayName}
                        updatedAt={profile?.updated_at}
                        size="sm"
                        showFallback={true}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/profile/inquilino"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/profile/inquilino?tab=favoritos"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Mis Favoritos
                    </Link>
                    <Link
                      href="/profile/inquilino?tab=mensajes"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Mensajes
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
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/register"
                      className="block px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
