const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkConversationIds() {
  console.log('='.repeat(100))
  console.log('INVESTIGACIÓN: ESTRUCTURA DE CONVERSATION Y IDS')
  console.log('='.repeat(100))

  // Buscar conversación específica del error
  const conversationId = 'cmgvj3n8u0001370dl4qtcnlc'

  console.log('\n📋 CONVERSACIÓN DEL ERROR (ID: cmgvj3n8u0001370dl4qtcnlc)')
  console.log('─'.repeat(100))

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      a: {
        select: {
          id: true,              // ID del UserProfile
          userId: true,          // ID del User (FK)
          role: true,
          avatar_url: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              avatar: true
            }
          }
        }
      },
      b: {
        select: {
          id: true,              // ID del UserProfile
          userId: true,          // ID del User (FK)
          role: true,
          avatar_url: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              avatar: true
            }
          }
        }
      }
    }
  })

  if (!conv) {
    console.log('❌ Conversación NO ENCONTRADA')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Conversación encontrada\n`)

  console.log('👤 PARTICIPANTE A:')
  console.log(`   Conversation.aId: ${conv.aId}`)
  console.log(`   UserProfile.id: ${conv.a.id}`)
  console.log(`   UserProfile.userId (FK a User): ${conv.a.userId}`)
  console.log(`   UserProfile.role: ${conv.a.role}`)
  console.log(`   User.id: ${conv.a.user.id}`)
  console.log(`   User.name: ${conv.a.user.name}`)
  console.log(`   User.email: ${conv.a.user.email}`)
  console.log(`   User.userType: ${conv.a.user.userType}`)
  console.log(`   ⚠️  aId === UserProfile.id: ${conv.aId === conv.a.id}`)
  console.log(`   ⚠️  aId === User.id: ${conv.aId === conv.a.userId}`)

  console.log('\n👤 PARTICIPANTE B:')
  console.log(`   Conversation.bId: ${conv.bId}`)
  console.log(`   UserProfile.id: ${conv.b.id}`)
  console.log(`   UserProfile.userId (FK a User): ${conv.b.userId}`)
  console.log(`   UserProfile.role: ${conv.b.role}`)
  console.log(`   User.id: ${conv.b.user.id}`)
  console.log(`   User.name: ${conv.b.user.name}`)
  console.log(`   User.email: ${conv.b.user.email}`)
  console.log(`   User.userType: ${conv.b.user.userType}`)
  console.log(`   ⚠️  bId === UserProfile.id: ${conv.bId === conv.b.id}`)
  console.log(`   ⚠️  bId === User.id: ${conv.bId === conv.b.userId}`)

  console.log('\n\n📊 ANÁLISIS DEL ENDPOINT /api/messages/attachments')
  console.log('─'.repeat(100))

  console.log('\nEL ENDPOINT HACE ESTO:')
  console.log('1. Autentica usuario → obtiene user.id (el ID de auth.users)')
  console.log('2. Si es INMOBILIARIA:')
  console.log('   userProfileId = user.id (DIRECTO)')
  console.log('3. Si es INQUILINO/BUSCO:')
  console.log('   userProfileId = UserProfile.id (buscando con userId = user.id)')
  console.log('4. Valida: conversation.aId === userProfileId || conversation.bId === userProfileId')

  console.log('\n\n🔍 VERIFICACIÓN DE LÓGICA')
  console.log('─'.repeat(100))

  // Simular lo que haría el endpoint para cada participante
  console.log('\n🧪 SIMULACIÓN PARTICIPANTE A (si intenta subir adjunto):')
  console.log(`   User autenticado: ${conv.a.user.id}`)
  console.log(`   User.userType: ${conv.a.user.userType}`)

  let userProfileId_A
  if (conv.a.user.userType === 'INMOBILIARIA' || conv.a.user.userType === 'inmobiliaria') {
    userProfileId_A = conv.a.user.id  // Usa user.id directamente
    console.log(`   → Es inmobiliaria, userProfileId = user.id = ${userProfileId_A}`)
  } else {
    userProfileId_A = conv.a.id  // Usa UserProfile.id
    console.log(`   → Es inquilino/busco, userProfileId = UserProfile.id = ${userProfileId_A}`)
  }

  const isParticipant_A = conv.aId === userProfileId_A || conv.bId === userProfileId_A
  console.log(`   Validación: aId (${conv.aId}) === userProfileId (${userProfileId_A}) || bId (${conv.bId}) === userProfileId (${userProfileId_A})`)
  console.log(`   Resultado: ${isParticipant_A ? '✅ PERMITIDO' : '❌ 403 FORBIDDEN'}`)

  console.log('\n🧪 SIMULACIÓN PARTICIPANTE B (si intenta subir adjunto):')
  console.log(`   User autenticado: ${conv.b.user.id}`)
  console.log(`   User.userType: ${conv.b.user.userType}`)

  let userProfileId_B
  if (conv.b.user.userType === 'INMOBILIARIA' || conv.b.user.userType === 'inmobiliaria') {
    userProfileId_B = conv.b.user.id  // Usa user.id directamente
    console.log(`   → Es inmobiliaria, userProfileId = user.id = ${userProfileId_B}`)
  } else {
    userProfileId_B = conv.b.id  // Usa UserProfile.id
    console.log(`   → Es inquilino/busco, userProfileId = UserProfile.id = ${userProfileId_B}`)
  }

  const isParticipant_B = conv.aId === userProfileId_B || conv.bId === userProfileId_B
  console.log(`   Validación: aId (${conv.aId}) === userProfileId (${userProfileId_B}) || bId (${conv.bId}) === userProfileId (${userProfileId_B})`)
  console.log(`   Resultado: ${isParticipant_B ? '✅ PERMITIDO' : '❌ 403 FORBIDDEN'}`)

  console.log('\n\n📝 CONCLUSIÓN')
  console.log('─'.repeat(100))

  if (!isParticipant_A || !isParticipant_B) {
    console.log('❌ PROBLEMA IDENTIFICADO:')
    console.log('\nLa tabla Conversation almacena UserProfile.id en aId y bId.')
    console.log('PERO el endpoint /api/messages/attachments usa user.id para inmobiliarias.')
    console.log('\n🔧 SOLUCIÓN:')
    console.log('El endpoint debe buscar UserProfile.id SIEMPRE, para todos los tipos de usuario.')
    console.log('Incluso las inmobiliarias DEBEN tener un UserProfile para participar en conversaciones.')
  } else {
    console.log('✅ La lógica parece correcta para esta conversación.')
    console.log('Puede haber otro problema (token, permisos, etc.)')
  }

  console.log('\n\n🔎 VERIFICAR USUARIOS ESPECÍFICOS')
  console.log('─'.repeat(100))

  // Verificar si hay inmobiliarias sin UserProfile
  const usersWithoutProfile = await prisma.user.findMany({
    where: {
      userType: {
        in: ['INMOBILIARIA', 'inmobiliaria', 'AGENCY']
      },
      communityProfile: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      userType: true
    },
    take: 5
  })

  if (usersWithoutProfile.length > 0) {
    console.log(`\n⚠️  Encontradas ${usersWithoutProfile.length} inmobiliarias SIN UserProfile:`)
    usersWithoutProfile.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - ID: ${u.id}`)
    })
    console.log('\n💡 Estas inmobiliarias NO pueden participar en conversaciones hasta que tengan UserProfile.')
  } else {
    console.log('\n✅ Todas las inmobiliarias tienen UserProfile.')
  }

  await prisma.$disconnect()
}

checkConversationIds()
  .catch(err => {
    console.error('\n❌ Error:', err)
    process.exit(1)
  })
