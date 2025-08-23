"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, User, LogIn, Menu, X } from "lucide-react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
              href="/#propiedades" 
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
            <Link 
              href="/login" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Iniciar Sesión
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
                href="/#propiedades"
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
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
