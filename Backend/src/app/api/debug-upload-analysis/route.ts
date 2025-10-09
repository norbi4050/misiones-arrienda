import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const analysis: any = {
      timestamp: new Date().toISOString(),
      title: 'ANÁLISIS EXHAUSTIVO - UPLOAD IMÁGENES',
      
      // 1. VARIABLES DE ENTORNO
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'CONFIGURADA' : 'FALTANTE',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADA' : 'FALTANTE',
        serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        bucket: process.env.NEXT_PUBLIC_PROPERTY_IMAGES_BUCKET || 'property-images (default)',
        nodeEnv: process.env.NODE_ENV || 'undefined'
      },

      // 2. POSIBLES CAUSAS DEL ERROR 500
      possibleCauses: [
        'Bucket property-images no existe en Supabase',
        'Variable SUPABASE_SERVICE_ROLE_KEY incorrecta o expirada',
        'Políticas RLS bloqueando Service Role',
        'Esquema storage.objects corrupto (text = uuid error)',
        'Permisos insuficientes en bucket',
        'Límites de storage excedidos',
        'Versión de @supabase/supabase-js incompatible',
        'Configuración de CORS en Supabase',
        'Bucket en región diferente',
        'Service Role sin permisos de storage'
      ],

      // 3. DIFERENCIAS ENTRE FUNCIONABA VS AHORA
      changes: {
        before: 'Usaba bucket avatars (funcionaba)',
        now: 'Usa bucket property-images (error 500)',
        implication: 'El problema está específicamente con el bucket property-images'
      },

      // 4. TESTS A REALIZAR
      testsNeeded: [
        'Verificar si bucket property-images existe',
        'Probar upload a bucket avatars (debería funcionar)',
        'Verificar permisos del Service Role',
        'Comprobar políticas RLS del bucket',
        'Verificar límites de storage',
        'Test de conectividad básica'
      ]
    }

    // Test 1: Verificar conexión básica
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
      
      if (bucketsError) {
        analysis.connectionTest = `ERROR: ${bucketsError.message}`
      } else {
        analysis.connectionTest = `OK - ${buckets?.length || 0} buckets`
        analysis.availableBuckets = buckets?.map(b => ({
          name: b.name,
          public: b.public,
          createdAt: b.created_at
        })) || []
        
        // Verificar si property-images existe
        const propertyImagesBucket = buckets?.find(b => b.name === 'property-images')
        analysis.propertyImagesBucket = propertyImagesBucket ? {
          exists: true,
          public: propertyImagesBucket.public,
          createdAt: propertyImagesBucket.created_at
        } : {
          exists: false,
          message: 'Bucket property-images NO EXISTE - esta es la causa del error 500'
        }
      }
    } catch (e: any) {
      analysis.connectionTest = `EXCEPTION: ${e.message}`
    }

    // Test 2: Verificar bucket avatars (que sabemos que funciona)
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: avatarsFiles, error: avatarsError } = await supabaseAdmin
        .storage.from('avatars')
        .list('', { limit: 1 })
      
      if (avatarsError) {
        analysis.avatarsBucketTest = `ERROR: ${avatarsError.message}`
      } else {
        analysis.avatarsBucketTest = `OK - Bucket avatars accesible`
      }
    } catch (e: any) {
      analysis.avatarsBucketTest = `EXCEPTION: ${e.message}`
    }

    // Test 3: Intentar crear bucket property-images
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: createResult, error: createError } = await supabaseAdmin
        .storage.createBucket('property-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
          fileSizeLimit: 2097152 // 2MB
        })
      
      if (createError) {
        if (createError.message.includes('already exists')) {
          analysis.bucketCreation = 'Bucket ya existe pero no es accesible'
        } else {
          analysis.bucketCreation = `ERROR creando bucket: ${createError.message}`
        }
      } else {
        analysis.bucketCreation = 'SUCCESS - Bucket creado exitosamente'
      }
    } catch (e: any) {
      analysis.bucketCreation = `EXCEPTION: ${e.message}`
    }

    // 5. RECOMENDACIONES
    analysis.recommendations = [
      'Si bucket property-images no existe: usar bucket avatars temporalmente',
      'Si bucket existe pero no es accesible: verificar políticas RLS',
      'Si Service Role no tiene permisos: verificar configuración en Supabase Dashboard',
      'Si todo falla: crear bucket manualmente en Supabase Dashboard'
    ]

    return NextResponse.json(analysis)
  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message,
      timestamp: new Date().toISOString(),
      type: 'ANALYSIS_ERROR'
    }, { status: 500 })
  }
}
