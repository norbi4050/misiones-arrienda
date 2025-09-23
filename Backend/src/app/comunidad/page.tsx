'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

type Profile = {
  profile_id: string
  user_id: string | null
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  created_at?: string | null
}

export default function ComunidadPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/community/profiles', { cache: 'no-store' })
      
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
      } else {
        console.error('Error fetching profiles:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Comunidad</h1>
              <p className="text-gray-600 mt-1">Encuentra tu compañero de casa ideal</p>
            </div>
            <div className="flex gap-3">
              <Link href="/comunidad/publicar">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Crear Perfil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lista de perfiles */}
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron perfiles</h3>
            <p className="text-gray-600 mb-6">Sé el primero en crear un perfil en la comunidad</p>
            <Link href="/comunidad/publicar">
              <Button>Crear tu perfil</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Card key={profile.profile_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name ?? 'Usuario'}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {profile.display_name ?? 'Usuario'}
                      </CardTitle>
                      {profile.created_at && (
                        <p className="text-sm text-gray-600">
                          Miembro desde {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/comunidad/${profile.profile_id}`} className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Ver perfil
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
