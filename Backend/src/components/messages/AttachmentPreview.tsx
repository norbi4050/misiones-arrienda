'use client'

import { useState } from 'react'
import { FileText, Download, X, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Attachment } from '@/types/messages'
import { formatFileSize } from '@/lib/attachment-guards'
import Image from 'next/image'
import AttachmentLightbox from './AttachmentLightbox'

interface AttachmentPreviewProps {
  attachment: Attachment
  onDelete?: (id: string) => void
  canDelete?: boolean
  onClick?: () => void
  className?: string
}

export default function AttachmentPreview({
  attachment,
  onDelete,
  canDelete = false,
  onClick,
  className = ''
}: AttachmentPreviewProps) {
  const [imageError, setImageError] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  
  const isImage = attachment.mime.startsWith('image/')
  const isPdf = attachment.mime === 'application/pdf'

  // Handler para abrir lightbox
  const handlePreviewClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Si no hay onClick custom, abrir lightbox por defecto
      setLightboxOpen(true)
    }
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(attachment.url, '_blank', 'noopener,noreferrer')
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(attachment.id)
    }
  }

  // Preview de imagen
  if (isImage && !imageError) {
    return (
      <>
        <div className={`
          relative group rounded-lg overflow-hidden border border-gray-200
          hover:border-gray-300 transition-colors cursor-pointer
          ${className}
        `}
          onClick={handlePreviewClick}
        >
        <div className="relative w-full h-32 bg-gray-100">
          <Image
            src={attachment.url}
            alt={attachment.fileName}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Overlay con acciones */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDownload}
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            title="Ver en grande"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          {canDelete && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
              title="Eliminar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white truncate">{attachment.fileName}</p>
            <p className="text-xs text-gray-300">{formatFileSize(attachment.sizeBytes)}</p>
          </div>
        </div>

        {/* Lightbox */}
        <AttachmentLightbox
          attachment={attachment}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </>
    )
  }

  // Preview de PDF o imagen con error
  return (
    <>
      <div className={`
        flex items-center gap-3 p-3 rounded-lg border border-gray-200
        hover:border-gray-300 transition-colors
        ${isPdf ? 'cursor-pointer' : ''}
        ${className}
      `}
        onClick={isPdf ? handlePreviewClick : onClick}
      >
      {/* Icon */}
      <div className={`
        shrink-0 w-12 h-12 rounded flex items-center justify-center
        ${isPdf ? 'bg-red-100' : 'bg-gray-100'}
      `}>
        <FileText className={`h-6 w-6 ${isPdf ? 'text-red-600' : 'text-gray-600'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.fileName}</p>
        <p className="text-xs text-gray-500">{formatFileSize(attachment.sizeBytes)}</p>
        {isPdf && (
          <p className="text-xs text-gray-400 mt-1">PDF Document</p>
        )}
      </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleDownload}
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              title="Eliminar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Lightbox para PDFs */}
      {isPdf && (
        <AttachmentLightbox
          attachment={attachment}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}

// Componente para mostrar múltiples adjuntos
interface AttachmentListProps {
  attachments: Attachment[]
  onDelete?: (id: string) => void
  canDelete?: boolean
  onPreview?: (attachment: Attachment) => void
  className?: string
}

export function AttachmentList({
  attachments,
  onDelete,
  canDelete = false,
  onPreview,
  className = ''
}: AttachmentListProps) {
  if (attachments.length === 0) return null

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 ${className}`}>
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.id}
          attachment={attachment}
          onDelete={onDelete}
          canDelete={canDelete}
          onClick={() => onPreview?.(attachment)}
        />
      ))}
    </div>
  )
}
