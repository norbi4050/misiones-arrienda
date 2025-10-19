// =====================================================
// Script automático para ejecutar test E2E completo
// =====================================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Hardcoded credentials (safe for this local test)
const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'

const supabase = createClient(supabaseUrl, supabaseKey)

function log(emoji, ...args) {
  console.log(`${emoji}`, ...args)
}

function logSection(title) {
  console.log('\n' + '='.repeat(80))
  console.log(title)
  console.log('='.repeat(80))
}

// =====================================================
// PASO 0: Obtener datos de prueba
// =====================================================

async function getTestData() {
  logSection('PASO 0: Obtener Datos de Prueba')

  // Buscar usuario con UserProfile (usar nombres correctos de columnas)
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, userId')
    .limit(1)
    .single()

  if (profileError || !profiles) {
    log('❌', 'Error buscando UserProfile:', profileError?.message)
    return null
  }

  log('✅', 'UserProfile encontrado:')
  log('   Profile ID:', profiles.id)
  log('   User ID:', profiles.userId)

  // Buscar conversación donde participe
  const { data: conversations, error: convError } = await supabase
    .from('Conversation')
    .select('id, aId, bId, isActive')
    .or(`aId.eq.${profiles.id},bId.eq.${profiles.id}`)
    .eq('isActive', true)
    .limit(1)
    .single()

  if (convError || !conversations) {
    log('❌', 'Error buscando conversación:', convError?.message)
    return null
  }

  log('✅', 'Conversación encontrada:')
  log('   Conversation ID:', conversations.id)
  log('   Participants:', conversations.aId, '↔', conversations.bId)

  return {
    userProfileId: profiles.id,
    userId: profiles.userId,
    conversationId: conversations.id
  }
}

// =====================================================
// PASO 1: Upload Attachment SIN messageId
// =====================================================

