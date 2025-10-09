import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMessagesAttachments } from '@/lib/messages/attachments-helper'

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

    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: 'Contenido del mensaje requerido' 
      }, { status: 400 })
    }

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
