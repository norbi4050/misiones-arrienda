'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export interface BboxCoords {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

interface UseBboxSyncReturn {
  bbox: BboxCoords | null
  updateBbox: (newBbox: BboxCoords | null) => void
  clearBbox: () => void
}

/**
 * Hook para sincronizar el bounding box con la URL
 * - Lee bbox de la URL al montar
 * - Actualiza la URL cuando cambia el bbox (usando replaceState)
 * - Incluye debounce de 300ms para evitar actualizaciones excesivas
 */
export function useBboxSync(): UseBboxSyncReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [bbox, setBbox] = useState<BboxCoords | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Leer bbox de la URL al montar
  useEffect(() => {
    const bboxParam = searchParams.get('bbox')
    if (bboxParam) {
      const coords = bboxParam.split(',').map(c => parseFloat(c))
      if (coords.length === 4 && coords.every(c => !isNaN(c))) {
        setBbox({
          minLng: coords[0],
          minLat: coords[1],
          maxLng: coords[2],
          maxLat: coords[3]
        })
      }
    }
  }, []) // Solo al montar

  // Función para actualizar bbox con debounce
  const updateBbox = useCallback((newBbox: BboxCoords | null) => {
    // Actualizar estado inmediatamente
    setBbox(newBbox)

    // Limpiar timer anterior si existe
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Crear nuevo timer con debounce de 300ms
    const timer = setTimeout(() => {
      // Construir nueva URL con todos los params existentes
      const params = new URLSearchParams(searchParams.toString())
      
      if (newBbox) {
        // Formato: minLng,minLat,maxLng,maxLat
        const bboxString = `${newBbox.minLng.toFixed(6)},${newBbox.minLat.toFixed(6)},${newBbox.maxLng.toFixed(6)},${newBbox.maxLat.toFixed(6)}`
        params.set('bbox', bboxString)
      } else {
        params.delete('bbox')
      }

      // Actualizar URL sin recargar la página (replaceState)
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      window.history.replaceState({}, '', newUrl)
    }, 300)

    setDebounceTimer(timer)
  }, [pathname, searchParams, debounceTimer])

  // Función para limpiar bbox
  const clearBbox = useCallback(() => {
    updateBbox(null)
  }, [updateBbox])

  // Cleanup del timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return {
    bbox,
    updateBbox,
    clearBbox
  }
}

/**
 * Utilidad para convertir bounds de Leaflet a BboxCoords
 */
export function leafletBoundsToBbox(bounds: any): BboxCoords {
  return {
    minLng: bounds.getWest(),
    minLat: bounds.getSouth(),
    maxLng: bounds.getEast(),
    maxLat: bounds.getNorth()
  }
}

/**
 * Utilidad para validar si un bbox es válido
 */
export function isValidBbox(bbox: BboxCoords | null): boolean {
  if (!bbox) return false
  
  return (
    !isNaN(bbox.minLng) &&
    !isNaN(bbox.minLat) &&
    !isNaN(bbox.maxLng) &&
    !isNaN(bbox.maxLat) &&
    bbox.minLng < bbox.maxLng &&
    bbox.minLat < bbox.maxLat &&
    bbox.minLng >= -180 &&
    bbox.minLng <= 180 &&
    bbox.maxLng >= -180 &&
    bbox.maxLng <= 180 &&
    bbox.minLat >= -90 &&
    bbox.minLat <= 90 &&
    bbox.maxLat >= -90 &&
    bbox.maxLat <= 90
  )
}
