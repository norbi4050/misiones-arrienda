'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { MyCommunityPostCard } from '@/components/comunidad/MyCommunityPostCard'
import type { CommunityPost } from '@/types/community'

export function MyCommunityPostsClient() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchPosts = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        _t: Date.now().toString() // Cache buster
      })

      const response = await fetch(`/api/comunidad/my-posts?${params}`, {
        cache: 'no-store' // Forzar no-cache
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setTotal(data.total)
        setHasMore(data.hasMore)
      } else {
        console.error('Error fetching posts')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/comunidad" prefetch={false}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mis Publicaciones</h1>
                <p className="text-gray-600 mt-1">
                  {total} {total === 1 ? 'publicación' : 'publicaciones'}
                </p>
              </div>
            </div>

            <Link href="/comunidad/publicar">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Publicación
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1) // Reset a página 1 al cambiar filtro
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="archived">Archivadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <div data-testid="my-community-posts-list">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 mb-4">
                  {statusFilter === 'all' 
                    ? 'No tienes publicaciones aún' 
                    : `No tienes publicaciones ${statusFilter === 'active' ? 'activas' : 'archivadas'}`}
                </p>
                <Link href="/comunidad/publicar">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Publicación
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <MyCommunityPostCard
                  key={post.id}
                  post={post}
                  onStatusChange={fetchPosts}
                />
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && posts.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Página {page}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
