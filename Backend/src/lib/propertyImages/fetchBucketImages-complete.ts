import { createClient } from '@supabase/supabase-js'

/**
 * Función para obtener imágenes desde Supabase Storage bucket
 * Implementación completa con manejo de errores robusto
 */
export async function fetchBucketImages(userId: string, propertyId: string): Promise<string[]> {
  try {
    // Validar parámetros de entrada
    if (!userId || !propertyId) {
      console.warn('fetchBucketImages: userId o propertyId faltantes')
      return []
    }

    // Crear cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Construir path de la carpeta de la propiedad
    const folderPath = `${userId}/${propertyId}`
    
    console.log('fetchBucketImages: Buscando imágenes en:', folderPath)

    // Listar archivos en el bucket de la propiedad
    const { data: files, error: listError } = await supabase.storage
      .from('property-images')
      .list(folderPath, {
        limit: 20, // Límite de imágenes por propiedad
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (listError) {
      console.error('fetchBucketImages: Error listando archivos:', listError)
      return []
    }

    if (!files || files.length === 0) {
      console.log('fetchBucketImages: No se encontraron imágenes para la propiedad')
      return []
    }

    // Generar URLs públicas para cada imagen
    const imageUrls: string[] = []
    
    for (const file of files) {
      // Construir path completo del archivo
      const filePath = `${folderPath}/${file.name}`
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath)
      
      if (urlData?.publicUrl) {
        imageUrls.push(urlData.publicUrl)
      }
    }

    console.log(`fetchBucketImages: ${imageUrls.length} imágenes encontradas`)
    return imageUrls

  } catch (error) {
    console.error('fetchBucketImages: Error inesperado:', error)
    return []
  }
}

/**
 * Función auxiliar para subir una imagen al bucket
 */
export async function uploadPropertyImage(
  userId: string, 
  propertyId: string, 
  file: File,
  fileName?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Generar nombre único si no se proporciona
    const finalFileName = fileName || `${Date.now()}-${file.name}`
    const filePath = `${userId}/${propertyId}/${finalFileName}`

    // Subir archivo
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('uploadPropertyImage: Error subiendo archivo:', error)
      return { success: false, error: error.message }
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath)

    return { 
      success: true, 
      url: urlData.publicUrl 
    }

  } catch (error) {
    console.error('uploadPropertyImage: Error inesperado:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}
