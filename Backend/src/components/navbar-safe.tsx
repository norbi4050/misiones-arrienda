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

export function NavbarSafe({ initialSession }: NavbarProps) {
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

  // Valores por defecto para evitar errores
  const favoritesCount = 0
  const unreadCount = 0

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
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-gray-700"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Buscar propiedades..."
                    className="w-64"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {shouldShowAuth && (
              <>
                {isUserAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    {/* Favorites */}
                    <Link href="/favorites">
                      <Button variant="ghost" size="icon" className="relative">
                        <Heart className="h-4 w-4" />
                        {favoritesCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {favoritesCount}
                          </span>
                        )}
                      </Button>
                    </Link>

                    {/* Messages */}
                    <Link href="/messages">
                      <Button variant="ghost" size="icon" className="relative">
                        <MessageCircle className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </Button>
                    </Link>

                    {/* Profile Dropdown */}
                    <ProfileDropdown
                      user={currentUser!}
                      profileImage={profile?.profile_image}
                      updatedAt={profile?.updated_at}
                      onSignOut={signOut}
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link href="/login">
                      <Button variant="ghost">Iniciar Sesión</Button>
                    </Link>
                    <Link href="/register">
                      <Button>Registrarse</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 text-base font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "text-primary bg-primary/10"
                      : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {shouldShowAuth && (
                <>
                  {isUserAuthenticated ? (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center px-3 py-2">
                        <AvatarUniversal
                          src={profile?.profile_image}
                          name={displayName}
                          updatedAt={profile?.updated_at}
                          size="sm"
                          showFallback={true}
                        />
                        <div className="ml-3">
                          <div className="text-base font-medium text-gray-800">
                            {displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {currentUser?.email}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <Link
                          href="/profile/inquilino"
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                          onClick={() => setIsOpen(false)}
                        >
                          Mi Perfil
                        </Link>
                        <Link
                          href="/favorites"
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                          onClick={() => setIsOpen(false)}
                        >
                          Mis Favoritos
                        </Link>
                        <Link
                          href="/messages"
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
