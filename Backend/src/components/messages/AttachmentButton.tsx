'use client'

import { useRef, useState } from 'react'
import { Paperclip, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLAN_ATTACHMENT_LIMITS } from '@/types/plan-limits'
import type { PlanTier } from '@/types/plan-limits'

interface AttachmentButtonProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  planTier?: PlanTier
  className?: string
}

export default function AttachmentButton({
  onFilesSelected,
  disabled = false,
  planTier = 'free',
  className = ''
}: AttachmentButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const limits = PLAN_ATTACHMENT_LIMITS[planTier]

  const handleButtonClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError(null)

    if (files.length === 0) return

    // Validar cada archivo
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      // Validar tamaño
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > limits.maxSizeMB) {
        errors.push(`${file.name}: Excede el límite de ${limits.maxSizeMB}MB`)
        continue
      }

      // Validar MIME type
      const allowedMimes = limits.allowedMimes as readonly string[]
      if (!allowedMimes.includes(file.type)) {
        errors.push(`${file.name}: Tipo de archivo no permitido`)
        continue
      }

      validFiles.push(file)
    }

    // Mostrar errores si los hay
    if (errors.length > 0) {
      setError(errors.join(', '))
      setTimeout(() => setError(null), 5000)
    }

    // Pasar archivos válidos al padre
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const acceptedTypes = limits.allowedMimes.join(',')

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`shrink-0 h-10 w-10 p-0 ${className}`}
        onClick={handleButtonClick}
        disabled={disabled}
        title={`Adjuntar archivo (máx ${limits.maxSizeMB}MB)`}
        aria-label="Adjuntar archivo"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Tooltip con límites del plan */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
          <div className="font-semibold mb-1">Plan {planTier.toUpperCase()}</div>
          <div>Tamaño máx: {limits.maxSizeMB}MB</div>
          <div>Adjuntos/día: {limits.dailyCount}</div>
          <div className="text-gray-300 mt-1">
            Tipos: JPG, PNG, PDF
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 mt-2 z-20">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2 max-w-xs shadow-lg">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook para obtener el plan del usuario
export function useUserPlan() {
  const [planTier, setPlanTier] = useState<PlanTier>('free')
  const [loading, setLoading] = useState(true)

  // TODO: Implementar fetch del plan del usuario desde /api/users/plan
  // Por ahora retorna 'free' por defecto

  return { planTier, loading }
}
