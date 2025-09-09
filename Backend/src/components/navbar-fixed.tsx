"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, User, LogIn, Menu, X, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Fix React Error #425: Hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fix React Error #418: Invalid hook call - only call hooks at top level
  const authResult = useAuth()
  const { user, isAuthenticated, signOut, loading } = authResult || {
    user: null,
    isAuthenticated: false,
    signOut: () => {},
    loading: true
  }

  const handleLogout = () => {
    if (signOut) {
      signOut()
    }
    setIsMenuOpen(false)
  }

  // Prevent hydration mismatch by showing loading state on server
  if (!isClient) {
    return (
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Misiones Arrienda
              </span>
            </Link>

            {/* Desktop Navigation - Basic version for SSR */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Inicio
              </Link>
              <Link 
                href="/properties" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Propiedades
              </Link>
            <Link
              href="/profile/inquilino"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Perfiles
            </Link>
              <Link 
                href="/publicar" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Publicar
              </Link>
              <Link 
                href="/inmobiliaria/register" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Inmobiliarias
              </Link>
              <Link 
                href="/dueno-directo/register" 
                className="text-gray-700 hover:text-green-600 transition-colors"
              >
                Dueño Directo
              </Link>
              
              {/* Default auth state for SSR */}
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-1"
              >
                <LogIn className="h-4 w-4" />
                <span>Iniciar Sesión</span>
              </Link>
              <Link href="/register">
                <Button>
                  Registrarse
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Home className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Misiones Arrienda
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Inicio
            </Link>
            <Link 
              href="/properties" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Propiedades
            </Link>
            <Link
              href="/profile/inquilino"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Perfiles
            </Link>
            <Link 
              href="/publicar" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Publicar
            </Link>
            <Link 
              href="/inmobiliaria/register" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Inmobiliarias
            </Link>
            <Link 
              href="/dueno-directo/register" 
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              Dueño Directo
            </Link>
            
            {/* Fix React Error #423: Cannot read properties - safe property access */}
            {!loading && (
              <>
                {isAuthenticated ? (
                  // Usuario logueado - mostrar perfil y logout
                  <>
                    <Link
                      href="/profile/inquilino"
                      className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-1"
                    >
                      <User className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                    {user?.name && (
                      <span className="text-sm text-gray-600">
                        Hola, {user.name}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center space-x-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Salir</span>
                    </Button>
                  </>
                ) : (
                  // Usuario no logueado - mostrar login y registro
                  <>
                    <Link 
                      href="/login" 
                      className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-1"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Iniciar Sesión</span>
                    </Link>
                    <Link href="/register">
                      <Button>
                        Registrarse
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/properties"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Propiedades
              </Link>
              <Link
                href="/profile/inquilino"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Perfiles
              </Link>
              <Link
                href="/publicar"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Publicar
              </Link>
              <Link
                href="/inmobiliaria/register"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Inmobiliarias
              </Link>
              <Link
                href="/dueno-directo/register"
                className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dueño Directo
              </Link>
              
              {/* Mobile auth options - Safe property access */}
              {!loading && (
                <>
                  {isAuthenticated ? (
                    // Usuario logueado - versión móvil
                    <>
                      {user?.name && (
                        <div className="px-3 py-2 text-sm text-gray-600 border-t">
                          Hola, {user.name}
                        </div>
                      )}
                      <Link
                        href="/profile/inquilino"
                        className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 text-gray-700 hover:text-red-600 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    // Usuario no logueado - versión móvil
                    <>
                      <Link
                        href="/login"
                        className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Iniciar Sesión
                      </Link>
                      <div className="px-3 py-2">
                        <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                          <Button className="w-full">
                            Registrarse
                          </Button>
                        </Link>
                      </div>
                    </>
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
