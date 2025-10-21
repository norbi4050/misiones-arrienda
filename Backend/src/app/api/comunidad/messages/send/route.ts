import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';
import { sendNotification } from '@/lib/notification-service';

const sendMessageSchema = z.object({
  propertyId: z.string().min(1, 'Property ID requerido'),
  toUserId: z.string().min(1, 'Usuario destinatario requerido'),
  message: z.string().min(1, 'Mensaje requerido').max(1000, 'Mensaje muy largo')
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Validar datos de entrada
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { propertyId, toUserId, message } = validation.data;

    // Verificar que la propiedad existe
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, user_id, title')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar que el destinatario es el dueño de la propiedad
    if (property.user_id !== toUserId) {
      return NextResponse.json({ error: 'Usuario destinatario inválido' }, { status: 400 });
    }

    // Evitar que el dueño se envíe mensajes a sí mismo
    if (user.id === toUserId) {
      return NextResponse.json({ error: 'No puedes enviarte mensajes a ti mismo' }, { status: 400 });
    }

    // Crear conversación o usar existente
    const conversationId = [user.id, toUserId].sort().join('-');

    // Insertar mensaje
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: toUserId,
        content: message,
        property_id: propertyId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
    }

    // Actualizar última actividad de la conversación
    await supabase
      .from('conversations')
      .upsert({
        id: conversationId,
        user1_id: user.id < toUserId ? user.id : toUserId,
        user2_id: user.id < toUserId ? toUserId : user.id,
        last_message_at: new Date().toISOString(),
        property_id: propertyId
      }, { onConflict: 'id' });

    // Obtener nombre del remitente para la notificación
    const { data: senderData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    const senderName = senderData?.name || senderData?.email?.split('@')[0] || 'Un usuario';

    // Enviar notificación al destinatario (no esperar para no bloquear)
    sendNotification({
      userId: toUserId,
      type: 'NEW_MESSAGE',
      title: `Nuevo mensaje de ${senderName}`,
      message: `${senderName} te ha enviado un mensaje sobre "${property.title}".`,
      channels: ['email', 'in_app'],
      metadata: {
        messageId: newMessage.id,
        conversationId: conversationId,
        propertyId: propertyId,
        propertyTitle: property.title,
        senderName: senderName,
        messagePreview: message.substring(0, 100),
        ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/comunidad/mensajes?conversation=${conversationId}`,
        ctaText: 'Ver mensaje'
      },
      relatedId: newMessage.id,
      relatedType: 'message'
    }).catch(err => {
      console.error('[Messages API] Error sending notification:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente',
      messageId: newMessage.id
    });

  } catch (error) {
    console.error('Error in send message API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
