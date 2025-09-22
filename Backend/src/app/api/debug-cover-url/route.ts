import { NextRequest, NextResponse } from 'next/server'
import { generatePublicCoverUrl, getPublicImageUrl, isValidStorageKey } from '@/lib/signed-urls'

export async function GET(request: NextRequest) {
  console.log('=== DEBUG COVER URL GENERATION ===')
  
  try {
    const testKey = '6403f9d2-e846-4c70-87e0-e051127d9500/4d4dc702-953a-41b9-b875-8c1eaa3d8714/00-cover.jpg.jpg'
    const propertyType = 'HOUSE'
    
    console.log('🔍 Testing key:', testKey)
    console.log('🏠 Property type:', propertyType)
    
    // Test 1: Validar key
    const isValid = isValidStorageKey(testKey)
    console.log('✅ Key validation:', isValid)
    
    // Test 2: Generar URL pública directa
    const directUrl = getPublicImageUrl(testKey)
    console.log('🌐 Direct URL:', directUrl)
    
    // Test 3: Generar cover URL
    const coverResult = generatePublicCoverUrl(testKey, propertyType)
    console.log('📸 Cover result:', coverResult)
    
    // Test 4: Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    console.log('🔧 Supabase URL:', supabaseUrl)
    
    // Test 5: URL esperada manualmente
    const expectedUrl = `${supabaseUrl}/storage/v1/object/public/property-images/${testKey}`
    console.log('🎯 Expected URL:', expectedUrl)
    
    return NextResponse.json({
      testKey,
      propertyType,
      validation: {
        isValid,
        keyLength: testKey.length,
        hasSlashes: testKey.includes('/'),
        hasExtension: testKey.includes('.jpg')
      },
      urls: {
        directUrl,
        coverResult,
        expectedUrl
      },
      environment: {
        supabaseUrl,
        nodeEnv: process.env.NODE_ENV
      }
    })
    
  } catch (error) {
    console.error('❌ Error en debug:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
