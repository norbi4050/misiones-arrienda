'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import type { Attachment } from '@/types/messages'
import { analytics } from '@/lib/analytics/track'

interface AttachmentLightboxProps {
  attachment: Attachment
  isOpen: boolean
  onClose: () => void
}

/**
 * Lightbox para visualización de adjuntos en mensajes
 * 
 * Features:
 * - Imágenes: Zoom in/out (50%-200%), visualización fullscreen
 * - PDFs: Botón para abrir en nueva pestaña
 * - Controles: Download, Close, Zoom
 * - Keyboard support: ESC para cerrar
 * - Click fuera del contenido para cerrar
 * 
 * @component
 */
export default function AttachmentLightbox({
  attachment,
  isOpen,
  onClose
}: AttachmentLightboxProps) {
  const [zoom, setZoom] = useState(100)
  const [imageError, setImageError] = useState(false)

  const isImage = attachment.mimeType.startsWith('image/')
  const isPdf = attachment.mimeType === 'application/pdf'

  // Reset zoom cuando cambia el adjunto y track preview
  useEffect(() => {
    if (isOpen) {
      setZoom(100)
      setImageError(false)
      
      // Track attachment preview
      analytics.attachmentPreview({
        attachmentId: attachment.id,
        mime: attachment.mimeType,
        source: 'lightbox'
      }).catch(err => console.error('[LIGHTBOX] Analytics error:', err))
    }
  }, [isOpen, attachment.id, attachment.mimeType])

  // Keyboard support: ESC para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevenir scroll del body cuando el lightbox está abierto
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handlers
  const handleZoomIn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(prev => Math.min(prev + 25, 200))
  }, [])

  const handleZoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(prev => Math.max(prev - 25, 50))
  }, [])

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Track download
    analytics.attachmentDownload({
      attachmentId: attachment.id,
      mime: attachment.mimeType,
      sizeBytes: attachment.fileSize
    }).catch(err => console.error('[LIGHTBOX] Analytics error:', err))
    
    // Abrir en nueva pestaña con seguridad
    window.open(attachment.storageUrl, '_blank', 'noopener,noreferrer')
  }, [attachment.storageUrl, attachment.id, attachment.mimeType, attachment.fileSize])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Solo cerrar si se hace click en el backdrop, no en el contenido
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
    >
      {/* Header con controles */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {isImage && !imageError && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              title="Alejar (Zoom Out)"
              aria-label="Alejar imagen"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/50 text-white hover:bg-black/70 hover:text-white"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              title="Acercar (Zoom In)"
              aria-label="Acercar imagen"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={handleDownload}
          title="Descargar archivo"
          aria-label="Descargar archivo"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={onClose}
          title="Cerrar (ESC)"
          aria-label="Cerrar lightbox"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Contenido principal */}
      <div 
        className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage && !imageError ? (
          // Visualización de imagen con zoom
          <div className="relative w-full h-full flex items-center justify-center">
            <div 
              className="relative transition-transform duration-200 ease-out"
              style={{ 
                transform: `scale(${zoom / 100})`,
                maxWidth: '100%',
                maxHeight: '90vh'
              }}
            >
              <Image
                src={attachment.storageUrl}
                alt={attachment.fileName}
                width={attachment.width || 1200}
                height={attachment.height || 800}
                className="max-w-full max-h-[90vh] object-contain"
                onError={() => setImageError(true)}
                priority
                quality={90}
              />
            </div>
          </div>
        ) : isPdf ? (
          // Visualización de PDF (botón para abrir)
          <div className="bg-white p-8 rounded-lg text-center max-w-md">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 mx-auto text-red-600" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Documento PDF
            </h3>
            <p className="text-sm text-gray-600 mb-4 break-all">
              {attachment.fileName}
            </p>
            <Button 
              onClick={handleDownload}
              className="w-full"
            >
              Abrir PDF en nueva pestaña
            </Button>
          </div>
        ) : (
          // Error o tipo no soportado
          <div className="bg-white p-8 rounded-lg text-center max-w-md">
            <div className="mb-4">
              <X className="w-16 h-16 mx-auto text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              No se pudo cargar el archivo
            </h3>
            <p className="text-sm text-gray-600 mb-4 break-all">
              {attachment.fileName}
            </p>
            <Button 
              onClick={handleDownload}
              variant="outline"
              className="w-full"
            >
              Intentar descargar
            </Button>
          </div>
        )}
      </div>

      {/* Footer con información */}
      <div className="absolute bottom-4 left-0 right-0 text-center px-4">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg py-2 px-4 inline-block max-w-2xl">
          <p 
            id="lightbox-title"
            className="text-white text-sm font-medium truncate"
          >
            {attachment.fileName}
          </p>
          {isImage && !imageError && (
            <p className="text-white/70 text-xs mt-1">
              Zoom: {zoom}% • {attachment.width && attachment.height 
                ? `${attachment.width}×${attachment.height}px` 
                : 'Dimensiones desconocidas'}
            </p>
          )}
          {isPdf && (
            <p className="text-white/70 text-xs mt-1">
              Documento PDF • {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
