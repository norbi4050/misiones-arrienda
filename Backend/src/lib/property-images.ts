import { supabase } from './supabaseClient'

/**
 * Fetch property images from Supabase storage bucket
 * Uses convention: property-images/${propertyId}/${uuid}.jpg
 */
export async function fetchPropertyImages(propertyId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('property-images')
      .list(`${propertyId}/`, {
        limit: 50,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.warn('Error fetching property images from bucket:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log(`No images found in bucket for property ${propertyId}`)
      return []
    }

    // Filter only .jpg files and get public URLs
    const imageFiles = data.filter(file =>
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.png')
    )

    const imageUrls = imageFiles.map(file => {
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(`${propertyId}/${file.name}`)

      return urlData.publicUrl
    })

    console.log(`Found ${imageUrls.length} images for property ${propertyId}:`, imageUrls)
    return imageUrls

  } catch (error) {
    console.error('Error in fetchPropertyImages:', error)
    return []
  }
}

/**
 * Parse legacy JSON images as fallback
 */
export function parseLegacyImages(images: any): string[] {
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
