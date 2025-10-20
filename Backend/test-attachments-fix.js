const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Script de prueba para verificar que el fix funcionará
 * Simula la lógica ANTES y DESPUÉS del fix
 */
async function testFix() {
  console.log('='.repeat(100))
  console.log('TEST: SIMULACIÓN FIX PARA ATTACHMENTS 403')
  console.log('='.repeat(100))

  const conversationId = 'cmgvj3n8u0001370dl4qtcnlc'
  const cesarId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Inmobiliaria
  const carlosId = '6403f9d2-e846-4c70-87e0-e051127d9500' // Inquilino

  // Obtener conversación
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId }
  })

  if (!conv) {
    console.log('❌ Conversación no encontrada')
    await prisma.$disconnect()
    return
  }

  console.log('\n📋 CONVERSACIÓN:')
  console.log(`   ID: ${conv.id}`)
  console.log(`   Conversation.aId: ${conv.aId}`)
  console.log(`   Conversation.bId: ${conv.bId}`)

  // ==========================================
  // TEST 1: CESAR (Inmobiliaria)
  // ==========================================
  console.log('\n\n🧪 TEST 1: CESAR (Inmobiliaria)')
  console.log('─'.repeat(100))

  const cesarProfile = await prisma.userProfile.findUnique({
    where: { userId: cesarId }
  })

  console.log('\n❌ LÓGICA ANTES (INCORRECTA):')
  console.log(`   User.id: ${cesarId}`)
  console.log(`   isAgency: true (detectado por user_metadata)`)
  console.log(`   → userProfileId = user.id = ${cesarId}`)

  const isParticipantBefore_Cesar = conv.aId === cesarId || conv.bId === cesarId
  console.log(`   Validación: aId === ${cesarId} || bId === ${cesarId}`)
  console.log(`   Resultado: ${isParticipantBefore_Cesar ? '✅ PERMITIDO' : '❌ 403 FORBIDDEN'}`)

  console.log('\n✅ LÓGICA DESPUÉS (CORRECTA):')
  console.log(`   User.id: ${cesarId}`)
  console.log(`   Buscar UserProfile.findUnique({ userId: "${cesarId}" })`)
  console.log(`   UserProfile encontrado: ${cesarProfile ? cesarProfile.id : 'NO'}`)

  const userProfileId_Cesar = cesarProfile ? cesarProfile.id : cesarId
  console.log(`   → userProfileId = ${userProfileId_Cesar}`)

  const isParticipantAfter_Cesar = conv.aId === userProfileId_Cesar || conv.bId === userProfileId_Cesar
  console.log(`   Validación: aId === ${userProfileId_Cesar} || bId === ${userProfileId_Cesar}`)
  console.log(`   Resultado: ${isParticipantAfter_Cesar ? '✅ PERMITIDO' : '❌ 403 FORBIDDEN'}`)

  // ==========================================
  // TEST 2: CARLOS (Inquilino)
  // ==========================================
  console.log('\n\n🧪 TEST 2: CARLOS (Inquilino)')
  console.log('─'.repeat(100))

  const carlosProfile = await prisma.userProfile.findUnique({
    where: { userId: carlosId }
  })

  console.log('\n✅ LÓGICA ANTES (Ya estaba correcta para inquilinos):')
  console.log(`   User.id: ${carlosId}`)
  console.log(`   isAgency: false`)
  console.log(`   Buscar UserProfile.findUnique({ userId: "${carlosId}" })`)
  console.log(`   UserProfile encontrado: ${carlosProfile ? carlosProfile.id : 'NO'}`)
  console.log(`   → userProfileId = ${carlosProfile?.id || 'ERROR'}`)

  if (carlosProfile) {
    const isParticipant_Carlos = conv.aId === carlosProfile.id || conv.bId === carlosProfile.id
    console.log(`   Validación: aId === ${carlosProfile.id} || bId === ${carlosProfile.id}`)
    console.log(`   Resultado: ${isParticipant_Carlos ? '✅ PERMITIDO' : '❌ 403 FORBIDDEN'}`)
  }

  console.log('\n✅ LÓGICA DESPUÉS (Sin cambios - ya funcionaba):')
  console.log(`   User.id: ${carlosId}`)
  console.log(`   Buscar UserProfile.findUnique({ userId: "${carlosId}" })`)
  console.log(`   UserProfile encontrado: ${carlosProfile ? carlosProfile.id : 'NO'}`)

  const userProfileId_Carlos = carlosProfile ? carlosProfile.id : carlosId
  console.log(`   → userProfileId = ${userProfileId_Carlos}`)

  const isParticipantAfter_Carlos = conv.aId === userProfileId_Carlos || conv.bId === userProfileId_Carlos
  console.log(`   Validación: aId === ${userProfileId_Carlos} || bId === ${userProfileId_Carlos}`)
  console.log(`   Resultado: ${isParticipantAfter_Carlos ? '✅ PERMITIDO' : '❌ 403 FORBIDDEN'}`)

  // ==========================================
  // RESUMEN
  // ==========================================
  console.log('\n\n📊 RESUMEN DEL FIX')
  console.log('─'.repeat(100))
  console.log('\n✅ El fix resolverá el problema:')
  console.log(`   - Cesar (inmobiliaria): ANTES = ${isParticipantBefore_Cesar ? 'PERMITIDO' : '403 ❌'} → DESPUÉS = ${isParticipantAfter_Cesar ? 'PERMITIDO ✅' : '403'}`)
  console.log(`   - Carlos (inquilino):   ANTES = PERMITIDO ✅ → DESPUÉS = ${isParticipantAfter_Carlos ? 'PERMITIDO ✅' : '403'}`)

  if (!isParticipantBefore_Cesar && isParticipantAfter_Cesar && isParticipantAfter_Carlos) {
    console.log('\n✅✅✅ FIX VALIDADO - EL CÓDIGO PROPUESTO FUNCIONARÁ CORRECTAMENTE ✅✅✅')
  } else {
    console.log('\n⚠️  ADVERTENCIA: Verificar lógica del fix')
  }

  await prisma.$disconnect()
}

testFix()
  .catch(err => {
    console.error('\n❌ Error en test:', err)
    process.exit(1)
  })
