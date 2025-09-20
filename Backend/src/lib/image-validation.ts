/**
 * Configuración y utilidades para validación de imágenes
 * Objetivo: UX + Control de costos
 */

// Configuración de límites para propiedades
export const PROPERTY_IMAGE_LIMITS = {
  maxImages: 10,
  maxSizeMB: 2, // Reducido de 5MB a 2MB para control de costos
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as const
}

// Configuración de límites para avatares
export const AVATAR_IMAGE_LIMITS = {
  maxImages: 1,
  maxSizeMB: 1, // Más restrictivo para avatares
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as const
}

export type ImageValidationError = {
  type: 'size' | 'format' | 'quantity' | 'general'
  message: string
  fileName?: string
}

export class ImageValidator {
  private limits: typeof PROPERTY_IMAGE_LIMITS

  constructor(limits: typeof PROPERTY_IMAGE_LIMITS = PROPERTY_IMAGE_LIMITS) {
    this.limits = limits
  }

  /**
   * Valida un archivo individual
   */
  validateFile(file: File): ImageValidationError | null {
    // Validar tipo de archivo
    if (!this.limits.acceptedTypes.includes(file.type as any)) {
      return {
        type: 'format',
        message: `Formato no válido. Solo se permiten: ${this.limits.acceptedTypes.join(', ')}`,
        fileName: file.name
      }
    }

    // Validar tamaño
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > this.limits.maxSizeMB) {
      return {
        type: 'size',
        message: `Archivo muy grande (${sizeMB.toFixed(1)}MB). Máximo ${this.limits.maxSizeMB}MB permitido.`,
        fileName: file.name
      }
    }

    return null
  }

  /**
   * Valida múltiples archivos
   */
  validateFiles(files: File[], currentCount: number = 0): ImageValidationError[] {
    const errors: ImageValidationError[] = []

    // Validar cantidad total
    if (currentCount + files.length > this.limits.maxImages) {
      errors.push({
        type: 'quantity',
        message: `Máximo ${this.limits.maxImages} imágenes permitidas. Tienes ${currentCount} y intentas agregar ${files.length}.`
      })
      return errors // Si excede cantidad, no validar archivos individuales
    }

    // Validar cada archivo
    files.forEach(file => {
      const error = this.validateFile(file)
      if (error) {
        errors.push(error)
      }
    })

    return errors
  }

  /**
   * Obtiene información de ayuda para mostrar en la UI
   */
  getHelpText(): string {
    const formats = this.limits.acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')
    return `Máximo ${this.limits.maxImages} imágenes • ${this.limits.maxSizeMB}MB cada una • Formatos: ${formats}`
  }

  /**
   * Obtiene el atributo accept para input file
   */
  getAcceptAttribute(): string {
    return this.limits.acceptedTypes.join(',')
  }
}

// Instancias pre-configuradas
export const propertyImageValidator = new ImageValidator(PROPERTY_IMAGE_LIMITS)
export const avatarImageValidator = new ImageValidator(AVATAR_IMAGE_LIMITS)

/**
 * Utilidad para formatear tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Utilidad para obtener información de un archivo
 */
export function getFileInfo(file: File) {
  return {
    name: file.name,
    size: formatFileSize(file.size),
    sizeMB: (file.size / (1024 * 1024)).toFixed(1),
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleDateString()
  }
}
