/**
 * Parse legacy JSON images as fallback
 */
export function parseImagesText(images: any): string[] {
  if (Array.isArray(images)) {
    return images
  }
  if (typeof images === 'string') {
    try {
      return JSON.parse(images)
    } catch {
      return [images]
    }
  }
  return []
}
