require('dotenv').config()
// =====================================================
// TEST END-TO-END: Flujo completo de attachments
// =====================================================
//
// Este script prueba el flujo completo:
// 1. Upload attachment sin messageId (debe quedar con message_id = NULL)
// 2. Enviar mensaje con attachmentId
// 3. Verificar que attachment se vinculó correctamente
//
// REQUISITOS:
// - Tener usuario autenticado
// - Tener conversación activa
// - Variables de entorno configuradas
// =====================================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// =====================================================
// CONFIGURACIÓN DE PRUEBA
// =====================================================

// TODO: Reemplaza estos valores con datos reales de tu DB
const TEST_CONFIG = {
  // Usuario que va a enviar el mensaje (debe tener UserProfile)
  userId: 'REEMPLAZAR_CON_USER_ID_REAL',

  // Conversación existente donde el usuario participa
  conversationId: 'REEMPLAZAR_CON_CONVERSATION_ID_REAL',

  // Contenido del mensaje de prueba
  messageContent: 'Test E2E - Mensaje con adjunto',

  // Path al archivo de prueba (creamos uno pequeño)
  testFilePath: path.join(__dirname, 'test-file.txt')
}

// =====================================================
// FUNCIONES HELPER
// =====================================================

function log(emoji, ...args) {
  console.log(`${emoji}`, ...args)
}

function logSection(title) {
  console.log('\n' + '='.repeat(80))
  console.log(title)
  console.log('='.repeat(80))
}

// Crear archivo de prueba
function createTestFile() {
  const content = 'Este es un archivo de prueba para el flujo E2E de attachments\n'
  fs.writeFileSync(TEST_CONFIG.testFilePath, content)
  log('✅', 'Archivo de prueba creado:', TEST_CONFIG.testFilePath)
  return {
    path: TEST_CONFIG.testFilePath,
    size: Buffer.byteLength(content),
    type: 'text/plain',
    name: 'test-file.txt'
  }
}

// Limpiar archivo de prueba
function cleanupTestFile() {
  if (fs.existsSync(TEST_CONFIG.testFilePath)) {
    fs.unlinkSync(TEST_CONFIG.testFilePath)
    log('🗑️', 'Archivo de prueba eliminado')
  }
}

// =====================================================
// PASO 1: Verificar Configuración
// =====================================================

async function verifyConfig() {
  logSection('PASO 1: Verificar Configuración')

  // Verificar usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('id', TEST_CONFIG.userId)
    .single()

  if (userError || !user) {
    log('❌', 'Usuario no encontrado:', TEST_CONFIG.userId)
    return false
  }

  log('✅', 'Usuario encontrado:', user.email, '(', user.user_type, ')')

  // Verificar UserProfile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, user_id')
    .eq('user_id', TEST_CONFIG.userId)
    .single()

  if (profileError || !profile) {
    log('❌', 'UserProfile no encontrado para usuario:', TEST_CONFIG.userId)
    return false
  }

  log('✅', 'UserProfile encontrado:', profile.id)

  // Verificar conversación
  const { data: conversation, error: convError } = await supabase
    .from('Conversation')
    .select('id, aId, bId, isActive')
    .eq('id', TEST_CONFIG.conversationId)
    .single()

  if (convError || !conversation) {
    log('❌', 'Conversación no encontrada:', TEST_CONFIG.conversationId)
    return false
  }

  // Verificar que el usuario participa
  const isParticipant = conversation.aId === profile.id || conversation.bId === profile.id

  if (!isParticipant) {
    log('❌', 'Usuario no es participante de la conversación')
    log('   UserProfile.id:', profile.id)
    log('   Conversation.aId:', conversation.aId)
    log('   Conversation.bId:', conversation.bId)
    return false
  }

  log('✅', 'Usuario es participante de la conversación')
  log('✅', 'Configuración válida - procediendo con pruebas...')

  return { user, profile, conversation }
}

// =====================================================
// PASO 2: Upload Attachment SIN messageId
// =====================================================

