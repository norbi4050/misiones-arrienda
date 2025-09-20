/**
 * Función para obtener imágenes desde Supabase Storage bucket
 * Implementación básica que retorna array vacío para no romper la aplicación
 */
export async function fetchBucketImages(userId: string, propertyId: string): Promise<string[]> {
  try {
    // Log para debugging (temporal)
    console.log('fetchBucketImages called with:', { userId, propertyId })
    
    // TODO: Implementar lógica real de Supabase Storage cuando sea necesario
    // Por ahora retornamos array vacío para que la aplicación funcione
    // sin errores de compilación
    
    return []
  } catch (error) {
    console.error('Error fetching bucket images:', error)
    return []
  }
}
