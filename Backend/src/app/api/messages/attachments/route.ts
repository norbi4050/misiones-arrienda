// =====================================================
// B6 - API: Upload Message Attachments
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAttachmentUpload } from '@/lib/attachment-guards';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeFileName as sanitizeFileNameNew, validateFilePath, scanAttachment } from '@/lib/file-sanitizer';
import { getUserPlanLimits } from '@/lib/plan-guards';
import { analytics } from '@/lib/analytics/track';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const prisma = new PrismaClient();

/**
 * POST /api/messages/attachments
 * Sube un adjunto a un mensaje
 */
export async function POST(request: NextRequest) {
  let user: any = null;
  
  try {
    // 1. Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('[ATTACHMENTS] No authorization header');
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    user = authUser;

    if (authError || !user) {
      console.log('[ATTACHMENTS] Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const threadId = formData.get('threadId') as string;
    const messageId = formData.get('messageId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId es requerido', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    console.log('[ATTACHMENTS] Upload request:', {
      authUserId: user.id,
      threadId,
      messageId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 2.5. Obtener plan del usuario para rate limiting
    const userLimits = await getUserPlanLimits(user.id);
    const planTier = userLimits?.plan_tier || 'free';

    // 2.6. Verificar rate limit
    const rateLimitCheck = await checkRateLimit(user.id, planTier);
    
    if (!rateLimitCheck.allowed) {
      console.warn('[ATTACHMENTS] Rate limit exceeded:', {
        userId: user.id,
        planTier,
        error: rateLimitCheck.error
      });
      
      // Track rate limit event
      analytics.attachmentRateLimited({
        userId: user.id,
        planTier,
        limit: rateLimitCheck.limit || 0,
        resetIn: rateLimitCheck.resetIn || 0
      }).catch(err => console.error('[ATTACHMENTS] Analytics error:', err));
      
      return NextResponse.json(
        { 
          error: rateLimitCheck.error,
          code: 'RATE_LIMITED',
          details: {
            remaining: rateLimitCheck.remaining,
            resetIn: rateLimitCheck.resetIn,
            limit: rateLimitCheck.limit
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitCheck.limit || 0),
            'X-RateLimit-Remaining': String(rateLimitCheck.remaining || 0),
            'X-RateLimit-Reset': String(Date.now() + (rateLimitCheck.resetIn || 0))
          }
        }
      );
    }

    console.log('[ATTACHMENTS] Rate limit OK:', {
      remaining: rateLimitCheck.remaining,
      limit: rateLimitCheck.limit
    });

    // 3. Validar participación en thread
    // FIX CRÍTICO: SIEMPRE intentar obtener UserProfile primero (independiente de userType)
    // Esto maneja el caso de inmobiliarias que tienen UserProfile (ej: cambiaron de inquilino a inmobiliaria)
    console.log(`[ATTACHMENTS] Buscando UserProfile con Prisma para user: ${user.id}`)

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    })

    let userProfileId: string

    if (userProfile) {
      // CASO 1: Usuario tiene UserProfile (inquilino, busco, o inmobiliaria que migró de inquilino)
      userProfileId = userProfile.id
      console.log(`[ATTACHMENTS] ✅ UserProfile encontrado con Prisma: ${userProfile.id}`)
    } else {
      // CASO 2: Usuario NO tiene UserProfile (típicamente inmobiliaria nueva)
      // Usar user.id directamente
      userProfileId = user.id
      console.log(`[ATTACHMENTS] ℹ️  UserProfile NO encontrado - usando user.id: ${user.id}`)
    }

    // Buscar conversación en tabla PRISMA
    const { data: conversation, error: convError } = await supabase
      .from('Conversation')
      .select('id, aId, bId, isActive')
      .eq('id', threadId)
      .eq('isActive', true)
      .single();

    if (convError || !conversation) {
      console.log('[ATTACHMENTS] Conversation not found in PRISMA tables:', threadId, convError?.message);
      return NextResponse.json(
        { error: 'Conversación no encontrada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es participante (comparar con PROFILE ID, no USER ID)
    const isParticipant = conversation.aId === userProfileId || conversation.bId === userProfileId;

    if (!isParticipant) {
      console.log('[ATTACHMENTS] User not participant:', user.id, 'profileId:', userProfileId, threadId);
      return NextResponse.json(
        { error: 'No tienes acceso a este hilo', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    console.log('[ATTACHMENTS] Thread validation OK - user is participant (PRISMA schema)');

    // 4. Validar límites de plan
    const validation = await validateAttachmentUpload(user.id, {
      size: file.size,
      type: file.type
    });

    if (!validation.allowed) {
      console.log('[ATTACHMENTS] Validation failed:', validation.errorCode, validation.error);
      return NextResponse.json(
        { 
          error: validation.error, 
          code: validation.errorCode,
          details: validation.details
        },
        { status: 403 }
      );
    }

    // 5. Sanitizar nombre de archivo (mejorado)
    const sanitizedName = sanitizeFileNameNew(file.name);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${sanitizedName}`;
    // IMPORTANTE: Usar userProfileId en el path
    const storagePath = `${userProfileId}/${threadId}/${fileName}`;

    // 5.1. Validar path (prevenir path traversal)
    if (!validateFilePath(storagePath)) {
      console.error('[ATTACHMENTS] Invalid file path detected:', storagePath);
      return NextResponse.json(
        { error: 'Nombre de archivo inválido', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 5.2. Virus scan placeholder (TODO V1.1)
    const fileBuffer = await file.arrayBuffer();
    const scanResult = await scanAttachment(Buffer.from(fileBuffer));
    
    if (!scanResult.clean) {
      console.error('[ATTACHMENTS] Virus detected:', scanResult.threat);
      return NextResponse.json(
        { 
          error: 'Archivo potencialmente peligroso detectado',
          code: 'SECURITY_THREAT',
          details: scanResult.threat
        },
        { status: 400 }
      );
    }

    // 6. Upload a storage
    console.log('[ATTACHMENTS] Uploading to storage:', {
      bucket: 'message-attachments',
      path: storagePath,
      size: fileBuffer.byteLength,
      contentType: file.type
    });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('[ATTACHMENTS] Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir el archivo', code: 'UPLOAD_ERROR', details: uploadError.message },
        { status: 500 }
      );
    }
    
    console.log('[ATTACHMENTS] Upload SUCCESS:', {
      path: uploadData.path,
      fullPath: uploadData.fullPath
    });

    // 7. Generar UUID para el adjunto (NO crear mensaje aún)
    const attachmentUuid = crypto.randomUUID();
    
    // 8. Crear registro en DB usando tabla message_attachments (snake_case)
    // NOTA: message_id será NULL hasta que el usuario envíe el mensaje
    // IMPORTANTE: user_id debe ser userProfileId
    const { data: attachment, error: dbError } = await supabase
      .from('message_attachments')
      .insert({
        id: attachmentUuid,
        message_id: messageId || null,  // NULL si no hay mensaje aún
        user_id: userProfileId,  // ← FIX: usar userProfileId
        path: storagePath,
        mime: file.type,
        size_bytes: file.size,
        file_name: file.name  // ← FIX: Agregar file_name para que aparezca en el chat
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: eliminar archivo
      await supabase.storage
        .from('message-attachments')
        .remove([storagePath]);

      console.error('[ATTACHMENTS] DB error:', dbError);
      return NextResponse.json(
        { error: 'Error al guardar el adjunto', code: 'DB_ERROR', details: dbError.message },
        { status: 500 }
      );
    }

    // 9. Generar URL firmada (1 hora de validez)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('message-attachments')
      .createSignedUrl(storagePath, 3600);

    if (urlError) {
      console.error('[ATTACHMENTS] Signed URL error:', urlError);
    }

    const signedUrl = signedUrlData?.signedUrl || '';

    console.log('[ATTACHMENTS] SUCCESS - File uploaded, waiting for message send', {
      authUserId: user.id,
      userProfileId: userProfileId,
      threadId,
      attachmentId: attachment.id,
      mime: file.type,
      size: file.size,
      messageId: messageId || 'pending',
      savedWithUserId: userProfileId  // ← Este es el ID que se guardó en la DB
    });

    // 9.5. Track upload success
    // TODO: Move analytics to client-side or use server-compatible tracking
    // analytics.attachmentUpload({
    //   threadId,
    //   messageId: finalMessageId || undefined,
    //   mime: file.type,
    //   sizeBytes: file.size,
    //   planTier,
    //   result: 'success'
    // }).catch(err => console.error('[ATTACHMENTS] Analytics error:', err));

    // 10. Respuesta exitosa
    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        url: signedUrl,
        mime: file.type,
        sizeBytes: attachment.sizeBytes,
        fileName: file.name,
        createdAt: attachment.createdAt
      },
      messageId: messageId || null  // NULL si no hay mensaje aún
    });

  } catch (error) {
    console.error('[ATTACHMENTS] Exception:', error);
    
    // Track upload error
    // TODO: Move analytics to client-side or use server-compatible tracking
    // const userLimits = await getUserPlanLimits(user?.id || '').catch(() => null);
    // analytics.attachmentUpload({
    //   threadId: '',
    //   mime: 'unknown',
    //   sizeBytes: 0,
    //   planTier: userLimits?.plan_tier || 'free',
    //   result: 'error',
    //   errorCode: 'INTERNAL_ERROR'
    // }).catch(err => console.error('[ATTACHMENTS] Analytics error:', err));
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