async function testUploadAttachment(file, userProfileId, conversationId) {
  logSection('PASO 2: Upload Attachment (sin messageId)')

  log('📤', 'Uploading attachment...')
  log('   File:', file.name)
  log('   Size:', file.size, 'bytes')
  log('   UserProfile ID:', userProfileId)
  log('   Conversation ID:', conversationId)

  // Simular lo que hace el endpoint
  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name}`
  const storagePath = `${userProfileId}/${conversationId}/${fileName}`

  // Upload a storage
  const fileBuffer = fs.readFileSync(file.path)

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('message-attachments')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    log('❌', 'Error uploading to storage:', uploadError.message)
    return null
  }

  log('✅', 'File uploaded to storage:', uploadData.path)

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
      message_id: null,  // ✅ Esto debe funcionar ahora
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
    log('❌', 'Error creando registro en DB:', dbError.message)
    log('   Code:', dbError.code)
    log('   Details:', dbError.details)

    // Cleanup: eliminar archivo
    await supabase.storage
      .from('message-attachments')
      .remove([storagePath])

    return null
  }

  log('✅', 'Attachment creado en DB:')
  log('   ID:', attachment.id)
  log('   message_id:', attachment.message_id, '(debe ser NULL)')
  log('   uploaded_by:', attachment.uploaded_by)
  log('   storage_path:', attachment.storage_path)

  // Verificar que message_id es realmente NULL
  if (attachment.message_id !== null) {
    log('⚠️', 'ADVERTENCIA: message_id NO es NULL:', attachment.message_id)
  } else {
    log('✅', 'CORRECTO: message_id es NULL')
  }

  return { attachment, storagePath }
}

// =====================================================
// PASO 3: Enviar Mensaje y Vincular Attachment
// =====================================================

async function testSendMessageWithAttachment(profile, conversationId, attachmentId) {
  logSection('PASO 3: Enviar Mensaje con Attachment')

  log('📨', 'Enviando mensaje...')
  log('   Sender ID (UserProfile.id):', profile.id)
  log('   Conversation ID:', conversationId)
  log('   Attachment ID:', attachmentId)
  log('   Content:', TEST_CONFIG.messageContent)

  // Crear mensaje
  const messageId = crypto.randomUUID()
  const messageData = {
    id: messageId,
    conversationId: conversationId,
    senderId: profile.id,
    body: TEST_CONFIG.messageContent,
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

  // Esperar un poco (simular delay de transacción)
  await new Promise(resolve => setTimeout(resolve, 100))

  // Vincular attachment al mensaje
  log('🔗', 'Vinculando attachment al mensaje...')

  const { data: updated, error: linkError } = await supabase
    .from('message_attachments')
    .update({ message_id: newMessage.id })
    .eq('id', attachmentId)
    .eq('uploaded_by', profile.id)  // Verificar ownership
    .select()

  if (linkError) {
    log('❌', 'Error vinculando attachment:', linkError.message)
    log('   Code:', linkError.code)
    log('   Details:', linkError.details)
    return { message: newMessage, linkSuccess: false }
  }

  if (!updated || updated.length === 0) {
    log('❌', 'No se vinculó ningún attachment (0 rows updated)')
    log('   Posibles causas:')
    log('   - Attachment no existe')
    log('   - uploaded_by no coincide')
    log('   - Attachment ya vinculado a otro mensaje')
    return { message: newMessage, linkSuccess: false }
  }

  log('✅', 'Attachment vinculado exitosamente:')
  log('   Attachment ID:', updated[0].id)
  log('   message_id:', updated[0].message_id, '(debe ser', newMessage.id, ')')
  log('   uploaded_by:', updated[0].uploaded_by)

  return { message: newMessage, attachment: updated[0], linkSuccess: true }
}

// =====================================================
// PASO 4: Verificar Vinculación
// =====================================================

async function verifyAttachmentLink(messageId, attachmentId) {
  logSection('PASO 4: Verificar Vinculación')

  log('🔍', 'Verificando que attachment está vinculado al mensaje...')

  const { data: attachments, error } = await supabase
    .from('message_attachments')
    .select('*')
    .eq('message_id', messageId)

  if (error) {
    log('❌', 'Error consultando attachments:', error.message)
    return false
  }

  log('📎', 'Attachments encontrados para mensaje:', attachments.length)

  if (attachments.length === 0) {
    log('❌', 'No se encontraron attachments para el mensaje')
    return false
  }

  const ourAttachment = attachments.find(a => a.id === attachmentId)

  if (!ourAttachment) {
    log('❌', 'El attachment esperado NO está en la lista')
    return false
  }

  log('✅', 'Attachment encontrado y vinculado correctamente:')
  log('   ID:', ourAttachment.id)
  log('   message_id:', ourAttachment.message_id)
  log('   file_name:', ourAttachment.file_name)
  log('   storage_path:', ourAttachment.storage_path)

  return true
}

// =====================================================
// PASO 5: Cleanup
// =====================================================

async function cleanup(messageId, attachmentId, storagePath) {
  logSection('PASO 5: Cleanup')

  log('🗑️', 'Limpiando datos de prueba...')

  // Eliminar mensaje (esto debería eliminar attachment por CASCADE)
  if (messageId) {
    const { error: delMsgError } = await supabase
      .from('Message')
      .delete()
      .eq('id', messageId)

    if (delMsgError) {
      log('⚠️', 'Error eliminando mensaje:', delMsgError.message)
    } else {
      log('✅', 'Mensaje eliminado')
    }
  }

  // Verificar que attachment se eliminó por CASCADE
  if (attachmentId) {
    const { data: att } = await supabase
      .from('message_attachments')
      .select('id')
      .eq('id', attachmentId)
      .single()

    if (att) {
      log('⚠️', 'Attachment NO se eliminó por CASCADE, eliminando manualmente...')
      await supabase
        .from('message_attachments')
        .delete()
        .eq('id', attachmentId)
      log('✅', 'Attachment eliminado manualmente')
    } else {
      log('✅', 'Attachment eliminado por CASCADE')
    }
  }

  // Eliminar archivo de storage
  if (storagePath) {
    const { error: delStorageError } = await supabase.storage
      .from('message-attachments')
      .remove([storagePath])

    if (delStorageError) {
      log('⚠️', 'Error eliminando archivo de storage:', delStorageError.message)
    } else {
      log('✅', 'Archivo eliminado de storage')
    }
  }

  cleanupTestFile()
}

// =====================================================
// MAIN
// =====================================================

async function runE2ETest() {
  logSection('🧪 TEST END-TO-END: Flujo de Attachments')

  let testFile = null
  let uploadResult = null
  let messageResult = null

  try {
    // PASO 1: Verificar configuración
    const config = await verifyConfig()
    if (!config) {
      log('❌', 'Configuración inválida - abortando test')
      log('\n📝 Por favor actualiza TEST_CONFIG en el script con datos reales')
      return
    }

    // PASO 2: Crear archivo y upload attachment
    testFile = createTestFile()
    uploadResult = await testUploadAttachment(
      testFile,
      config.profile.id,
      TEST_CONFIG.conversationId
    )

    if (!uploadResult) {
      log('❌', 'Upload de attachment falló - abortando test')
      return
    }

    // PASO 3: Enviar mensaje y vincular
    messageResult = await testSendMessageWithAttachment(
      config.profile,
      TEST_CONFIG.conversationId,
      uploadResult.attachment.id
    )

    if (!messageResult || !messageResult.linkSuccess) {
      log('❌', 'Vinculación de attachment falló')
      return
    }

    // PASO 4: Verificar vinculación
    const verifySuccess = await verifyAttachmentLink(
      messageResult.message.id,
      uploadResult.attachment.id
    )

    if (!verifySuccess) {
      log('❌', 'Verificación falló')
      return
    }

    // SUCCESS!
    logSection('✅✅✅ TEST EXITOSO ✅✅✅')
    log('✅', 'Flujo completo funcionó correctamente:')
    log('   1. ✅ Attachment subido con message_id = NULL')
    log('   2. ✅ Mensaje creado')
    log('   3. ✅ Attachment vinculado al mensaje')
    log('   4. ✅ Vinculación verificada')

  } catch (error) {
    log('❌', 'Error durante el test:', error.message)
    console.error(error)
  } finally {
    // PASO 5: Cleanup
    if (uploadResult || messageResult) {
      await cleanup(
        messageResult?.message?.id,
        uploadResult?.attachment?.id,
        uploadResult?.storagePath
      )
    } else {
      cleanupTestFile()
    }
  }

  logSection('🏁 Test Finalizado')
}

// Ejecutar test
runE2ETest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
