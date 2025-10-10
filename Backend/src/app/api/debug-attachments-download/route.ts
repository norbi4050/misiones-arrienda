// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint de diagnóstico para verificar el flujo completo de descarga de adjuntos
 * GET /api/debug-attachments-download?threadId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')

    if (!threadId) {
      return NextResponse.json({ 
        error: 'threadId requerido' 
      }, { status: 400 })
    }

    const supabase = createClient()

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'No autorizado',
        details: authError?.message 
      }, { status: 401 })
    }

    console.log('[DEBUG Download] Usuario:', user.id)
    console.log('[DEBUG Download] ThreadId:', threadId)

    // 1. Verificar que el thread existe y el usuario tiene acceso
    const { data: thread, error: threadError } = await supabase
      .from('Conversation')
      .select('id, aId, bId, isActive')
      .eq('id', threadId)
      .eq('isActive', true)
      .single()

    if (threadError || !thread) {
      return NextResponse.json({
        error: 'Thread no encontrado',
        threadId,
        threadError: threadError?.message
      }, { status: 404 })
    }

    // 2. Obtener UserProfile del usuario actual
    const { data: userProfile, error: profileError } = await supabase
      .from('UserProfile')
      .select('id, userId')
      .eq('userId', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({
        error: 'Perfil no encontrado',
        userId: user.id,
        profileError: profileError?.message
      }, { status: 403 })
    }

    // 3. Verificar acceso al thread
    const hasAccess = thread.aId === userProfile.id || thread.bId === userProfile.id
    if (!hasAccess) {
      return NextResponse.json({
        error: 'Sin acceso al thread',
        userProfileId: userProfile.id,
        threadAId: thread.aId,
        threadBId: thread.bId
      }, { status: 403 })
    }

    // 4. Obtener TODOS los mensajes del thread (sin límite para diagnóstico)
    const { data: messages, error: messagesError } = await supabase
      .from('Message')
      .select('id, body, senderId, createdAt')
      .eq('conversationId', threadId)
      .order('createdAt', { ascending: false })
      .limit(100) // Últimos 100 mensajes

    if (messagesError) {
      return NextResponse.json({
        error: 'Error al obtener mensajes',
        messagesError: messagesError.message
      }, { status: 500 })
    }

    const messageIds = (messages || []).map(m => m.id)

    // 5. Obtener TODOS los adjuntos de esos mensajes
    const { data: attachments, error: attachmentsError } = await supabase
      .from('MessageAttachment')
      .select('*')
      .in('messageId', messageIds)
      .order('createdAt', { ascending: false })

    if (attachmentsError) {
      return NextResponse.json({
        error: 'Error al obtener adjuntos',
        attachmentsError: attachmentsError.message
      }, { status: 500 })
    }

    // 6. Generar signed URLs para cada adjunto
    const attachmentsWithUrls = await Promise.all(
      (attachments || []).map(async (att) => {
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('message-attachments')
          .createSignedUrl(att.path, 3600)

        return {
          id: att.id,
          messageId: att.messageId,
          path: att.path,
          fileName: att.path.split('/').pop(),
          mime: att.mime,
          sizeBytes: att.sizeBytes,
          createdAt: att.createdAt,
          signedUrl: signedUrlData?.signedUrl || null,
          urlError: urlError?.message || null,
          hasValidUrl: !!signedUrlData?.signedUrl
        }
      })
    )

    // 7. Verificar configuración del bucket
    const { data: bucketInfo, error: bucketError } = await supabase.storage
      .from('message-attachments')
      .list('', { limit: 1 })

    // 8. Agrupar adjuntos por mensaje
    const attachmentsByMessage = new Map<string, any[]>()
    attachmentsWithUrls.forEach(att => {
      const existing = attachmentsByMessage.get(att.messageId) || []
      existing.push(att)
      attachmentsByMessage.set(att.messageId, existing)
    })

    // 9. Mensajes con adjuntos
    const messagesWithAttachments = (messages || [])
      .filter(msg => attachmentsByMessage.has(msg.id))
      .map(msg => ({
        id: msg.id,
        body: msg.body?.substring(0, 50) + (msg.body && msg.body.length > 50 ? '...' : ''),
        senderId: msg.senderId,
        isMine: msg.senderId === userProfile.id,
        createdAt: msg.createdAt,
        attachments: attachmentsByMessage.get(msg.id) || []
      }))

    // 10. Estadísticas
    const stats = {
      totalMessages: messages?.length || 0,
      messagesWithAttachments: messagesWithAttachments.length,
      totalAttachments: attachments?.length || 0,
      attachmentsWithValidUrls: attachmentsWithUrls.filter(a => a.hasValidUrl).length,
      attachmentsWithErrors: attachmentsWithUrls.filter(a => a.urlError).length
    }

    return NextResponse.json({
      success: true,
      threadId,
      userId: user.id,
      userProfileId: userProfile.id,
      hasAccess,
      stats,
      messagesWithAttachments,
      bucketAccessible: !bucketError,
      bucketError: bucketError?.message || null,
      attachmentsDetails: attachmentsWithUrls,
      recommendations: generateRecommendations(stats, attachmentsWithUrls)
    })

  } catch (error: any) {
    console.error('[DEBUG Download] Error:', error)
    return NextResponse.json({
      error: 'Error interno',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

function generateRecommendations(stats: any, attachments: any[]): string[] {
  const recommendations: string[] = []

  if (stats.totalAttachments === 0) {
    recommendations.push('❌ No hay adjuntos en este thread. Intenta enviar un mensaje con adjunto.')
  }

  if (stats.attachmentsWithErrors > 0) {
    recommendations.push(`⚠️ ${stats.attachmentsWithErrors} adjuntos tienen errores al generar signed URLs. Verifica las políticas de Storage.`)
  }

  if (stats.attachmentsWithValidUrls === 0 && stats.totalAttachments > 0) {
    recommendations.push('❌ CRÍTICO: Ningún adjunto tiene URL válida. Verifica la configuración del bucket "message-attachments".')
  }

  if (stats.messagesWithAttachments === 0 && stats.totalAttachments > 0) {
    recommendations.push('⚠️ Hay adjuntos pero no están vinculados a mensajes visibles. Pueden estar en mensajes más antiguos.')
  }

  const orphanAttachments = attachments.filter(a => !a.messageId)
  if (orphanAttachments.length > 0) {
    recommendations.push(`⚠️ ${orphanAttachments.length} adjuntos huérfanos (sin messageId). Considera limpiarlos.`)
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Todo parece estar funcionando correctamente.')
  }

  return recommendations
}
