// =====================================================
// DEBUG: Supabase Storage Download Configuration
// Investigar configuración de descarga de archivos
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Obtener un adjunto reciente para pruebas
    const { data: recentAttachment, error: attachmentError } = await supabase
      .from('MessageAttachment')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (attachmentError || !recentAttachment) {
      return NextResponse.json({
        error: 'No se encontró ningún adjunto para probar',
        details: attachmentError
      }, { status: 404 });
    }

    console.log('[DEBUG STORAGE] Testing attachment:', {
      id: recentAttachment.id,
      path: recentAttachment.path,
      fileName: recentAttachment.fileName,
      mime: recentAttachment.mime
    });

    // 2. Probar diferentes métodos de generación de URL
    const tests = {
      attachment: {
        id: recentAttachment.id,
        path: recentAttachment.path,
        fileName: recentAttachment.fileName,
        mime: recentAttachment.mime
      },
      urls: {} as any,
      bucketInfo: {} as any,
      fileExists: {} as any
    };

    // Test 1: URL firmada SIN parámetro download
    const { data: signedUrl1, error: error1 } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(recentAttachment.path, 3600);

    tests.urls.withoutDownload = {
      url: signedUrl1?.signedUrl,
      error: error1,
      description: 'URL firmada sin parámetro download (comportamiento actual)'
    };

    // Test 2: URL firmada CON parámetro download (nombre de archivo)
    const { data: signedUrl2, error: error2 } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(recentAttachment.path, 3600, {
        download: recentAttachment.fileName
      });

    tests.urls.withDownloadFilename = {
      url: signedUrl2?.signedUrl,
      error: error2,
      description: 'URL firmada con download: fileName (debería forzar descarga)'
    };

    // Test 3: URL firmada CON parámetro download = true
    const { data: signedUrl3, error: error3 } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(recentAttachment.path, 3600, {
        download: true
      });

    tests.urls.withDownloadTrue = {
      url: signedUrl3?.signedUrl,
      error: error3,
      description: 'URL firmada con download: true (debería forzar descarga con nombre original)'
    };

    // Test 4: URL pública (si el bucket es público)
    const publicUrl = supabase.storage
      .from('message-attachments')
      .getPublicUrl(recentAttachment.path);

    tests.urls.publicUrl = {
      url: publicUrl.data.publicUrl,
      description: 'URL pública (si el bucket es público, no debería funcionar si es privado)'
    };

    // 3. Obtener información del bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    const messageAttachmentsBucket = buckets?.find(b => b.name === 'message-attachments');
    
    tests.bucketInfo = {
      exists: !!messageAttachmentsBucket,
      isPublic: messageAttachmentsBucket?.public,
      allowedMimeTypes: messageAttachmentsBucket?.allowed_mime_types,
      fileSizeLimit: messageAttachmentsBucket?.file_size_limit,
      error: bucketsError
    };

    // 4. Verificar si el archivo existe en storage
    const { data: fileExists, error: fileError } = await supabase.storage
      .from('message-attachments')
      .list(recentAttachment.path.split('/').slice(0, -1).join('/'), {
        search: recentAttachment.path.split('/').pop()
      });

    tests.fileExists = {
      found: fileExists && fileExists.length > 0,
      details: fileExists,
      error: fileError
    };

    // 5. Análisis de URLs generadas
    const urlAnalysis = {
      withoutDownload: analyzeUrl(tests.urls.withoutDownload.url),
      withDownloadFilename: analyzeUrl(tests.urls.withDownloadFilename.url),
      withDownloadTrue: analyzeUrl(tests.urls.withDownloadTrue.url)
    };

    return NextResponse.json({
      success: true,
      tests,
      urlAnalysis,
      recommendations: generateRecommendations(tests, urlAnalysis)
    }, { status: 200 });

  } catch (error) {
    console.error('[DEBUG STORAGE] Exception:', error);
    return NextResponse.json({
      error: 'Error en diagnóstico',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function analyzeUrl(url: string | undefined): any {
  if (!url) return { error: 'URL no generada' };

  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    return {
      hasDownloadParam: params.has('download'),
      downloadValue: params.get('download'),
      hasToken: params.has('token'),
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      allParams: Object.fromEntries(params.entries())
    };
  } catch (e) {
    return { error: 'URL inválida', url };
  }
}

function generateRecommendations(tests: any, urlAnalysis: any): string[] {
  const recommendations: string[] = [];

  // Verificar si el bucket es público
  if (tests.bucketInfo.isPublic) {
    recommendations.push('⚠️ El bucket es PÚBLICO. Considera hacerlo privado para mayor seguridad.');
  }

  // Verificar si las URLs con download tienen el parámetro
  if (!urlAnalysis.withDownloadFilename.hasDownloadParam) {
    recommendations.push('❌ La URL con download: fileName NO tiene el parámetro download en la query string. Esto indica un problema con Supabase Storage.');
  } else {
    recommendations.push('✅ La URL con download: fileName SÍ tiene el parámetro download. Usar este método.');
  }

  if (!urlAnalysis.withDownloadTrue.hasDownloadParam) {
    recommendations.push('❌ La URL con download: true NO tiene el parámetro download en la query string.');
  } else {
    recommendations.push('✅ La URL con download: true SÍ tiene el parámetro download.');
  }

  // Verificar si el archivo existe
  if (!tests.fileExists.found) {
    recommendations.push('❌ El archivo NO se encontró en storage. Verificar que la ruta sea correcta.');
  } else {
    recommendations.push('✅ El archivo existe en storage.');
  }

  // Recomendación final
  if (urlAnalysis.withDownloadFilename.hasDownloadParam) {
    recommendations.push('📋 SOLUCIÓN: Usar createSignedUrl con { download: fileName } en attachments-helper.ts');
  } else {
    recommendations.push('📋 PROBLEMA: Supabase Storage no está agregando el parámetro download. Verificar versión de @supabase/supabase-js');
  }

  return recommendations;
}
