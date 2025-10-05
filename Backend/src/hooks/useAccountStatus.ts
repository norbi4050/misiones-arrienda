// src/hooks/useAccountStatus.ts
'use client'

import { useEffect, useState } from 'react'
import { AccountStatus, AccountStatusResponse } from '@/types/account'
import { 
  isAccountSuspended, 
  isAccountDeleted, 
  canPerformActions,
  getAccountStatusMessage 
} from '@/lib/account-guards'

export function useAccountStatus() {
  const [status, setStatus] = useState<AccountStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch('/api/users/status')
      
      if (!res.ok) {
        throw new Error('Error al obtener estado de cuenta')
      }
      
      const { data } = await res.json() as { data: AccountStatusResponse }
      setStatus(data.status)
      
    } catch (err: any) {
      console.error('[useAccountStatus] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return {
    status,
    loading,
    error,
    isSuspended: isAccountSuspended(status),
    isDeleted: isAccountDeleted(status),
    canPerformActions: canPerformActions(status),
    statusMessage: getAccountStatusMessage(status),
    refetch: fetchStatus
  }
}
