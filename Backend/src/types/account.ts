// src/types/account.ts
// Tipos para gestión de cuentas (suspender/eliminar)

export type AccountStatus = 'active' | 'suspended' | 'deleted'

export interface AccountStatusResponse {
  user_id: string
  status: AccountStatus
  display_name: string | null
  user_type: string
  created_at: string
  updated_at: string
  is_suspended: boolean
  is_deleted: boolean
  is_active: boolean
}

export interface SuspendAccountRequest {
  enable: boolean // true = suspender, false = reactivar
}

export interface SuspendAccountResponse {
  user_id: string
  status: AccountStatus
  updated_at: string
}

export interface DeleteAccountResponse {
  user_id: string
  status: 'deleted'
  deleted_at: string
}

export interface AuditLogEntry {
  id: string
  user_id: string
  action: 'account_suspended' | 'account_reactivated' | 'account_deleted'
  details: Record<string, any>
  created_at: string
}
