"use client"

import * as React from "react"
import Link from "next/link"
import { User, FileText, LogOut, Heart, MessageCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AvatarUniversal } from "@/components/ui/avatar-universal"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface ProfileDropdownProps {
  user: SupabaseUser
  profileImage?: string | null
  updatedAt?: string | null
  onSignOut: () => void
}

export function ProfileDropdown({ user, profileImage, updatedAt, onSignOut }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const displayName = user.email?.split('@')[0] || 'Usuario'

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="relative h-8 w-8 rounded-full p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <AvatarUniversal
          src={profileImage}
          name={displayName}
          updatedAt={updatedAt}
          size="sm"
          showFallback={true}
        />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-50">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-gray-500 mt-1">
                {user.email}
              </p>
            </div>

            <div className="py-1">
              <Link
                href="/profile/inquilino"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </Link>
              <Link
                href="/profile/inquilino?tab=favoritos"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Heart className="mr-2 h-4 w-4" />
                Mis Favoritos
              </Link>
              <Link
                href="/profile/inquilino?tab=mensajes"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Mensajes
              </Link>
              <Link
                href="/mis-publicaciones"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Mis publicaciones
              </Link>
            </div>

            <div className="border-t py-1">
              <button
                onClick={() => {
                  setIsOpen(false)
                  onSignOut()
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
