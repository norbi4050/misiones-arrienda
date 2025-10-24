'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Archive, ArchiveRestore, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { CommunityPost } from '@/types/community'

interface MyCommunityPostCardProps {
  post: CommunityPost
  onStatusChange?: () => void
}

export function MyCommunityPostCard({ post, onStatusChange }: MyCommunityPostCardProps) {
  const [loading, setLoading] = useState(false)

  const handleArchiveToggle = async () => {
    setLoading(true)
    
    try {
      const newStatus = post.is_active ? 'ARCHIVED' : 'ACTIVE'
      
      const response = await fetch(`/api/comunidad/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success(
          newStatus === 'ARCHIVED' 
            ? 'Post archivado exitosamente' 
            : 'Post restaurado exitosamente'
        )
        onStatusChange?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al cambiar el estado')
      }
    } catch (error) {
      console.error('Error toggling archive:', error)
      toast.error('Error al cambiar el estado del post')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas borrar este anuncio? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/comunidad/posts/${post.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Anuncio borrado exitosamente')
        onStatusChange?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al borrar el anuncio')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Error al borrar el anuncio')
    } finally {
      setLoading(false)
    }
  }

  const statusBadgeVariant = post.is_active ? 'default' : 'secondary'
  const statusLabel = post.is_active ? 'Activo' : 'Archivado'
  const roleBadgeVariant = post.role === 'BUSCO' ? 'default' : 'secondary'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Mini-grid de fotos */}
          <div className="flex-shrink-0">
            {post.images && post.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 w-32 h-24">
                {post.images.slice(0, 3).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded bg-gray-100"
                  >
                    <img
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-32 h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                Sin fotos
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">{post.title}</h3>
              <div className="flex gap-2 flex-shrink-0">
                <Badge variant={roleBadgeVariant}>
                  {post.role}
                </Badge>
                <Badge variant={statusBadgeVariant}>
                  {statusLabel}
                </Badge>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p>
                <span className="font-medium">Tipo:</span> {post.room_type}
              </p>
              <p>
                <span className="font-medium">Ciudad:</span> {post.city}
              </p>
              <p className="text-xs text-gray-500">
                Creado: {new Date(post.created_at).toLocaleDateString('es-AR')}
                {post.views_count !== undefined && ` • ${post.views_count} vistas`}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 flex-wrap">
              <Link href={`/comunidad/editar/${post.id}`} prefetch={false}>
                <Button size="sm" variant="outline" disabled={loading}>
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </Link>

              <Button
                size="sm"
                variant="outline"
                onClick={handleArchiveToggle}
                disabled={loading}
              >
                {post.is_active ? (
                  <>
                    <Archive className="w-4 h-4 mr-1" />
                    Archivar
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="w-4 h-4 mr-1" />
                    Restaurar
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Borrar
              </Button>

              <Link href={`/comunidad/${post.id}`} prefetch={false}>
                <Button size="sm" variant="ghost">
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
