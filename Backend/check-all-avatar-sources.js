const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAllAvatarSources() {
  console.log('=== BUSCANDO AVATARES EN TODAS LAS FUENTES ===\n')

  const conversationId = 'cmgvj3n8u0001370dl4qtcnlc'

  // 1. Buscar conversación
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      a: true,  // UserProfile A
      b: true   // UserProfile B
    }
  })

  if (!conv) {
    console.log('❌ Conversación no encontrada')
    return
  }

  console.log('✅ Conversación encontrada')
  console.log(`   aId: ${conv.aId}`)
  console.log(`   bId: ${conv.bId}\n`)

  // 2. Buscar datos de cada usuario
  for (const profile of [conv.a, conv.b]) {
    console.log(`--- UserProfile ${profile.id} ---`)
    console.log(`   userId: ${profile.userId}`)
    console.log(`   avatar_url (UserProfile): ${profile.avatar_url || 'NULL'}`)

    // 2a. Buscar en tabla User
    const user = await prisma.user.findUnique({
      where: { id: profile.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        companyName: true
      }
    })

    if (user) {
      console.log(`   User.name: ${user.name || 'NULL'}`)
      console.log(`   User.email: ${user.email || 'NULL'}`)
      console.log(`   User.avatar: ${user.avatar || 'NULL'}`)
      console.log(`   User.companyName: ${user.companyName || 'NULL'}`)
    }

    // 2b. Buscar en auth.users de Supabase (usando raw query)
    try {
      const authUser = await prisma.$queryRaw`
        SELECT id, email, raw_user_meta_data
        FROM auth.users
        WHERE id::text = ${profile.userId}
      `

      if (authUser && authUser.length > 0) {
        console.log(`   auth.users.email: ${authUser[0].email || 'NULL'}`)
        console.log(`   auth.users.raw_user_meta_data:`, authUser[0].raw_user_meta_data)
      }
    } catch (err) {
      console.log(`   ⚠️  No se pudo acceder a auth.users: ${err.message}`)
    }

    console.log('')
  }

  console.log('=== FIN AUDITORIA ===')
  await prisma.$disconnect()
}

checkAllAvatarSources()
