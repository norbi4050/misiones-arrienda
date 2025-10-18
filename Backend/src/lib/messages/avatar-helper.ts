/**
 * Helper para generar avatares automáticos cuando el usuario no tiene uno
 * Genera SVG inline como Data URI para evitar problemas de CORS
 */

/**
 * Genera una URL de avatar automático basado en el nombre del usuario
 * Si el usuario no tiene avatar, genera un SVG con sus iniciales como Data URI
 *
 * @param name - Nombre del usuario (ej: "Cesar", "Carlos Gonzalez")
 * @param email - Email del usuario (fallback si no hay nombre)
 * @param existingAvatar - Avatar existente (URL), si existe
 * @returns URL del avatar (existente o Data URI con SVG generado)
 */
export function getAvatarUrl(
  name: string | null,
  email: string,
  existingAvatar: string | null
): string {
  // Si ya tiene avatar, usarlo
  if (existingAvatar && existingAvatar.trim() !== '') {
    return existingAvatar
  }

  // Generar nombre para el avatar
  const displayName = name || email.split('@')[0]

  // Obtener iniciales (máximo 2 caracteres)
  const initials = getInitials(displayName)

  // Generar color consistente basado en el nombre
  const backgroundColor = getConsistentColor(displayName)

  // Generar SVG inline como Data URI (evita problemas de CORS)
  const svg = generateAvatarSVG(initials, backgroundColor)
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

  return dataUri
}

/**
 * Genera un SVG de avatar con iniciales
 * @param initials - Iniciales del usuario (ej: "C", "CG")
 * @param bgColor - Color de fondo en hex sin # (ej: "F39C12")
 * @returns String con el SVG completo
 */
function generateAvatarSVG(initials: string, bgColor: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#${bgColor}" rx="64"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="#ffffff" font-family="Arial, sans-serif" font-size="48" font-weight="bold">${initials}</text>
</svg>`
}

/**
 * Obtiene las iniciales de un nombre
 * Ejemplos:
 * - "Cesar" → "C"
 * - "Carlos Gonzalez" → "CG"
 * - "Juan Pablo Martinez" → "JM" (primera y última)
 */
function getInitials(name: string): string {
  if (!name || name.trim() === '') {
    return '?'
  }

  const words = name.trim().split(/\s+/).filter(w => w.length > 0)

  if (words.length === 0) {
    return '?'
  }

  if (words.length === 1) {
    // Un solo nombre: usar primera letra
    return words[0][0].toUpperCase()
  }

  // Múltiples palabras: primera letra del primer y último nombre
  const first = words[0][0].toUpperCase()
  const last = words[words.length - 1][0].toUpperCase()

  return first + last
}

/**
 * Genera un color consistente basado en un string
 * El mismo nombre siempre genera el mismo color
 *
 * @param str - String base (nombre, email, etc)
 * @returns Color en formato hex sin # (ej: "4A90E2")
 */
function getConsistentColor(str: string): string {
  // Paleta de colores agradables para avatares
  const colors = [
    '4A90E2', // Azul
    '50C878', // Verde esmeralda
    'F39C12', // Naranja
    'E74C3C', // Rojo
    '9B59B6', // Púrpura
    '3498DB', // Azul claro
    '1ABC9C', // Turquesa
    'E67E22', // Calabaza
    '2ECC71', // Verde
    'E91E63', // Rosa
    '00BCD4', // Cian
    'FF9800', // Naranja profundo
  ]

  // Generar hash simple del string
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32-bit integer
  }

  // Usar el hash para seleccionar un color de la paleta
  const index = Math.abs(hash) % colors.length

  return colors[index]
}
