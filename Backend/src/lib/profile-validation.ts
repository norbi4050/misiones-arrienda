// Validaciones para perfil de usuario completo

export interface UserProfile {
  name?: string
  email?: string
  phone?: string
  avatar?: string
  [key: string]: any
}

export interface ProfileValidationResult {
  isComplete: boolean
  missingFields: string[]
  message: string
}

export function validateUserProfileComplete(profile: UserProfile | null): ProfileValidationResult {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ['perfil'],
      message: 'Debes completar tu perfil principal antes de crear un anuncio'
    }
  }

  const requiredFields = [
    { key: 'name', label: 'nombre completo' },
    { key: 'email', label: 'email' },
    { key: 'phone', label: 'número de teléfono' }
  ]

  const missingFields: string[] = []
  
  requiredFields.forEach(field => {
    if (!profile[field.key] || profile[field.key].trim() === '') {
      missingFields.push(field.label)
    }
  })

  const isComplete = missingFields.length === 0

  return {
    isComplete,
    missingFields,
    message: isComplete 
      ? 'Perfil completo' 
      : `Completa tu perfil principal: ${missingFields.join(', ')}`
  }
}

export function getProfileCompletionRedirectUrl(): string {
  return '/profile/inquilino'
}
