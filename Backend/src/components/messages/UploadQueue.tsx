'use client'

import { useState } from 'react'
import { X, FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/attachment-guards'

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error'

export interface QueuedFile {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
  attachmentId?: string
}

interface UploadQueueProps {
  files: QueuedFile[]
  onRemove: (id: string) => void
  onCancel: (id: string) => void
  className?: string
}

export default function UploadQueue({
  files,
  onRemove,
  onCancel,
  className = ''
}: UploadQueueProps) {
  if (files.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((queuedFile) => (
        <UploadQueueItem
          key={queuedFile.id}
          queuedFile={queuedFile}
          onRemove={onRemove}
          onCancel={onCancel}
        />
      ))}
    </div>
  )
}

interface UploadQueueItemProps {
  queuedFile: QueuedFile
  onRemove: (id: string) => void
  onCancel: (id: string) => void
}

function UploadQueueItem({ queuedFile, onRemove, onCancel }: UploadQueueItemProps) {
  const { id, file, status, progress, error } = queuedFile

  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf'

  const getStatusIcon = () => {
    switch (status) {
      case 'queued':
        return <FileText className="h-4 w-4 text-gray-400" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'queued':
        return 'bg-gray-100 border-gray-200'
      case 'uploading':
        return 'bg-blue-50 border-blue-200'
      case 'done':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
    }
  }

  const canCancel = status === 'queued' || status === 'uploading'
  const canRemove = status === 'done' || status === 'error'

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg border
      ${getStatusColor()}
      transition-all duration-200
    `}>
      {/* Icon */}
      <div className="shrink-0">
        {isImage ? (
          <ImageIcon className="h-5 w-5 text-gray-600" />
        ) : isPdf ? (
          <FileText className="h-5 w-5 text-red-600" />
        ) : (
          <FileText className="h-5 w-5 text-gray-600" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {file.name}
          </span>
          {getStatusIcon()}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </span>
          
          {status === 'uploading' && (
            <span className="text-xs text-blue-600 font-medium">
              {progress}%
            </span>
          )}
          
          {status === 'done' && (
            <span className="text-xs text-green-600 font-medium">
              Completado
            </span>
          )}
          
          {status === 'error' && error && (
            <span className="text-xs text-red-600 font-medium">
              {error}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {status === 'uploading' && (
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onCancel(id)}
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onRemove(id)}
            title="Quitar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Hook para manejar la cola de uploads
export function useUploadQueue() {
  const [queue, setQueue] = useState<QueuedFile[]>([])

  const addFiles = (files: File[]) => {
    const newFiles: QueuedFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'queued' as UploadStatus,
      progress: 0
    }))

    setQueue(prev => [...prev, ...newFiles])
    return newFiles
  }

  const updateFile = (id: string, updates: Partial<QueuedFile>) => {
    setQueue(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ))
  }

  const removeFile = (id: string) => {
    setQueue(prev => prev.filter(f => f.id !== id))
  }

  const clearCompleted = () => {
    setQueue(prev => prev.filter(f => f.status !== 'done'))
  }

  const clearAll = () => {
    setQueue([])
  }

  const hasUploading = queue.some(f => f.status === 'uploading')
  const hasQueued = queue.some(f => f.status === 'queued')
  const hasErrors = queue.some(f => f.status === 'error')
  const allDone = queue.length > 0 && queue.every(f => f.status === 'done')

  return {
    queue,
    addFiles,
    updateFile,
    removeFile,
    clearCompleted,
    clearAll,
    hasUploading,
    hasQueued,
    hasErrors,
    allDone
  }
}
