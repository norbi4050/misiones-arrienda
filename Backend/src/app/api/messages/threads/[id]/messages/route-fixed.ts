import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getMessagesAttachments } from '@/lib/messages/attachments-helper'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// POST /api/messages/threads/[id]/messages → enviar mensaje
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id: threadId } = params

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { content, attachmentIds } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: 'Contenido del mensaje requerido' 
      }, { status: 400 })
    }

    console.log('[Messages] Creating message with attachments:', attachmentIds)

    // Intentar primero con tabla Conversation (PRISMA schema)
    let thread: any = null
    let isPrismaSchema = false
    
    const { data: prismaThread, error: prismaError } = await supabase
      .from('Conversation')
      .select('id, aId, bId, isActive')
      .eq('id', threadId)
      .eq('isActive', true)
      .single()

    if (!prismaError && prismaThread) {
      // Obtener UserProfile del usuario actual
      const { data: userProfile } = await supabase
        .from('UserProfile')
        .select('id')
        .eq('userId', user.id)
        .single()

      if (userProfile) {
        // Verificar que el usuario es participante
        if (prismaThread.aId === userProfile.id || prismaThread.bId === userProfile.id) {
          thread = prismaThread
          isPrismaSchema = true
        }
      }
    }

    // Si no se encontró en Conversation, intentar con conversations (SUPABASE schema)
    if (!thread) {
      const { data: supabaseThread, error: supabaseError } = await supabase
        .from('conversations')
        .select('id, sender_id, receiver_id, property_id')
        .eq('id', threadId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .single()

      if (!supabaseError && supabaseThread) {
        thread = supabaseThread
        isPrismaSchema = false
      }
    }

    if (!thread) {
      console.error('[Messages] ❌ Hilo no encontrado:', threadId)
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 })
    }

    console.log(`[Messages] ✅ Hilo encontrado usando schema: ${isPrismaSchema ? 'PRISMA' : 'SUPABASE'}`)

    // Obtener el perfil del usuario para el sender_id
    const profileTable = isPrismaSchema ? 'UserProfile' : 'user_profiles'
    const profileIdField = isPrismaSchema ? 'userId' : 'user_id'
    
    const { data: userProfile, error: profileError } = await supabase
      .from(profileTable)
      .select('id')
      .eq(profileIdField, user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('[Messages] ❌ Perfil no encontrado para usuario:', user.id)
      return NextResponse.json({ 
        error: 'Perfil de usuario no encontrado' 
      }, { status: 403 })
    }

    // Crear nuevo mensaje
    const messageTable = isPrismaSchema ? 'Message' : 'messages'
    const conversationIdField = isPrismaSchema ? 'conversationId' : 'conversation_id'
    const senderIdField = isPrismaSchema ? 'senderId' : 'sender_id'
    const isReadField = isPrismaSchema ? 'isRead' : 'is_read'
    const createdAtField = isPrismaSchema ? 'createdAt' : 'created_at'
    const bodyField = isPrismaSchema ? 'body' : 'content'

    const messageData: any = {
      [conversationIdField]: threadId,
      [senderIdField]: userProfile.id,
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
        userProfileId: userProfile.id
      })
      
      // FIX: Usar service role client para bypassear RLS
      const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey)
      
      // PASO 1: Validar que los adjuntos existen y pertenecen al usuario
      console.log('[Messages] 🔍 Validando propiedad de adjuntos...')
      const { data: attachmentsToLink, error: validateError } = await supabaseAdmin
        .from('MessageAttachment')
        .select('id, userId, path, fileName')
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
      
      // Verificar ownership (userId puede ser user.id O userProfile.id)
      const invalidAttachments = attachmentsToLink.filter(
        att => att.userId !== user.id && att.userId !== userProfile.id
      )
      
      if (invalidAttachments.length > 0) {
        console.error('[Messages] ❌ Adjuntos no autorizados:', {
          cantidadInvalidos: invalidAttachments.length,
          idsInvalidos: invalidAttachments.map(a => a.id),
          userIdEsperado: user.id,
          userProfileIdEsperado: userProfile.id
        })
        return NextResponse.json({ 
          error: 'No autorizado para usar estos adjuntos' 
        }, { status: 403 })
      }
      
      console.log('[Messages] ✅ Todos los adjuntos validados correctamente')
      
      // PASO 2: Esperar 100ms para que la transacción del INSERT se confirme
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // PASO 3: Vincular adjuntos (SIN filtro userId - ya validado arriba)
      console.log('[Messages] 🔗 Vinculando adjuntos al mensaje...')
      const { data: updated, error: linkError } = await supabaseAdmin
        .from('MessageAttachment')
        .update({ messageId: newMessage.id })
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
          .from('MessageAttachment')
          .update({ messageId: newMessage.id })
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
        .eq('id', threadId)

      if (updateErr) {
        console.error('[Messages] ⚠️ Failed to update conversation metadata:', updateErr.message)
      } else {
        console.log('[Messages] ✅ Conversation metadata updated:', threadId)
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
      console.log(`📨 Mensaje enviado en hilo ${threadId}:`, {
        messageId: newMessage.id,
        senderId: userProfile.id,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        attachmentsCount: attachments.length,
        schema: isPrismaSchema ? 'PRISMA' : 'SUPABASE'
      })
    }

    return NextResponse.json({
      success: true,
      message: formattedMessage,
      threadId
    })

  } catch (error) {
    console.error('[Messages] ❌ Error in thread messages POST:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
