"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Search, User, Heart, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

            {/* Quick Actions */}
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
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
          </div>
        </div>
      )}
    </nav>
  )
}