async function testUploadAttachment(userProfileId, conversationId) {
  logSection('PASO 1: Upload Attachment (message_id = NULL)')

  // Crear imagen de prueba (1x1 PNG transparente)
  const testFilePath = path.join(__dirname, 'test-attachment.png')
  // PNG de 1x1 píxel transparente (base64)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  const fileBuffer = Buffer.from(pngBase64, 'base64')
  fs.writeFileSync(testFilePath, fileBuffer)

  const file = {
    path: testFilePath,
    name: 'test-attachment.png',
    size: fileBuffer.length,
    type: 'image/png'
  }

  log('📤', 'Subiendo archivo de prueba...')
  log('   File:', file.name)
  log('   Size:', file.size, 'bytes')

  // Simular upload
  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name}`
  const storagePath = `${userProfileId}/${conversationId}/${fileName}`

  // Upload a storage (reusar el buffer que ya tenemos)
  const uploadBuffer = fs.readFileSync(file.path)

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('message-attachments')
    .upload(storagePath, uploadBuffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    log('❌', 'Error uploading to storage:', uploadError.message)
    fs.unlinkSync(testFilePath)
    return null
  }

  log('✅', 'Archivo subido a storage:', uploadData.path)

  // Generar signed URL
  const { data: signedUrlData } = await supabase.storage
    .from('message-attachments')
    .createSignedUrl(storagePath, 3600)

  const signedUrl = signedUrlData?.signedUrl || ''

  // Crear registro en DB con message_id = NULL
  const attachmentId = crypto.randomUUID()

  log('📝', 'Creando registro en DB con message_id = NULL...')

  const { data: attachment, error: dbError } = await supabase
    .from('message_attachments')
    .insert({
      id: attachmentId,
      message_id: null,  // ✅ CLAVE: debe permitir NULL
      uploaded_by: userProfileId,
      storage_path: storagePath,
      mime_type: file.type,
      file_size: file.size,
      file_name: file.name,
      storage_url: signedUrl
    })
    .select()
    .single()

  if (dbError) {
    log('❌', 'ERROR CRÍTICO al crear attachment en DB:')
    log('   Code:', dbError.code)
    log('   Message:', dbError.message)
    log('   Details:', dbError.details)
    log('   Hint:', dbError.hint)

    // Cleanup
    await supabase.storage.from('message-attachments').remove([storagePath])
    fs.unlinkSync(testFilePath)
    return null
  }

  log('✅', 'Attachment creado en DB:')
  log('   ID:', attachment.id)
  log('   message_id:', attachment.message_id === null ? 'NULL ✅' : `${attachment.message_id} ❌`)
  log('   uploaded_by:', attachment.uploaded_by)
  log('   storage_path:', attachment.storage_path)

  if (attachment.message_id !== null) {
    log('⚠️', 'ADVERTENCIA: message_id NO es NULL! Valor:', attachment.message_id)
  } else {
    log('🎉', 'PERFECTO: message_id es NULL como esperado')
  }

  // Cleanup local file
  fs.unlinkSync(testFilePath)

  return { attachment, storagePath }
}

// =====================================================
// PASO 2: Enviar Mensaje y Vincular Attachment
// =====================================================

async function testSendMessage(userProfileId, conversationId, attachmentId) {
  logSection('PASO 2: Enviar Mensaje con Attachment')

  log('📨', 'Creando mensaje...')

  const messageId = crypto.randomUUID()
  const messageData = {
    id: messageId,
    conversationId: conversationId,
    senderId: userProfileId,
    body: 'Test E2E - Mensaje con adjunto automático',
    isRead: false,
    createdAt: new Date().toISOString()
  }

  const { data: newMessage, error: messageError } = await supabase
    .from('Message')
    .insert(messageData)
    .select()
    .single()

  if (messageError) {
    log('❌', 'Error creando mensaje:', messageError.message)
    return null
  }

  log('✅', 'Mensaje creado:', newMessage.id)

  // Esperar un poco
  await new Promise(resolve => setTimeout(resolve, 200))

  // Vincular attachment
  log('🔗', 'Vinculando attachment al mensaje...')

  const { data: updated, error: linkError } = await supabase
    .from('message_attachments')
    .update({ message_id: newMessage.id })
    .eq('id', attachmentId)
    .eq('uploaded_by', userProfileId)
    .select()

  if (linkError) {
    log('❌', 'ERROR vinculando attachment:')
    log('   Code:', linkError.code)
    log('   Message:', linkError.message)
    return { message: newMessage, linkSuccess: false }
  }

  if (!updated || updated.length === 0) {
    log('❌', 'No se vinculó ningún attachment (0 rows)')
    return { message: newMessage, linkSuccess: false }
  }

  log('✅', 'Attachment vinculado exitosamente:')
  log('   Attachment ID:', updated[0].id)
  log('   message_id:', updated[0].message_id)
  log('   De NULL → ', newMessage.id, '✅')

  return { message: newMessage, attachment: updated[0], linkSuccess: true }
}

// =====================================================
// PASO 3: Verificar
// =====================================================

async function verifyLink(messageId, attachmentId) {
  logSection('PASO 3: Verificar Vinculación')

  const { data: attachments, error } = await supabase
    .from('message_attachments')
    .select('*')
    .eq('message_id', messageId)

  if (error) {
    log('❌', 'Error:', error.message)
    return false
  }

  log('📎', 'Attachments del mensaje:', attachments.length)

  const found = attachments.find(a => a.id === attachmentId)

  if (!found) {
    log('❌', 'Attachment NO encontrado en mensaje')
    return false
  }

  log('✅', 'Attachment vinculado correctamente:')
  log('   ID:', found.id)
  log('   message_id:', found.message_id)
  log('   file_name:', found.file_name)

  return true
}

// =====================================================
// PASO 4: Cleanup
// =====================================================

async function cleanup(messageId, attachmentId, storagePath) {
  logSection('PASO 4: Cleanup')

  log('🗑️', 'Limpiando datos de prueba...')

  // Eliminar mensaje (cascade borra attachment)
  if (messageId) {
    await supabase.from('Message').delete().eq('id', messageId)
    log('✅', 'Mensaje eliminado')
  }

  // Eliminar archivo de storage
  if (storagePath) {
    await supabase.storage.from('message-attachments').remove([storagePath])
    log('✅', 'Archivo eliminado de storage')
  }
}

// =====================================================
// MAIN
// =====================================================

async function runTest() {
  logSection('🧪 TEST E2E AUTOMÁTICO - Attachments Flow')

  let testData = null
  let uploadResult = null
  let messageResult = null

  try {
    // PASO 0: Obtener datos
    testData = await getTestData()
    if (!testData) {
      log('❌', 'No se pudieron obtener datos de prueba')
      return
    }

    // PASO 1: Upload attachment
    uploadResult = await testUploadAttachment(
      testData.userProfileId,
      testData.conversationId
    )

    if (!uploadResult) {
      log('❌', 'Upload falló - abortando test')
      return
    }

    // PASO 2: Send message
    messageResult = await testSendMessage(
      testData.userProfileId,
      testData.conversationId,
      uploadResult.attachment.id
    )

    if (!messageResult || !messageResult.linkSuccess) {
      log('❌', 'Vinculación falló')
      return
    }

    // PASO 3: Verify
    const verified = await verifyLink(
      messageResult.message.id,
      uploadResult.attachment.id
    )

    if (!verified) {
      log('❌', 'Verificación falló')
      return
    }

    // SUCCESS!
    logSection('✅✅✅ TEST EXITOSO ✅✅✅')
    log('🎉', 'Flujo completo funcionó perfectamente:')
    log('')
    log('   1. ✅ Attachment subido con message_id = NULL')
    log('   2. ✅ Mensaje creado en DB')
    log('   3. ✅ Attachment vinculado (NULL → message_id)')
    log('   4. ✅ Vinculación verificada')
    log('')
    log('🔥', 'El fix está funcionando correctamente!')

  } catch (error) {
    log('❌', 'Error fatal:', error.message)
    console.error(error)
  } finally {
    // Cleanup
    if (uploadResult && messageResult) {
      await cleanup(
        messageResult.message?.id,
        uploadResult.attachment?.id,
        uploadResult.storagePath
      )
    }
  }

  logSection('🏁 Test Finalizado')
}

// Ejecutar
runTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal:', err)
    process.exit(1)
  })
