import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/debug-attachment-download-flow?attachmentId=xxx
 * Debug endpoint para investigar el flujo de descarga de adjuntos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json({
        error: 'attachmentId is required',
        usage: '/api/debug-attachment-download-flow?attachmentId=xxx'
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Obtener información del adjunto
    const { data: attachment, error: fetchError } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json({
        step: 'FETCH_ATTACHMENT',
        error: 'Attachment not found',
        attachmentId,
        details: fetchError
      }, { status: 404 })
    }

    // 2. Generar URL firmada SIN download
    const { data: signedDataNormal, error: signedErrorNormal } = await supabase.storage
      .from(attachment.bucket || 'message-attachments')
      .createSignedUrl(attachment.path, 3600)

    // 3. Generar URL firmada CON download
    const { data: signedDataDownload, error: signedErrorDownload } = await supabase.storage
      .from(attachment.bucket || 'message-attachments')
      .createSignedUrl(attachment.path, 3600, {
        download: attachment.file_name || true
      })

    // 4. Generar URL firmada CON download y nombre específico
    const { data: signedDataDownloadNamed, error: signedErrorDownloadNamed } = await supabase.storage
      .from(attachment.bucket || 'message-attachments')
      .createSignedUrl(attachment.path, 3600, {
        download: attachment.file_name
      })

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.file_name,
        mime: attachment.mime,
        path: attachment.path,
        bucket: attachment.bucket,
        sizeBytes: attachment.size_bytes
      },
      urls: {
        normal: {
          url: signedDataNormal?.signedUrl || null,
          error: signedErrorNormal?.message || null,
          description: 'URL sin parámetro download (abre en navegador)'
        },
        downloadTrue: {
          url: signedDataDownload?.signedUrl || null,
          error: signedErrorDownload?.message || null,
          description: 'URL con download: true (debería descargar)'
        },
        downloadNamed: {
          url: signedDataDownloadNamed?.signedUrl || null,
          error: signedErrorDownloadNamed?.message || null,
          description: 'URL con download: fileName (debería descargar con nombre)'
        }
      },
      instructions: {
        test1: 'Abre la URL "normal" - debería abrir en navegador',
        test2: 'Abre la URL "downloadTrue" - debería descargar',
        test3: 'Abre la URL "downloadNamed" - debería descargar con nombre correcto',
        currentImplementation: 'El endpoint GET usa downloadNamed'
      },
      apiEndpoint: {
        url: `/api/messages/attachments/${attachmentId}`,
        method: 'GET',
        requiresAuth: true,
        description: 'Este es el endpoint que usa el botón de descarga'
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
