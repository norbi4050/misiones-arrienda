import { createHash } from 'crypto'

// Tipos de archivos permitidos
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
] as const

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
] as const

// Configuración de límites
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  avatar: 2 * 1024 * 1024 // 2MB
} as const

// Firmas de archivos (magic numbers) para validación adicional
const FILE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF],
    [0xFF, 0xD8, 0xFF, 0xE0],
    [0xFF, 0xD8, 0xFF, 0xE1],
    [0xFF, 0xD8, 0xFF, 0xE2],
    [0xFF, 0xD8, 0xFF, 0xE3],
    [0xFF, 0xD8, 0xFF, 0xE8]
  ],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]]
} as const

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata?: {
    size: number
    type: string
    hash: string
    dimensions?: { width: number; height: number }
  }
}

export class FileValidator {
  private static instance: FileValidator
  private maliciousPatterns: RegExp[]
  private blockedHashes: Set<string>

  private constructor() {
    this.maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ]

    this.blockedHashes = new Set([
      // Aquí se pueden agregar hashes de archivos maliciosos conocidos
    ])
  }

  static getInstance(): FileValidator {
    if (!FileValidator.instance) {
      FileValidator.instance = new FileValidator()
    }
    return FileValidator.instance
  }

  async validateImageFile(
    file: File | Buffer,
    options: {
      maxSize?: number
      allowedTypes?: readonly string[]
      requireDimensions?: boolean
      minWidth?: number
      minHeight?: number
      maxWidth?: number
      maxHeight?: number
    } = {}
  ): Promise<ValidationResult> {
    const {
      maxSize = FILE_SIZE_LIMITS.image,
      allowedTypes = ALLOWED_IMAGE_TYPES,
      requireDimensions = false,
      minWidth = 100,
      minHeight = 100,
      maxWidth = 4000,
      maxHeight = 4000
    } = options

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      let buffer: Buffer
      let size: number
      let type: string

      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer())
        size = file.size
        type = file.type
      } else {
        buffer = file
        size = buffer.length
        type = this.detectMimeType(buffer)
      }

      // Validar tamaño
      if (size > maxSize) {
        result.errors.push(`El archivo es demasiado grande. Máximo permitido: ${this.formatFileSize(maxSize)}`)
        result.isValid = false
      }

      if (size === 0) {
        result.errors.push('El archivo está vacío')
        result.isValid = false
      }

      // Validar tipo MIME
      if (!allowedTypes.includes(type as any)) {
        result.errors.push(`Tipo de archivo no permitido: ${type}. Tipos permitidos: ${allowedTypes.join(', ')}`)
        result.isValid = false
      }

      // Validar firma del archivo (magic numbers)
      if (!this.validateFileSignature(buffer, type)) {
        result.errors.push('El archivo no coincide con su tipo declarado')
        result.isValid = false
      }

      // Generar hash para detección de duplicados y malware
      const hash = this.generateFileHash(buffer)
      if (this.blockedHashes.has(hash)) {
        result.errors.push('Archivo bloqueado por seguridad')
        result.isValid = false
      }

      // Validar contenido malicioso
      const maliciousCheck = this.checkMaliciousContent(buffer)
      if (!maliciousCheck.isClean) {
        result.errors.push('Contenido potencialmente malicioso detectado')
        result.isValid = false
      }

      // Validar dimensiones si es requerido
      let dimensions: { width: number; height: number } | undefined
      if (requireDimensions && this.isImageType(type)) {
        try {
          dimensions = await this.getImageDimensions(buffer)

          if (dimensions.width < minWidth || dimensions.height < minHeight) {
            result.errors.push(`Imagen demasiado pequeña. Mínimo: ${minWidth}x${minHeight}px`)
            result.isValid = false
          }

          if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
            result.errors.push(`Imagen demasiado grande. Máximo: ${maxWidth}x${maxHeight}px`)
            result.isValid = false
          }
        } catch (error) {
          result.warnings.push('No se pudieron obtener las dimensiones de la imagen')
        }
      }

      // Metadata
      result.metadata = {
        size,
        type,
        hash,
        dimensions
      }

      // Warnings adicionales
      if (size > maxSize * 0.8) {
        result.warnings.push('El archivo es bastante grande, considera optimizarlo')
      }

    } catch (error) {
      result.errors.push(`Error al validar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      result.isValid = false
    }

    return result
  }

  async validateDocumentFile(file: File | Buffer, maxSize = FILE_SIZE_LIMITS.document): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      let buffer: Buffer
      let size: number
      let type: string

      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer())
        size = file.size
        type = file.type
      } else {
        buffer = file
        size = buffer.length
        type = this.detectMimeType(buffer)
      }

      // Validaciones básicas
      if (size > maxSize) {
        result.errors.push(`Documento demasiado grande. Máximo: ${this.formatFileSize(maxSize)}`)
        result.isValid = false
      }

      if (!ALLOWED_DOCUMENT_TYPES.includes(type as any)) {
        result.errors.push(`Tipo de documento no permitido: ${type}`)
        result.isValid = false
      }

      // Validar firma del archivo
      if (!this.validateFileSignature(buffer, type)) {
        result.errors.push('El documento no coincide con su tipo declarado')
        result.isValid = false
      }

      // Validar contenido malicioso
      const maliciousCheck = this.checkMaliciousContent(buffer)
      if (!maliciousCheck.isClean) {
        result.errors.push('Contenido potencialmente malicioso detectado en el documento')
        result.isValid = false
      }

      const hash = this.generateFileHash(buffer)
      result.metadata = { size, type, hash }

    } catch (error) {
      result.errors.push(`Error al validar documento: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      result.isValid = false
    }

    return result
  }

  private detectMimeType(buffer: Buffer): string {
    // Detectar tipo MIME basado en los primeros bytes
    const header = Array.from(buffer.slice(0, 12))

    for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
      for (const signature of signatures) {
        if (this.matchesSignature(header, [...signature])) {
          return mimeType
        }
      }
    }

    return 'application/octet-stream'
  }

  private validateFileSignature(buffer: Buffer, declaredType: string): boolean {
    const detectedType = this.detectMimeType(buffer)

    // Para JPEG, aceptar tanto image/jpeg como image/jpg
    if ((declaredType === 'image/jpeg' || declaredType === 'image/jpg') &&
        (detectedType === 'image/jpeg' || detectedType === 'image/jpg')) {
      return true
    }

    return detectedType === declaredType
  }

  private matchesSignature(header: number[], signature: number[]): boolean {
    if (header.length < signature.length) return false

    for (let i = 0; i < signature.length; i++) {
      if (header[i] !== signature[i]) return false
    }

    return true
  }

  private checkMaliciousContent(buffer: Buffer): { isClean: boolean; threats: string[] } {
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 10)) // Primeros 10KB
    const threats: string[] = []

    for (const pattern of this.maliciousPatterns) {
      if (pattern.test(content)) {
        threats.push(`Patrón malicioso detectado: ${pattern.source}`)
      }
    }

    return {
      isClean: threats.length === 0,
      threats
    }
  }

  private generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex')
  }

  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    // Implementación básica para PNG y JPEG
    const type = this.detectMimeType(buffer)

    if (type === 'image/png') {
      return this.getPngDimensions(buffer)
    } else if (type === 'image/jpeg') {
      return this.getJpegDimensions(buffer)
    }

    throw new Error('Tipo de imagen no soportado para obtener dimensiones')
  }

  private getPngDimensions(buffer: Buffer): { width: number; height: number } {
    // PNG: width y height están en bytes 16-19 y 20-23
    if (buffer.length < 24) throw new Error('Archivo PNG inválido')

    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)

    return { width, height }
  }

  private getJpegDimensions(buffer: Buffer): { width: number; height: number } {
    // Implementación simplificada para JPEG
    let offset = 2

    while (offset < buffer.length) {
      const marker = buffer.readUInt16BE(offset)

      if (marker >= 0xFFC0 && marker <= 0xFFC3) {
        const height = buffer.readUInt16BE(offset + 5)
        const width = buffer.readUInt16BE(offset + 7)
        return { width, height }
      }

      const length = buffer.readUInt16BE(offset + 2)
      offset += length + 2
    }

    throw new Error('No se pudieron obtener las dimensiones del JPEG')
  }

  private isImageType(type: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(type as any)
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // Método para agregar hashes bloqueados
  addBlockedHash(hash: string): void {
    this.blockedHashes.add(hash)
  }

  // Método para verificar si un hash está bloqueado
  isHashBlocked(hash: string): boolean {
    return this.blockedHashes.has(hash)
  }
}

// Instancia singleton
export const fileValidator = FileValidator.getInstance()

// Funciones de conveniencia
export async function validateImage(file: File | Buffer, options?: Parameters<FileValidator['validateImageFile']>[1]) {
  return fileValidator.validateImageFile(file, options)
}

export async function validateDocument(file: File | Buffer, maxSize?: number) {
  return fileValidator.validateDocumentFile(file, maxSize)
}

export function isAllowedImageType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(type as any)
}

export function isAllowedDocumentType(type: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(type as any)
}
