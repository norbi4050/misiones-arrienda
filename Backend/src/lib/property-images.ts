'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Sistema de fallback bucket-first para imágenes de propiedades
 * Prioridad: 1) Bucket privado con signed URLs, 2) property.images como fallback
 */

interface PropertyImageOptions {
  propertyId: string
  userId: string
  fallbackImages?: string[]
  maxImages?: number
}

/**
 * Obtener imágenes de propiedad con fallback bucket-first
 */
export async function getPropertyImages({
  propertyId,
  userId,
  fallbackImages = [],
  maxImages = 10
}: PropertyImageOptions): Promise<string[]> {
  try {
    // 1. Intentar primero el bucket privado
    const bucketImages = await getBucketImages(userId, propertyId, maxImages)
    
    if (bucketImages.length > 0) {
      console.log(`🎯 Usando ${bucketImages.length} imágenes del bucket para propiedad ${propertyId}`)
      return bucketImages
    }

    // 2. Fallback a property.images
    if (fallbackImages.length > 0) {
      console.log(`📁 Fallback: usando ${fallbackImages.length} imágenes de property.images para ${propertyId}`)
      return fallbackImages.slice(0, maxImages)
    }

    // 3. Placeholder final
    console.log(`🖼️ Sin imágenes: usando placeholder para propiedad ${propertyId}`)
    return ['/placeholder-apartment-1.jpg']

  } catch (error) {
    console.error('❌ Error obteniendo imágenes de propiedad:', error)
    
    // En caso de error, usar fallback
    if (fallbackImages.length > 0) {
      return fallbackImages.slice(0, maxImages)
    }
    
    return ['/placeholder-apartment-1.jpg']
  }
}

/**
 * Obtener imágenes del bucket privado con signed URLs
 */
async function getBucketImages(userId: string, propertyId: string, maxImages: number): Promise<string[]> {
  try {
    const supabase = createClient()
    
    // Listar archivos en el bucket
    const { data: files, error: listError } = await supabase.storage
      .from('property-images')
      .list(`${userId}/${propertyId}`, {
        limit: maxImages,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      console.warn('⚠️ Error listando archivos del bucket:', listError)
      return []
    }

    if (!files || files.length === 0) {
      console.log(`📂 Bucket vacío para ${userId}/${propertyId}`)
      return []
    }

    // Generar signed URLs para cada archivo
    const signedUrls: string[] = []
    
    for (const file of files) {
      const filePath = `${userId}/${propertyId}/${file.name}`
      
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('property-images')
        .createSignedUrl(filePath, 3600) // 1 hora de validez

      if (urlError) {
        console.warn(`⚠️ Error generando signed URL para ${filePath}:`, urlError)
        continue
      }

      if (signedUrl?.signedUrl) {
        signedUrls.push(signedUrl.signedUrl)
      }
    }

    console.log(`✅ Generadas ${signedUrls.length} signed URLs para ${userId}/${propertyId}`)
    return signedUrls

  } catch (error) {
    console.error('❌ Error en getBucketImages:', error)
    return []
  }
}

/**
 * Hook para usar en componentes React
 */
export function usePropertyImages(propertyId: string, userId: string, fallbackImages: string[] = []) {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'bucket' | 'fallback' | 'placeholder'>('placeholder')

  useEffect(() => {
    async function loadImages() {
      setLoading(true)
      
      try {
        const result = await getPropertyImages({
          propertyId,
          userId,
          fallbackImages
        })
        
        setImages(result)
        
        // Determinar fuente
        if (result.length > 0 && result[0].includes('supabase.co')) {
          setSource('bucket')
        } else if (fallbackImages.length > 0 && result.some(img => fallbackImages.includes(img))) {
          setSource('fallback')
        } else {
          setSource('placeholder')
        }
        
      } catch (error) {
        console.error('Error loading property images:', error)
        setImages(['/placeholder-apartment-1.jpg'])
        setSource('placeholder')
      } finally {
        setLoading(false)
      }
    }

    if (propertyId && userId) {
      loadImages()
    }
  }, [propertyId, userId, fallbackImages])

  return { images, loading, source }
}

/**
 * Función simplificada para obtener solo la imagen principal
 */
export async function getPropertyCoverImage(
  propertyId: string, 
  userId: string, 
  fallbackImage?: string
): Promise<string> {
  const images = await getPropertyImages({
    propertyId,
    userId,
    fallbackImages: fallbackImage ? [fallbackImage] : [],
    maxImages: 1
  })
  
  return images[0] || '/placeholder-apartment-1.jpg'
}
