const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkProfilePhotos() {
  console.log('=== AUDITORIA DE FOTOS DE PERFIL (UserProfile.photos) ===\n')

  const conversationId = 'cmgvj3n8u0001370dl4qtcnlc'

  // 1. Buscar conversación
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      a: {
        select: {
          id: true,
          userId: true,
          photos: true,
          bio: true
        }
      },
      b: {
        select: {
          id: true,
          userId: true,
          photos: true,
          bio: true
        }
      }
    }
  })

  if (!conv) {
    console.log('❌ Conversación no encontrada')
    return
  }

  console.log('✅ Conversación encontrada\n')

  // 2. Revisar datos de cada usuario
  for (const profile of [conv.a, conv.b]) {
    console.log(`--- UserProfile ${profile.id} ---`)
    console.log(`   userId: ${profile.userId}`)
    console.log(`   photos: ${profile.photos && profile.photos.length > 0 ? JSON.stringify(profile.photos) : 'EMPTY ARRAY []'}`)
    console.log(`   photos[0]: ${profile.photos && profile.photos.length > 0 ? profile.photos[0] : 'NULL'}`)
    console.log(`   bio: ${profile.bio ? profile.bio.substring(0, 50) + '...' : 'NULL'}`)

    // Buscar User relacionado
    const user = await prisma.user.findUnique({
      where: { id: profile.userId },
      select: {
        name: true,
        email: true,
        avatar: true
      }
    })

    if (user) {
      console.log(`   User.name: ${user.name}`)
      console.log(`   User.email: ${user.email}`)
      console.log(`   User.avatar: ${user.avatar || 'NULL'}`)
    }

    console.log('')
  }

  console.log('=== RESUMEN ===')
  console.log('Para que aparezca el avatar en mensajes, necesitas:')
  console.log('1. Subir fotos al perfil de comunidad (UserProfile.photos)')
  console.log('2. O configurar User.avatar')
  console.log('3. Si no hay ninguno, se auto-genera con iniciales')

  await prisma.$disconnect()
}

checkProfilePhotos()
