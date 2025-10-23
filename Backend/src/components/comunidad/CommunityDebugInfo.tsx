"use client"

import { useEffect } from 'react'

interface CommunityDebugInfoProps {
  postsCount: number
  total: number
  searchParams: Record<string, any>
}

/**
 * Componente temporal de debug para ver por qué no se muestran los posts
 * Este componente solo renderiza logs en la consola del navegador
 */
export function CommunityDebugInfo({ postsCount, total, searchParams }: CommunityDebugInfoProps) {
  useEffect(() => {
    console.log('='.repeat(50))
    console.log('🐛 [COMMUNITY DEBUG INFO]')
    console.log('='.repeat(50))
    console.log('Search Params:', searchParams)
    console.log('Posts Count:', postsCount)
    console.log('Total:', total)
    console.log('Has Posts:', postsCount > 0)

    // Test: Make direct API call to see what it returns
    const testApiCall = async () => {
      try {
        const response = await fetch('/api/comunidad/posts?sort=recent')
        const data = await response.json()
        console.log('🔍 [DIRECT API CALL] /api/comunidad/posts?sort=recent')
        console.log('Response:', data)
        console.log('Has posts in direct call?', data.posts?.length > 0)
      } catch (error) {
        console.error('❌ [DIRECT API CALL] Error:', error)
      }
    }

    testApiCall()

    console.log('='.repeat(50))
  }, [postsCount, total, searchParams])

  // No renderizar nada visualmente
  return null
}
