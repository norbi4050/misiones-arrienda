import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getMessagesAttachments } from '@/lib/messages/attachments-helper'
import { PrismaClient } from '@prisma/client'
import { sendNotification, type NotificationChannel } from '@/lib/notification-service'

const prisma = new PrismaClient()

// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// POST /api/messages/threads/[id]/messages → enviar mensaje
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id: conversationId } = params

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { content, attachmentIds } = body

    console.log('[Messages] 🔍 Request body received:', {
      content: content?.substring(0, 50),
      attachmentIds,
      attachmentIdsType: typeof attachmentIds,
      isArray: Array.isArray(attachmentIds),
      length: attachmentIds?.length,
      fullBody: body
    })

    if (!content || !content.trim()) {
      return NextResponse.json({
        error: 'Contenido del mensaje requerido'
      }, { status: 400 })
    }

    console.log('[Messages] Creating message with attachments:', attachmentIds)

    // Intentar primero con tabla Conversation usando Prisma (bypassa RLS)
    let thread: any = null
    let isPrismaSchema = false

    try {
      const prismaThread = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          isActive: true
        },
        include: {
          a: true,
          b: true
        }
      })

      if (prismaThread) {
        // Verificar que el usuario es participante (via UserProfile)
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId: user.id }
        })

        if (userProfile && (prismaThread.aId === userProfile.id || prismaThread.bId === userProfile.id)) {
          thread = prismaThread
          isPrismaSchema = true
        }
      }
    } catch (prismaError) {
      console.error('[Messages] Error buscando con Prisma:', prismaError)
    }

    // Si no se encontró en Conversation, intentar con conversations (SUPABASE schema)
    if (!thread) {
      const { data: supabaseThread, error: supabaseError } = await supabase
        .from('conversations')
        .select('id, a_id, b_id, participant_1, participant_2')
        .eq('id', conversationId)
        .or(`a_id.eq.${user.id},b_id.eq.${user.id},participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .single()

      if (!supabaseError && supabaseThread) {
        // Verificar que el usuario es participante
        const isParticipant = 
          supabaseThread.a_id === user.id ||
          supabaseThread.b_id === user.id ||
          supabaseThread.participant_1 === user.id ||
          supabaseThread.participant_2 === user.id
        
        if (isParticipant) {
          thread = supabaseThread
          isPrismaSchema = false
        }
      }
    }

    if (!thread) {
      console.error('[Messages] ❌ Hilo no encontrado:', conversationId)
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 })
    }

    console.log(`[Messages] ✅ Hilo encontrado usando schema: ${isPrismaSchema ? 'PRISMA' : 'SUPABASE'}`)

    // FIX CRÍTICO: Primero intentar obtener UserProfile (independiente de userType)
    // Esto maneja el caso de inmobiliarias que tienen UserProfile (ej: cambiaron de inquilino a inmobiliaria)
    console.log(`[Messages] Buscando UserProfile con Prisma para user: ${user.id}`)

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    })

    let senderId: string
    let userProfileId: string | null = null

    if (userProfile) {
      // CASO 1: Usuario tiene UserProfile (inquilino, busco, o inmobiliaria que migró de inquilino)
      senderId = userProfile.id
      userProfileId = userProfile.id
      console.log(`[Messages] ✅ UserProfile encontrado con Prisma: ${userProfile.id}`)
    } else {
      // CASO 2: Usuario NO tiene UserProfile (típicamente inmobiliaria nueva)
      // Usar user.id directamente
      senderId = user.id
      console.log(`[Messages] ℹ️  UserProfile NO encontrado - usando user.id como senderId: ${user.id}`)
    }

    // Crear nuevo mensaje
    const messageTable = isPrismaSchema ? 'Message' : 'messages'
    const conversationIdField = isPrismaSchema ? 'conversationId' : 'conversation_id'
    const senderIdField = isPrismaSchema ? 'senderId' : 'sender_id'
    const isReadField = isPrismaSchema ? 'isRead' : 'is_read'
    const createdAtField = isPrismaSchema ? 'createdAt' : 'created_at'
    const bodyField = 'body'  // Siempre 'body' en ambos schemas

    const messageData: any = {
      [conversationIdField]: conversationId,
      [senderIdField]: senderId,
      [bodyField]: content.trim(),
      [isReadField]: false,
      [createdAtField]: new Date().toISOString()
    }

    // Para PRISMA schema, necesitamos generar el ID manualmente
    if (isPrismaSchema) {
      messageData.id = crypto.randomUUID()
    }

    const { data: newMessage, error: messageError } = await supabase
      .from(messageTable)
      .insert(messageData)
      .select(`
        id,
        ${senderIdField},
        ${bodyField},
        ${createdAtField},
        ${isReadField}
      `)
      .single()

    if (messageError) {
      console.error('[Messages] ❌ Error creating message:', messageError)
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
    }

    // B6: Vincular adjuntos al mensaje si se proporcionaron
    if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
      console.log('[Messages] 🔗 Iniciando proceso de vinculación de adjuntos...')
      console.log('[Messages] 🔍 DEBUG - Datos de vinculación:', {
        attachmentIds,
        messageId: newMessage.id,
        authUserId: user.id,
        userProfileId: userProfileId
      })
      
      // FIX: Usar service role client para bypassear RLS
      const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey)
      
      // PASO 1: Validar que los adjuntos existen y pertenecen al usuario
      console.log('[Messages] 🔍 Validando propiedad de adjuntos...')
      const { data: attachmentsToLink, error: validateError } = await supabaseAdmin
        .from('message_attachments')
        .select('id, uploaded_by, storage_path, file_name')
        .in('id', attachmentIds)
      
      if (validateError) {
        console.error('[Messages] ❌ Error validando adjuntos:', validateError)
        return NextResponse.json({ 
          error: 'Error al validar adjuntos' 
        }, { status: 500 })
      }
      
      console.log('[Messages] 🔍 Adjuntos encontrados:', attachmentsToLink)
      
      // Verificar que todos los adjuntos existen
      if (!attachmentsToLink || attachmentsToLink.length !== attachmentIds.length) {
        console.error('[Messages] ❌ Algunos adjuntos no fueron encontrados:', {
          solicitados: attachmentIds.length,
          encontrados: attachmentsToLink?.length || 0,
          idssolicitados: attachmentIds,
          idsEncontrados: attachmentsToLink?.map(a => a.id) || []
        })
        return NextResponse.json({ 
          error: 'Algunos adjuntos no fueron encontrados' 
        }, { status: 400 })
      }
      
      // Verificar ownership (uploaded_by puede ser user.id O userProfileId si existe)
      const invalidAttachments = attachmentsToLink.filter(
        att => att.uploaded_by !== user.id && (!userProfileId || att.uploaded_by !== userProfileId)
      )
      
      if (invalidAttachments.length > 0) {
        console.error('[Messages] ❌ Adjuntos no autorizados:', {
          cantidadInvalidos: invalidAttachments.length,
          idsInvalidos: invalidAttachments.map(a => a.id),
          userIdEsperado: user.id,
          userProfileIdEsperado: userProfileId
        })
        return NextResponse.json({ 
          error: 'No autorizado para usar estos adjuntos' 
        }, { status: 403 })
      }
      
      console.log('[Messages] ✅ Todos los adjuntos validados correctamente')
      
      // PASO 2: Esperar 100ms para que la transacción del INSERT se confirme
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // PASO 3: Vincular adjuntos (SIN filtro uploaded_by - ya validado arriba)
      console.log('[Messages] 🔗 Vinculando adjuntos al mensaje...')
      const { data: updated, error: linkError } = await supabaseAdmin
        .from('message_attachments')
        .update({ message_id: newMessage.id })
        .in('id', attachmentIds)
        .select()
      
      if (linkError) {
        console.error('[Messages] ❌ Error vinculando adjuntos:', {
          error: linkError,
          code: linkError.code,
          message: linkError.message,
          details: linkError.details,
          hint: linkError.hint
        })
      } else if (!updated || updated.length === 0) {
        console.error('[Messages] ❌ No se vincularon adjuntos!', {
          esperados: attachmentIds.length,
          obtenidos: updated?.length || 0,
          attachmentIds,
          messageId: newMessage.id
        })
        console.error('[Messages] ⏳ Reintentando en 500ms...')
        
        await new Promise(resolve => setTimeout(resolve, 500))

        const { data: retryUpdated, error: retryError } = await supabaseAdmin
          .from('message_attachments')
          .update({ message_id: newMessage.id })
          .in('id', attachmentIds)
          .select()
        
        if (retryError || !retryUpdated || retryUpdated.length === 0) {
          console.error('[Messages] ❌ Reintento también falló:', {
            error: retryError?.message || 'No se actualizaron filas',
            esperados: attachmentIds.length,
            obtenidos: retryUpdated?.length || 0
          })
        } else {
          console.log('[Messages] ✅ Adjuntos vinculados en reintento:', {
            cantidad: retryUpdated.length,
            esperados: attachmentIds.length,
            attachmentIds: retryUpdated.map(a => a.id),
            messageId: newMessage.id
          })
        }
      } else {
        console.log('[Messages] ✅ Adjuntos vinculados exitosamente:', {
          cantidad: updated.length,
          esperados: attachmentIds.length,
          attachmentIds: updated.map(a => a.id),
          messageId: newMessage.id
        })
      }
    }

    // PROMPT A: Write-through de metadatos de conversación (best-effort)
    try {
      const now = new Date().toISOString()
      const conversationTable = isPrismaSchema ? 'Conversation' : 'conversations'
      const lastMessageAtField = isPrismaSchema ? 'lastMessageAt' : 'last_message_at'
      const updatedAtField = isPrismaSchema ? 'updatedAt' : 'updated_at'
      
      const messageCreatedAt = (newMessage as any)[createdAtField] || now
      const updateData: any = {
        [lastMessageAtField]: messageCreatedAt,
        [updatedAtField]: now
      }

      const { error: updateErr } = await supabase
        .from(conversationTable)
        .update(updateData)
        .eq('id', conversationId)

      if (updateErr) {
        console.error('[Messages] ⚠️ Failed to update conversation metadata:', updateErr.message)
      } else {
        console.log('[Messages] ✅ Conversation metadata updated:', conversationId)
      }
    } catch (metaErr: any) {
      console.error('[Messages] ⚠️ Exception updating conversation metadata:', metaErr.message)
    }

    // Obtener adjuntos del mensaje (si los hay)
    const attachmentsMap = await getMessagesAttachments([newMessage.id])
    const attachments = attachmentsMap.get(newMessage.id) || []

    // Formatear mensaje según contrato
    const messageSenderId = (newMessage as any)[senderIdField]
    const messageBody = (newMessage as any)[bodyField]
    const messageCreatedAt = (newMessage as any)[createdAtField]
    
    const formattedMessage = {
      id: newMessage.id,
      sender_id: messageSenderId,
      content: messageBody,
      created_at: messageCreatedAt,
      read_at: null, // Nuevo mensaje, no leído aún
      attachments // B6: Incluir adjuntos
    }

    // Log para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📨 Mensaje enviado en conversación ${conversationId}:`, {
        messageId: newMessage.id,
        senderId: senderId,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        attachmentsCount: attachments.length,
        schema: isPrismaSchema ? 'PRISMA' : 'SUPABASE'
      })
    }

    // Enviar notificación al destinatario
    try {
      // Determinar el destinatario (el otro participante del thread)
      let recipientProfileId: string
      if (isPrismaSchema) {
        recipientProfileId = thread.aId === senderId ? thread.bId : thread.aId
      } else {
        // Para Supabase schema, verificar qué campo corresponde
        const aId = thread.a_id || thread.participant_1
        const bId = thread.b_id || thread.participant_2
        recipientProfileId = aId === senderId ? bId : aId
      }

      // Obtener el userId real desde UserProfile (necesario para notificaciones)
      let recipientUserId: string
      if (recipientProfileId.startsWith('up_')) {
        // Es un UserProfile ID, necesitamos obtener el userId
        const recipientProfile = await prisma.userProfile.findUnique({
          where: { id: recipientProfileId }
        })
        if (!recipientProfile) {
          console.error('[Messages] ⚠️ Recipient UserProfile not found:', recipientProfileId)
          throw new Error('Recipient profile not found')
        }
        recipientUserId = recipientProfile.userId
      } else {
        // Ya es un userId de Supabase Auth
        recipientUserId = recipientProfileId
      }

      // Verificar si hay mensajes previos en esta conversación (para determinar si es respuesta)
      const messageTable = isPrismaSchema ? 'Message' : 'messages'
      const { count: totalMessagesCount } = await supabase
        .from(messageTable)
        .select('*', { count: 'exact', head: true })
        .eq(isPrismaSchema ? 'conversationId' : 'conversation_id', conversationId)

      // Verificar si hay mensajes no leídos previos del remitente
      const { count: unreadCount } = await supabase
        .from(messageTable)
        .select('*', { count: 'exact', head: true })
        .eq(isPrismaSchema ? 'conversationId' : 'conversation_id', conversationId)
        .eq(isPrismaSchema ? 'senderId' : 'sender_id', senderId)
        .eq(isPrismaSchema ? 'isRead' : 'is_read', false)

      // Determinar tipo de notificación
      const isReply = (totalMessagesCount || 0) > 1
      const notificationType = isReply ? 'MESSAGE_REPLY' : 'NEW_MESSAGE'

      // Determinar canales: solo email si es el primer mensaje no leído
      const shouldSendEmail = (unreadCount || 0) === 0
      const channels: NotificationChannel[] = shouldSendEmail ? ['in_app', 'email'] : ['in_app']

      // Obtener información del remitente para el mensaje de notificación
      const { data: senderData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()

      const senderName = senderData?.name || 'Un usuario'

      // Enviar notificación (async, no bloqueante)
      sendNotification({
        userId: recipientUserId,
        type: notificationType,
        title: isReply
          ? `${senderName} respondió a tu mensaje`
          : `Nuevo mensaje de ${senderName}`,
        message: content.length > 100 ? content.substring(0, 100) + '...' : content,
        channels: channels,
        metadata: {
          ctaUrl: `https://www.misionesarrienda.com.ar/messages?conversation=${conversationId}`,
          ctaText: 'Ver mensaje',
          senderName: senderName,
          conversationId: conversationId,
          messagePreview: content.substring(0, 100)
        },
        relatedId: newMessage.id,
        relatedType: 'message'
      }).catch(err => {
        console.error('[Messages] ⚠️ Error sending notification:', err)
        // No fallar el envío del mensaje si falla la notificación
      })

      console.log(`[Messages] 📧 Notificación enviada a ${recipientUserId} (canales: ${channels.join(', ')})`)
    } catch (notifError) {
      console.error('[Messages] ⚠️ Error preparando notificación:', notifError)
      // No fallar el envío del mensaje si falla la notificación
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage,
      conversationId
    })

  } catch (error) {
    console.error('[Messages] ❌ Error in thread messages POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
