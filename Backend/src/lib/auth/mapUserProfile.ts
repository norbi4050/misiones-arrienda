/**
 * [AuthBridge] Profile Normalization
 * 
 * Convierte datos de DB (snake_case) a formato UI (camelCase)
 * Fuente única de verdad para el mapeo de roles y campos de usuario
 */

export type UserType = 'inmobiliaria' | 'inquilino' | 'busco' | null

export interface CurrentUser {
  id: string
  email: string | null
  userType: UserType
  
  // Campos comunes
  name?: string | null
  phone?: string | null
  avatar?: string | null
  bio?: string | null
  location?: string | null
  
  // Campos específicos de inmobiliaria
  companyName?: string | null
  licenseNumber?: string | null
  isCompany?: boolean
  verified?: boolean
  
  // Campos específicos de inquilino/busco
  occupation?: string | null
  age?: number | null
  searchType?: string | null
  budgetRange?: string | null
  preferredAreas?: string | null
  familySize?: string | null
  petFriendly?: string | null
  moveInDate?: string | null
  employmentStatus?: string | null
  monthlyIncome?: string | null
  
  // Metadata
  createdAt?: string | null
  updatedAt?: string | null
  emailVerified?: boolean
  rating?: number | null
  reviewCount?: number | null
}

/**
 * Mapea el campo 'role' o 'user_type' de la DB al tipo normalizado
 * 
 * Reglas:
 * - 'INMOBILIARIA' o 'AGENCY' (case-insensitive) → 'inmobiliaria'
 * - 'INQUILINO' (case-insensitive) → 'inquilino'
 * - 'BUSCO' (case-insensitive) → 'busco'
 * - 'DUENO_DIRECTO' (case-insensitive) → se mantiene como 'inquilino' (ahora unificado)
 * - null o vacío → null
 */
function mapRole(role: string | null | undefined): UserType {
  if (!role) return null
  
  const normalized = role.toUpperCase().trim()
  
  // DEBUG: Log para verificar el mapeo
  console.log('[mapRole DEBUG] Input:', role, '→ Normalized:', normalized)
  
  // Detectar inmobiliarias
  if (normalized === 'INMOBILIARIA' || normalized === 'AGENCY') {
    console.log('[mapRole DEBUG] Matched INMOBILIARIA/AGENCY → returning inmobiliaria')
    return 'inmobiliaria'
  }
  
  // Detectar inquilinos explícitamente
  if (normalized === 'INQUILINO') {
    console.log('[mapRole DEBUG] Matched INQUILINO → returning inquilino')
    return 'inquilino'
  }
  
  // BUSCO se mantiene como busco
  if (normalized === 'BUSCO') {
    console.log('[mapRole DEBUG] Matched BUSCO → returning busco')
    return 'busco'
  }
  
  // DUENO_DIRECTO ahora se trata como inquilino (unificado en UI)
  if (normalized === 'DUENO_DIRECTO') {
    console.log('[mapRole DEBUG] Matched DUENO_DIRECTO → returning inquilino')
    return 'inquilino'
  }
  
  // Default: inquilino (para valores desconocidos)
  console.log('[mapRole DEBUG] No match, using default → returning inquilino')
  return 'inquilino'
}

/**
 * Normaliza un perfil de usuario desde formato DB a formato UI
 * 
 * Acepta datos de múltiples fuentes:
 * - Tabla 'users' (snake_case)
 * - Tabla 'user_profiles' (snake_case)
 * - user_metadata de Supabase Auth (puede ser mixto)
 * 
 * @param db - Objeto con datos del usuario en formato DB
 * @returns Objeto normalizado en camelCase o null si no hay datos
 */
export function mapUserProfile(db: any): CurrentUser | null {
  if (!db) {
    console.log('[AuthBridge] mapUserProfile: No data provided')
    return null
  }
  
  // Extraer ID del usuario de auth (NO el ID del perfil)
  // IMPORTANTE: Priorizar userId/user_id (FK a auth.users) sobre id (PK del perfil)
  const id = db.userId ?? db.user_id ?? db.id
  if (!id) {
    console.warn('[AuthBridge] mapUserProfile: No user ID found in data')
    return null
  }
  
  // Mapear role/user_type
  const userType = mapRole(db.role ?? db.user_type)
  
  // Construir perfil normalizado
  const profile: CurrentUser = {
    id,
    email: db.email ?? null,
    userType,
    
    // Campos comunes (priorizar nombres más específicos)
    name: db.name ?? db.full_name ?? null,
    phone: db.phone ?? null,
    avatar: db.avatar ?? db.profile_image ?? null,
    bio: db.bio ?? null,
    location: db.location ?? null,
    
    // Campos de inmobiliaria
    companyName: db.company_name ?? null,
    licenseNumber: db.license_number ?? null,
    isCompany: db.is_company ?? false,
    verified: db.verified ?? db.is_verified ?? false,
    
    // Campos de inquilino/busco
    occupation: db.occupation ?? null,
    age: db.age ?? null,
    searchType: db.search_type ?? null,
    budgetRange: db.budget_range ?? null,
    preferredAreas: db.preferred_areas ?? null,
    familySize: db.family_size?.toString() ?? null,
    petFriendly: db.pet_friendly?.toString() ?? null,
    moveInDate: db.move_in_date ?? null,
    employmentStatus: db.employment_status ?? null,
    monthlyIncome: db.monthly_income?.toString() ?? null,
    
    // Metadata
    createdAt: db.created_at ?? null,
    updatedAt: db.updated_at ?? null,
    emailVerified: db.email_verified ?? false,
    rating: db.rating ?? null,
    reviewCount: db.review_count ?? null,
  }
  
  console.log('[AuthBridge] mapUserProfile: Normalized profile', {
    id: profile.id,
    email: profile.email,
    userType: profile.userType,
    isCompany: profile.isCompany,
  })
  
  return profile
}

/**
 * Helper: Verifica si un usuario es una inmobiliaria
 */
export function isAgency(user: CurrentUser | null): boolean {
  return user?.userType === 'inmobiliaria'
}

/**
 * Helper: Verifica si un usuario es inquilino/busco
 */
export function isTenant(user: CurrentUser | null): boolean {
  return user?.userType === 'inquilino' || user?.userType === 'busco'
}
