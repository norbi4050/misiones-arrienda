// Utilidades para manejo de usuarios y badges temporales

/**
 * Determina si un usuario debe mostrar el badge "Usuario Nuevo"
 * Condiciones:
 * - Menos de 1 semana desde el registro
 * - O está entre los últimos 3 usuarios registrados (futuro)
 */
export function isNewUser(userCreatedAt: string | Date): boolean {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const userDate = new Date(userCreatedAt)
  
  // Condición A: Menos de 1 semana desde registro
  const isRecentlyRegistered = userDate > oneWeekAgo
  
  // TODO: Condición B: Entre los últimos 3 usuarios registrados
  // const isAmongLatest3 = checkIfAmongLatest3Users(userId)
  
  return isRecentlyRegistered
}

/**
 * Retorna el nombre de usuario con badge "Nuevo" si aplica
 */
export function getUserDisplayName(user: { name: string; createdAt: string | Date }): string {
  if (isNewUser(user.createdAt)) {
    return `${user.name} • Nuevo`
  }
  return user.name
}

/**
 * Calcula la edad aproximada basada en la fecha de registro
 * (Función temporal hasta que tengamos edad real en el perfil)
 */
export function calculateApproximateAge(createdAt: string | Date): number {
  // Por ahora retornamos una edad por defecto
  // En el futuro esto se puede mejorar con datos reales del perfil
  return 25
}

/**
 * Extrae el nombre del usuario desde diferentes fuentes
 */
export function extractUserName(user: any): string {
  // Prioridad: name > user_metadata.name > email prefix
  return user.name || 
         user.user_metadata?.name || 
         user.email?.split('@')[0] || 
         'Usuario'
}

/**
 * Prepara datos del usuario para auto-llenar formularios
 */
export function prepareUserDataForForm(userProfile: any) {
  return {
    name: extractUserName(userProfile),
    age: calculateApproximateAge(userProfile.created_at),
    avatar: userProfile.avatar,
    email: userProfile.email,
    phone: userProfile.phone,
    bio: userProfile.bio
  }
}
