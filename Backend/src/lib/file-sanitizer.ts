/**
 * File Sanitization System
 * 
 * Provides utilities to sanitize file names and validate file paths
 * to prevent security vulnerabilities like path traversal attacks.
 * 
 * @module file-sanitizer
 */

/**
 * Sanitize a file name to prevent security issues
 * 
 * - Removes dangerous characters
 * - Blocks path traversal attempts (../, ..\)
 * - Normalizes consecutive dots
 * - Limits length to 255 characters
 * - Preserves file extension
 * 
 * @param fileName - Original file name
 * @returns Sanitized file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed-file'
  }

  // Remove any path components (keep only the file name)
  let sanitized = fileName.split(/[/\\]/).pop() || 'unnamed-file'

  // Block path traversal attempts
  if (sanitized.includes('..')) {
    console.warn('[FILE_SANITIZER] Path traversal attempt detected', { fileName })
    sanitized = sanitized.replace(/\.{2,}/g, '.')
  }

  // Remove dangerous characters but keep: letters, numbers, dots, hyphens, underscores
  // This prevents command injection and other attacks
  sanitized = sanitized.replace(/[^a-zA-Z0-9.\-_]/g, '_')

  // Normalize consecutive dots (prevent ../ attempts)
  sanitized = sanitized.replace(/\.{2,}/g, '.')

  // Remove leading/trailing dots and underscores
  sanitized = sanitized.replace(/^[._]+|[._]+$/g, '')

  // Ensure we have a valid name
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'unnamed-file'
  }

  // Limit length (filesystem limits, typically 255)
  if (sanitized.length > 255) {
    // Preserve extension if possible
    const parts = sanitized.split('.')
    const ext = parts.length > 1 ? parts.pop() : ''
    const name = parts.join('.')
    
    const maxNameLength = ext ? 255 - ext.length - 1 : 255
    sanitized = name.substring(0, maxNameLength) + (ext ? `.${ext}` : '')
  }

  console.log('[FILE_SANITIZER] Sanitized', {
    original: fileName,
    sanitized,
    changed: fileName !== sanitized
  })

  return sanitized
}

/**
 * Validate that a file path doesn't contain path traversal attempts
 * 
 * @param path - File path to validate
 * @returns true if path is safe, false otherwise
 */
export function validateFilePath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false
  }

  // Check for path traversal patterns
  const dangerousPatterns = [
    '../',
    '..\\',
    './',
    '.\\',
    '//',
    '\\\\',
    '%2e%2e',  // URL encoded ..
    '%2f',     // URL encoded /
    '%5c'      // URL encoded \
  ]

  const lowerPath = path.toLowerCase()
  
  for (const pattern of dangerousPatterns) {
    if (lowerPath.includes(pattern)) {
      console.error('[FILE_SANITIZER] Dangerous pattern detected', {
        path,
        pattern
      })
      return false
    }
  }

  // Check for absolute paths (should be relative)
  if (path.startsWith('/') || path.startsWith('\\') || /^[a-zA-Z]:/.test(path)) {
    console.error('[FILE_SANITIZER] Absolute path detected', { path })
    return false
  }

  return true
}

/**
 * Generate a safe file path for storage
 * 
 * @param threadId - Thread ID
 * @param messageId - Message ID (optional)
 * @param fileName - Original file name
 * @returns Safe file path
 */
export function generateSafeFilePath(
  threadId: string,
  messageId: string | null,
  fileName: string
): string {
  const sanitizedFileName = sanitizeFileName(fileName)
  const timestamp = Date.now()
  
  // Add timestamp to prevent collisions
  const parts = sanitizedFileName.split('.')
  const ext = parts.length > 1 ? parts.pop() : ''
  const name = parts.join('.')
  
  const uniqueFileName = `${name}_${timestamp}${ext ? `.${ext}` : ''}`
  
  // Build path: threadId/messageId/fileName or threadId/temp/fileName
  const folder = messageId || 'temp'
  const path = `${threadId}/${folder}/${uniqueFileName}`
  
  // Final validation
  if (!validateFilePath(path)) {
    throw new Error('Generated path failed validation')
  }
  
  return path
}

/**
 * Extract file extension safely
 * 
 * @param fileName - File name
 * @returns File extension (lowercase, without dot) or empty string
 */
export function getFileExtension(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return ''
  }

  const parts = fileName.split('.')
  if (parts.length < 2) {
    return ''
  }

  const ext = parts.pop()?.toLowerCase() || ''
  
  // Validate extension (only alphanumeric, max 10 chars)
  if (!/^[a-z0-9]{1,10}$/.test(ext)) {
    console.warn('[FILE_SANITIZER] Invalid extension', { fileName, ext })
    return ''
  }

  return ext
}

/**
 * Validate file name length
 * 
 * @param fileName - File name to validate
 * @param maxLength - Maximum allowed length (default: 255)
 * @returns true if valid, false otherwise
 */
export function validateFileNameLength(
  fileName: string,
  maxLength: number = 255
): boolean {
  if (!fileName || typeof fileName !== 'string') {
    return false
  }

  if (fileName.length > maxLength) {
    console.warn('[FILE_SANITIZER] File name too long', {
      fileName,
      length: fileName.length,
      maxLength
    })
    return false
  }

  return true
}

/**
 * Check if file name contains only safe characters
 * 
 * @param fileName - File name to check
 * @returns true if safe, false otherwise
 */
export function isSafeFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') {
    return false
  }

  // Allow only: letters, numbers, dots, hyphens, underscores
  const safePattern = /^[a-zA-Z0-9.\-_]+$/
  
  if (!safePattern.test(fileName)) {
    console.warn('[FILE_SANITIZER] Unsafe characters in file name', { fileName })
    return false
  }

  // Additional checks
  if (fileName.includes('..')) {
    console.warn('[FILE_SANITIZER] Consecutive dots detected', { fileName })
    return false
  }

  return true
}

/**
 * Placeholder for virus scanning
 * 
 * TODO V1.1: Integrate with ClamAV, VirusTotal, or similar service
 * 
 * @param file - File to scan (Buffer or Blob)
 * @returns Promise with scan result
 */
export async function scanAttachment(
  file: Buffer | Blob
): Promise<{ clean: boolean; threat?: string }> {
  // Placeholder implementation
  // In V1.1, integrate with actual virus scanning service
  
  const fileSize = file instanceof Buffer ? file.length : (file as Blob).size
  
  console.log('[FILE_SANITIZER] Virus scan placeholder', {
    size: fileSize,
    note: 'TODO: Integrate ClamAV or similar in V1.1'
  })
  
  // For now, always return clean
  // In production, this should call an actual scanning service
  return {
    clean: true
  }
}
