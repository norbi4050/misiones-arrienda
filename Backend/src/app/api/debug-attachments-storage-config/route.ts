import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'No autenticado',
        authError
      }, { status: 401 })
    }

    // 2. Verificar bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    const messageAttachmentsBucket = buckets?.find(b => b.name === 'message-attachments')

    // 3. Verificar políticas del bucket
    let bucketPolicies = null
    try {
      // Intentar listar archivos para verificar permisos
      const { data: files, error: listError } = await supabase.storage
        .from('message-attachments')
        .list('', { limit: 1 })
      
      bucketPolicies = {
        canList: !listError,
        listError: listError?.message
      }
    } catch (e: any) {
      bucketPolicies = {
        canList: false,
        listError: e.message
      }
    }

    // 4. Verificar adjuntos recientes del usuario
    const { data: userProfile } = await supabase
      .from('UserProfile')
      .select('id')
      .eq('userId', user.id)
      .single()

    let recentAttachments: any = null
    if (userProfile) {
      const { data: attachments, error: attError } = await supabase
        .from('MessageAttachment')
        .select('*')
        .eq('userId', userProfile.id)
        .order('createdAt', { ascending: false })
        .limit(5)

      recentAttachments = {
        count: attachments?.length || 0,
        attachments: attachments?.map(a => ({
          id: a.id,
          path: a.path,
          messageId: a.messageId,
          createdAt: a.createdAt
        })),
        error: attError?.message
      }

      // 5. Intentar generar signed URL para el más reciente
      if (attachments && attachments.length > 0) {
        const firstAttachment = attachments[0]
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('message-attachments')
          .createSignedUrl(firstAttachment.path, 60)

        recentAttachments.signedUrlTest = {
          path: firstAttachment.path,
          success: !urlError,
          url: signedUrlData?.signedUrl,
          error: urlError?.message
        }
      }
    }

    // 6. Verificar configuración de RLS en MessageAttachment
    let rlsCheck = null
    let rlsError = null
    try {
      const result = await supabase.rpc('check_rls_policies', { table_name: 'MessageAttachment' })
      rlsCheck = result.data
      rlsError = result.error
    } catch (e: any) {
      rlsError = { message: 'RPC no disponible' }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      userProfile: userProfile?.id,
      bucket: {
        exists: !!messageAttachmentsBucket,
        name: messageAttachmentsBucket?.name,
        public: messageAttachmentsBucket?.public,
        id: messageAttachmentsBucket?.id
      },
      bucketPolicies,
      recentAttachments,
      rlsCheck: {
        data: rlsCheck,
        error: rlsError?.message
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[Debug Attachments Storage] Error:', error)
    return NextResponse.json({
      error: 'Error en diagnóstico',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
