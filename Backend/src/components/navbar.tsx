"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, User, LogIn, Menu, X, LogOut, Building2, UserCheck, Search } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  // Función para obtener el icono y texto según el tipo de usuario
  const getUserTypeInfo = () => {
    if (!user?.userType) return { icon: User, text: "Usuario", color: "text-blue-600" }
    
    switch (user.userType) {
      case 'inmobiliaria':
        return { 
          icon: Building2, 
          text: "Inmobiliaria", 
          color: "text-purple-600" 
        }
      case 'dueno_directo':
        return { 
          icon: UserCheck, 
          text: "Dueño Directo", 
          color: "text-green-600" 
        }
      case 'inquilino':
      default:
        return { 
          icon: Search, 
          text: "Inquilino", 
          color: "text-blue-600" 
        }
    }
  }

  const userTypeInfo = getUserTypeInfo()
  const UserIcon = userTypeInfo.icon

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
              href="/profiles" 
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
            
            {/* Mostrar diferentes opciones según el estado de autenticación */}
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  // Usuario logueado - mostrar pestaña personalizada según tipo
                  <>
                    <Link 
                      href="/dashboard" 
                      className={`hover:${userTypeInfo.color} transition-colors flex items-center space-x-1 ${userTypeInfo.color}`}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>{userTypeInfo.text}</span>
                    </Link>
                    <span className="text-sm text-gray-600">
                      Hola, {user?.name}
                    </span>
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
                href="/profiles"
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
              
              {/* Mobile auth options */}
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    // Usuario logueado - versión móvil
                    <>
                      <div className="px-3 py-2 text-sm text-gray-600 border-t">
                        Hola, {user?.name}
                      </div>
                      <Link
                        href="/dashboard"
                        className={`block px-3 py-2 hover:${userTypeInfo.color} transition-colors flex items-center space-x-2 ${userTypeInfo.color}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>{userTypeInfo.text}</span>
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
