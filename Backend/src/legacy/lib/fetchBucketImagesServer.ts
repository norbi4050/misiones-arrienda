import { createClient } from '@supabase/supabase-js'
import { parseImagesText } from './parseImagesText'

/**
 * Fetch property images from Supabase storage bucket (server-side)
 * Uses convention: property-images/${userId}/${propertyId}/ (and fallback to propertyId/)
 */
export async function fetchBucketImagesServer(userId: string, propertyId: string): Promise<string[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Try primary prefix
    let prefix = `${userId}/${propertyId}/`
    let { data, error } = await supabase.storage
      .from('property-images')
      .list(prefix, { limit: 50 })

    if (error) {
      console.error('[server] list error:', error?.message)
    }

    // If no data or error, try legacy prefix
    if ((!data || data.length === 0) && !error) {
      prefix = `${propertyId}/`
      const res = await supabase.storage
        .from('property-images')
        .list(prefix, { limit: 50 })
      data = res.data
      error = res.error
      if (error) {
        console.error('[server] list error legacy:', error?.message)
      }
    }

    if (error) {
      console.error('[server] list error message:', error.message)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Filter out entries that end with '/' (folders)
    const files = data.filter((file: any) => !file.name.endsWith('/'))

    // Build public URLs for each file
    const imageUrls = files.map((file: any) => {
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(`${prefix}${file.name}`)
      return urlData.publicUrl
    })

    return imageUrls
  } catch (error) {
    console.error('Error in fetchBucketImagesServer:', error)
    return []
  }
}

/**
 * Resolve images server-side with priority: bucket images first, then API images, with deduplication
 */
export async function resolveImagesServer({
  imagesText,
  userId,
  propertyId
}: {
  imagesText: any
  userId: string
  propertyId: string
}): Promise<string[]> {
  // Parse API images from imagesText
  const apiImages = parseImagesText(imagesText)

  // Fetch bucket images
  const bucketImages = await fetchBucketImagesServer(userId, propertyId)

  // Combine arrays with priority: bucket images first
  const combined = [...bucketImages, ...apiImages]

  // Remove duplicates while preserving order
  const seen = new Set<string>()
  const unique: string[] = []

  for (const url of combined) {
    if (url && typeof url === 'string' && !seen.has(url)) {
      seen.add(url)
      unique.push(url)
    }
  }

  return unique
}
