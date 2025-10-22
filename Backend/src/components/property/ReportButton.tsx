'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Flag } from 'lucide-react'
import { ReportModal } from './ReportModal'

interface ReportButtonProps {
  propertyId: string
  propertyTitle: string
  className?: string
}

export function ReportButton({ propertyId, propertyTitle, className }: ReportButtonProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsReportModalOpen(true)}
        className={className}
        title="Reportar propiedad"
      >
        <Flag className="h-4 w-4 mr-2" />
        Reportar
      </Button>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
      />
    </>
  )
}
