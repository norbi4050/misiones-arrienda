/**
 * File Utilities
 * Funciones helper para manejo seguro de archivos
 */

/**
 * Sanitiza un nombre de archivo para uso seguro en URLs y storage
 * 
 * Transformaciones aplicadas:
 * - Convierte a minúsculas
 * - Reemplaza espacios por guiones
 * - Elimina caracteres especiales (solo permite a-z, 0-9, puntos y guiones)
 * - Elimina guiones múltiples consecutivos
 * - Elimina guiones al inicio y final
 * 
 * @param fileName - Nombre del archivo original
 * @returns Nombre sanitizado
 * 
 * @example
 * sanitizeFileName("Captura de pantalla 2025-09-12 140237.png")
 * // Returns: "captura-de-pantalla-2025-09-12-140237.png"
 * 
 * @example
 * sanitizeFileName("Mi Foto!!!.JPG")
 * // Returns: "mi-foto.jpg"
 */
export function sanitizeFileName(fileName: string): string {
  // Separar nombre y extensión
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

  // Sanitizar el nombre
  const sanitizedName = name
    .toLowerCase()
    .normalize('NFD')                    // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '')     // Eliminar diacríticos (á → a)
    .replace(/\s+/g, '-')                // Espacios → guiones
    .replace(/[^a-z0-9.-]/g, '')         // Solo alfanuméricos, puntos y guiones
    .replace(/-+/g, '-')                 // Múltiples guiones → uno solo
    .replace(/^-|-$/g, '');              // Quitar guiones al inicio/fin

  // Sanitizar la extensión
  const sanitizedExtension = extension
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '');

  return sanitizedName + sanitizedExtension;
}

/**
 * Genera un nombre único para un archivo usando timestamp
 * 
 * @param originalFileName - Nombre original del archivo
 * @param prefix - Prefijo opcional (ej: userId)
 * @returns Nombre único sanitizado
 * 
 * @example
 * generateUniqueFileName("foto.jpg", "user123")
 * // Returns: "user123-1697299200000-foto.jpg"
 */
export function generateUniqueFileName(
  originalFileName: string,
  prefix?: string
): string {
  const sanitized = sanitizeFileName(originalFileName);
  const timestamp = Date.now();
  
  if (prefix) {
    return `${prefix}-${timestamp}-${sanitized}`;
  }
  
  return `${timestamp}-${sanitized}`;
}

/**
 * Valida el tipo MIME de un archivo
 * 
 * @param file - Archivo a validar
 * @param allowedTypes - Array de tipos MIME permitidos
 * @returns true si el tipo es válido
 * 
 * @example
 * validateFileType(file, ['image/jpeg', 'image/png'])
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[] | string[]
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Valida el tamaño de un archivo
 * 
 * @param file - Archivo a validar
 * @param maxSizeInBytes - Tamaño máximo en bytes
 * @returns true si el tamaño es válido
 * 
 * @example
 * validateFileSize(file, 10 * 1024 * 1024) // 10MB
 */
export function validateFileSize(
  file: File,
  maxSizeInBytes: number
): boolean {
  return file.size <= maxSizeInBytes;
}

/**
 * Formatea el tamaño de un archivo para display
 * 
 * @param bytes - Tamaño en bytes
 * @returns String formateado (ej: "2.5 MB")
 * 
 * @example
 * formatFileSize(2621440)
 * // Returns: "2.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extrae la extensión de un archivo
 * 
 * @param fileName - Nombre del archivo
 * @returns Extensión sin el punto (ej: "jpg")
 * 
 * @example
 * getFileExtension("foto.jpg")
 * // Returns: "jpg"
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return fileName.substring(lastDotIndex + 1).toLowerCase();
}

/**
 * Verifica si un archivo es una imagen
 * 
 * @param file - Archivo a verificar
 * @returns true si es una imagen
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Constantes de validación comunes
 */
export const FILE_VALIDATION = {
  // Tipos de imagen permitidos
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ],
  
  // Tamaños máximos
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,      // 10MB
  MAX_AVATAR_SIZE: 5 * 1024 * 1024,      // 5MB
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024,   // 20MB
  
  // Extensiones permitidas
  ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
  
  // Mensajes de error
  ERRORS: {
    INVALID_TYPE: 'Tipo de archivo no permitido',
    FILE_TOO_LARGE: 'El archivo es demasiado grande',
    NO_FILE: 'No se proporcionó ningún archivo',
    INVALID_NAME: 'Nombre de archivo inválido'
  }
} as const;

/**
 * Valida un archivo de imagen completo
 * 
 * @param file - Archivo a validar
 * @param maxSize - Tamaño máximo opcional (default: 10MB)
 * @returns Objeto con resultado de validación
 * 
 * @example
 * const result = validateImageFile(file);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export function validateImageFile(
  file: File | null,
  maxSize: number = FILE_VALIDATION.MAX_IMAGE_SIZE
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: FILE_VALIDATION.ERRORS.NO_FILE };
  }

  if (!validateFileType(file, FILE_VALIDATION.ALLOWED_IMAGE_TYPES)) {
    return { valid: false, error: FILE_VALIDATION.ERRORS.INVALID_TYPE };
  }

  if (!validateFileSize(file, maxSize)) {
    return {
      valid: false,
      error: `${FILE_VALIDATION.ERRORS.FILE_TOO_LARGE} (máx: ${formatFileSize(maxSize)})`
    };
  }

  return { valid: true };
}
