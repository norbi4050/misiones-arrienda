// Legacy shim para compatibilidad
export { fetchBucketImages } from './propertyImages/fetchBucketImages'
export { resolveImages }     from './propertyImages/resolveImages'
export { parseImagesText }   from './propertyImages/parseImagesText'

// API legacy que algunos componentes aún llaman
export function parseLegacyImages(input: any): string[] {
  try {
    // reutiliza la implementación nueva
    const { parseImagesText } = require('./propertyImages/parseImagesText')
    return parseImagesText(input)
  } catch {
    return []
  }
}
